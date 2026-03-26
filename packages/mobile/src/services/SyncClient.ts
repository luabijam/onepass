import axios, { AxiosInstance, AxiosError } from 'axios';
import type { SyncPayload, SyncResponse } from '@onepass/vault-core';
import { deserializeSyncResponse, serializeSyncPayload } from '@onepass/vault-core';

export interface SyncClientConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'SyncError';
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

  constructor(config: SyncClientConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async pull(since?: Date): Promise<SyncResponse> {
    try {
      const params = since ? { since: since.getTime() } : {};
      const response = await this.client.get<SyncResponse>('/sync', { params });
      return deserializeSyncResponse(JSON.stringify(response.data));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async push(payload: SyncPayload): Promise<SyncResponse> {
    try {
      const serializedPayload = serializeSyncPayload(payload);
      const response = await this.client.post<SyncResponse>('/sync', JSON.parse(serializedPayload));
      return deserializeSyncResponse(JSON.stringify(response.data));
    } catch (error) {
      throw this.handleError(error);
    }
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
    switch (error.response?.status) {
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 500:
        return 'server_error';
      default:
        return 'http_error';
    }
  }
}
