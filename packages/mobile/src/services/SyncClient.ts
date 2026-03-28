import axios, { AxiosInstance, AxiosError } from 'axios';
import type { SyncPayload, SyncResponse } from '@onepass/vault-core';
import { deserializeSyncResponse, serializeSyncPayload } from '@onepass/vault-core';

export interface SyncClientConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryCount?: number
  ) {
    super(message);
    this.name = 'SyncError';
  }

  get isRetryable(): boolean {
    return this.code === 'network' || this.code === 'timeout' || this.code === 'server_error';
  }
}

function isAxiosErrorLike(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

export class SyncClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: SyncClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
    this.maxRetries = config.maxRetries ?? 0;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  async pull(since?: Date): Promise<SyncResponse> {
    return this.withRetry(async () => {
      try {
        const params = since ? { since: since.getTime() } : {};
        const response = await this.client.get<SyncResponse>('/sync', { params });
        return deserializeSyncResponse(JSON.stringify(response.data));
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  async push(payload: SyncPayload): Promise<SyncResponse> {
    return this.withRetry(async () => {
      try {
        const serializedPayload = serializeSyncPayload(payload);
        const response = await this.client.post<SyncResponse>(
          '/sync',
          JSON.parse(serializedPayload)
        );
        return deserializeSyncResponse(JSON.stringify(response.data));
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: SyncError | null = null;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        if (!(error instanceof SyncError)) {
          throw error;
        }

        lastError = error;

        if (!error.isRetryable || attempt === this.maxRetries) {
          throw new SyncError(error.message, error.code, error.statusCode, attempt + 1);
        }

        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
        attempt++;
      }
    }

    throw new SyncError(
      lastError?.message ?? 'Unknown error',
      lastError?.code ?? 'unknown',
      lastError?.statusCode,
      this.maxRetries + 1
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: unknown): SyncError {
    if (isAxiosErrorLike(error)) {
      const statusCode = error.response?.status;
      const data = error.response?.data as { error?: string } | undefined;
      const message = data?.error ?? error.message;
      const code = this.getErrorCode(error);
      return new SyncError(message, code, statusCode);
    }
    if (error instanceof Error) {
      return new SyncError(error.message, 'unknown');
    }
    return new SyncError('An unknown error occurred', 'unknown');
  }

  private getErrorCode(error: AxiosError): string {
    if (error.code === 'ECONNABORTED') {
      return 'timeout';
    }
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      return 'network';
    }
    const status = error.response?.status;
    if (status) {
      if (status === 401) return 'unauthorized';
      if (status === 403) return 'forbidden';
      if (status === 404) return 'not_found';
      if (status >= 500 && status < 600) return 'server_error';
    }
    return 'http_error';
  }
}
