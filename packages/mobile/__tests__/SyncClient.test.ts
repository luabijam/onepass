import axios from 'axios';
import { SyncClient, SyncError } from '../src/services/SyncClient';
import type { SyncPayload, SyncResponse } from '@onepass/vault-core';

jest.mock('axios');

describe('SyncClient', () => {
  const mockAxiosCreate = axios.create as jest.MockedFunction<typeof axios.create>;
  const mockGet = jest.fn();
  const mockPost = jest.fn();

  const defaultConfig = {
    baseUrl: 'http://192.168.1.100:3456',
    token: 'test-token',
  };

  const mockSyncResponse: SyncResponse = {
    entries: [
      {
        id: 'entry-1',
        title: 'Test Entry',
        username: 'user@example.com',
        password: 'password123',
        categoryId: 'cat-1',
        isFavorite: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'Social',
        icon: '👥',
        color: '#3498db',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ],
    serverTs: 1704067200000,
  };

  const mockPayload: SyncPayload = {
    entries: [
      {
        id: 'entry-2',
        title: 'New Entry',
        username: 'newuser@example.com',
        password: 'newpass123',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ],
    categories: [],
  };

  function createAxiosError(
    message: string,
    code: string,
    status?: number,
    data?: { error?: string }
  ): unknown {
    const error = {
      isAxiosError: true,
      message,
      code,
      response: status ? { status, data } : undefined,
    };
    return error;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosCreate.mockReturnValue({
      get: mockGet,
      post: mockPost,
    } as unknown as ReturnType<typeof axios.create>);
  });

  describe('constructor', () => {
    it('creates axios instance with correct configuration', () => {
      const client = new SyncClient(defaultConfig);
      expect(client).toBeDefined();

      expect(mockAxiosCreate).toHaveBeenCalledWith({
        baseURL: 'http://192.168.1.100:3456',
        timeout: 30000,
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('accepts custom timeout', () => {
      const client = new SyncClient({ ...defaultConfig, timeout: 60000 });
      expect(client).toBeDefined();

      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('pull', () => {
    it('fetches sync data with GET request', async () => {
      mockGet.mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient(defaultConfig);
      const result = await client.pull();

      expect(mockGet).toHaveBeenCalledWith('/sync', { params: {} });
      expect(result).toEqual(mockSyncResponse);
    });

    it('sends since parameter when provided', async () => {
      mockGet.mockResolvedValue({ data: mockSyncResponse });
      const since = new Date('2024-01-01T00:00:00Z');

      const client = new SyncClient(defaultConfig);
      await client.pull(since);

      expect(mockGet).toHaveBeenCalledWith('/sync', {
        params: { since: since.getTime() },
      });
    });

    it('handles 401 unauthorized error', async () => {
      mockGet.mockRejectedValue(
        createAxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', 401, {
          error: 'Invalid token',
        })
      );

      const client = new SyncClient(defaultConfig);
      await expect(client.pull()).rejects.toThrow(SyncError);

      try {
        await client.pull();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('unauthorized');
        expect((e as SyncError).statusCode).toBe(401);
      }
    });

    it('handles timeout error', async () => {
      mockGet.mockRejectedValue(createAxiosError('timeout of 30000ms exceeded', 'ECONNABORTED'));

      const client = new SyncClient(defaultConfig);
      await expect(client.pull()).rejects.toThrow(SyncError);

      try {
        await client.pull();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('timeout');
      }
    });

    it('handles network error', async () => {
      mockGet.mockRejectedValue(createAxiosError('Network Error', 'ERR_NETWORK'));

      const client = new SyncClient(defaultConfig);
      await expect(client.pull()).rejects.toThrow(SyncError);

      try {
        await client.pull();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('network');
      }
    });

    it('handles 500 server error', async () => {
      mockGet.mockRejectedValue(
        createAxiosError('Request failed with status code 500', 'ERR_BAD_REQUEST', 500, {})
      );

      const client = new SyncClient(defaultConfig);

      try {
        await client.pull();
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('server_error');
        expect((e as SyncError).statusCode).toBe(500);
      }
    });
  });

  describe('push', () => {
    it('sends sync data with POST request', async () => {
      mockPost.mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient(defaultConfig);
      const result = await client.push(mockPayload);

      expect(mockPost).toHaveBeenCalledWith('/sync', expect.any(Object));
      expect(result).toEqual(mockSyncResponse);
    });

    it('serializes payload correctly', async () => {
      mockPost.mockResolvedValue({ data: mockSyncResponse });

      const client = new SyncClient(defaultConfig);
      await client.push(mockPayload);

      const callArgs = mockPost.mock.calls[0];
      const sentData = callArgs[1];

      expect(sentData.entries).toHaveLength(1);
      expect(sentData.entries[0].id).toBe('entry-2');
      expect(sentData.entries[0].createdAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('handles 400 bad request error', async () => {
      mockPost.mockRejectedValue(
        createAxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', 400, {
          error: 'Invalid payload: entries must be an array',
        })
      );

      const client = new SyncClient(defaultConfig);
      await expect(client.push(mockPayload)).rejects.toThrow(SyncError);

      try {
        await client.push(mockPayload);
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).message).toBe('Invalid payload: entries must be an array');
      }
    });

    it('handles 404 not found error', async () => {
      mockPost.mockRejectedValue(
        createAxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST', 404, {})
      );

      const client = new SyncClient(defaultConfig);

      try {
        await client.push(mockPayload);
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('not_found');
        expect((e as SyncError).statusCode).toBe(404);
      }
    });

    it('handles 403 forbidden error', async () => {
      mockPost.mockRejectedValue(
        createAxiosError('Request failed with status code 403', 'ERR_BAD_REQUEST', 403, {
          error: 'Access denied',
        })
      );

      const client = new SyncClient(defaultConfig);

      try {
        await client.push(mockPayload);
      } catch (e) {
        expect(e).toBeInstanceOf(SyncError);
        expect((e as SyncError).code).toBe('forbidden');
        expect((e as SyncError).statusCode).toBe(403);
      }
    });
  });

  describe('SyncError', () => {
    it('creates error with all properties', () => {
      const error = new SyncError('Test error', 'test_code', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('test_code');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('SyncError');
    });

    it('creates error without statusCode', () => {
      const error = new SyncError('Test error', 'test_code');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('test_code');
      expect(error.statusCode).toBeUndefined();
    });
  });
});
