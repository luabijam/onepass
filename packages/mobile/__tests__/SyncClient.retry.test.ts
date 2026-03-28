import { SyncClient, SyncError } from '../src/services/SyncClient';
import type { SyncPayload, SyncResponse } from '@onepass/vault-core';

jest.mock('axios');

import axios from 'axios';

const mockAxiosCreate = axios.create as jest.MockedFunction<typeof axios.create>;
const mockGet = jest.fn();
const mockPost = jest.fn();

const defaultConfig = {
  baseUrl: 'http://192.168.1.100:3456',
  token: 'test-token',
};

const mockSyncResponse: SyncResponse = {
  entries: [],
  categories: [],
  serverTs: 1704067200000,
};

function createAxiosError(
  message: string,
  code: string,
  status?: number,
  data?: { error?: string }
): unknown {
  return {
    isAxiosError: true,
    message,
    code,
    response: status ? { status, data } : undefined,
  };
}

describe('SyncClient - Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosCreate.mockReturnValue({
      get: mockGet,
      post: mockPost,
    } as unknown as ReturnType<typeof axios.create>);
  });

  describe('pull with retry', () => {
    it('retries on network error up to max retries', async () => {
      mockGet
        .mockRejectedValueOnce(createAxiosError('Network Error', 'ERR_NETWORK'))
        .mockRejectedValueOnce(createAxiosError('Network Error', 'ERR_NETWORK'))
        .mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });
      const result = await client.pull();

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSyncResponse);
    });

    it('retries on timeout error', async () => {
      mockGet
        .mockRejectedValueOnce(createAxiosError('timeout', 'ECONNABORTED'))
        .mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });
      const result = await client.pull();

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSyncResponse);
    });

    it('retries on 5xx server errors', async () => {
      mockGet
        .mockRejectedValueOnce(createAxiosError('Server Error', 'ERR_BAD_REQUEST', 500))
        .mockRejectedValueOnce(createAxiosError('Bad Gateway', 'ERR_BAD_REQUEST', 502))
        .mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });
      const result = await client.pull();

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockSyncResponse);
    });

    it('does not retry on 4xx client errors', async () => {
      mockGet.mockRejectedValue(
        createAxiosError('Unauthorized', 'ERR_BAD_REQUEST', 401, { error: 'Invalid token' })
      );

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });

      await expect(client.pull()).rejects.toThrow(SyncError);

      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('fails after max retries exhausted', async () => {
      mockGet.mockRejectedValue(createAxiosError('Network Error', 'ERR_NETWORK'));

      const client = new SyncClient({ ...defaultConfig, maxRetries: 2, retryDelay: 10 });

      await expect(client.pull()).rejects.toThrow(SyncError);

      expect(mockGet).toHaveBeenCalledTimes(3);
    });

    it('throws retry-exhausted error with retry count', async () => {
      mockGet.mockRejectedValue(createAxiosError('Network Error', 'ERR_NETWORK'));

      const client = new SyncClient({ ...defaultConfig, maxRetries: 2, retryDelay: 10 });

      try {
        await client.pull();
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        const syncError = e as SyncError;
        expect(syncError.code).toBe('network');
        expect(syncError.retryCount).toBe(3);
      }
    });

    it('uses exponential backoff between retries', async () => {
      jest.useFakeTimers();
      const delays: number[] = [];
      mockGet.mockImplementation(async () => {
        delays.push(Date.now());
        if (delays.length < 3) {
          throw createAxiosError('Network Error', 'ERR_NETWORK');
        }
        return { data: mockSyncResponse };
      });

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 100 });
      const pullPromise = client.pull();

      await jest.runAllTimersAsync();
      await pullPromise;

      const delay1 = delays[1] - delays[0];
      const delay2 = delays[2] - delays[1];

      expect(delay1).toBeGreaterThanOrEqual(100);
      expect(delay2).toBeGreaterThanOrEqual(200);

      jest.useRealTimers();
    });
  });

  describe('push with retry', () => {
    const mockPayload: SyncPayload = {
      entries: [],
      categories: [],
    };

    it('retries push on transient errors', async () => {
      mockPost
        .mockRejectedValueOnce(createAxiosError('Network Error', 'ERR_NETWORK'))
        .mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });
      const result = await client.push(mockPayload);

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSyncResponse);
    });

    it('does not retry push on 4xx errors', async () => {
      mockPost.mockRejectedValue(
        createAxiosError('Bad Request', 'ERR_BAD_REQUEST', 400, { error: 'Invalid payload' })
      );

      const client = new SyncClient({ ...defaultConfig, maxRetries: 3, retryDelay: 10 });

      await expect(client.push(mockPayload)).rejects.toThrow(SyncError);

      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('default retry configuration', () => {
    it('has no retries by default for backwards compatibility', async () => {
      mockGet.mockRejectedValue(createAxiosError('Network Error', 'ERR_NETWORK'));

      const client = new SyncClient(defaultConfig);

      await expect(client.pull()).rejects.toThrow(SyncError);

      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SyncError - Enhanced', () => {
  it('includes retry count in error', () => {
    const error = new SyncError('Network error after 3 retries', 'network', undefined, 3);

    expect(error.message).toBe('Network error after 3 retries');
    expect(error.code).toBe('network');
    expect(error.retryCount).toBe(3);
  });

  it('is retryable for network errors', () => {
    const error = new SyncError('Network error', 'network');

    expect(error.isRetryable).toBe(true);
  });

  it('is retryable for timeout errors', () => {
    const error = new SyncError('Timeout', 'timeout');

    expect(error.isRetryable).toBe(true);
  });

  it('is retryable for server errors', () => {
    const error = new SyncError('Server error', 'server_error', 500);

    expect(error.isRetryable).toBe(true);
  });

  it('is not retryable for auth errors', () => {
    const error = new SyncError('Unauthorized', 'unauthorized', 401);

    expect(error.isRetryable).toBe(false);
  });

  it('is not retryable for not found errors', () => {
    const error = new SyncError('Not found', 'not_found', 404);

    expect(error.isRetryable).toBe(false);
  });

  it('is not retryable for unknown errors', () => {
    const error = new SyncError('Unknown error', 'unknown');

    expect(error.isRetryable).toBe(false);
  });
});
