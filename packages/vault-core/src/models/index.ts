export * from './entry.js';
export * from './category.js';

/**
 * Sync payload sent from client to server.
 */
export interface SyncPayload {
  entries: import('./entry.js').Entry[];
  categories: import('./category.js').Category[];
}

/**
 * Sync response from server to client.
 */
export interface SyncResponse {
  entries: import('./entry.js').Entry[];
  categories: import('./category.js').Category[];
  serverTs: number;
}
