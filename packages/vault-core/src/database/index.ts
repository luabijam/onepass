import type { DatabaseAdapter } from './types.js';

function isReactNative(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).navigator !== 'undefined' &&
    (globalThis as Record<string, unknown>).navigator === 'ReactNative'
  );
}

export async function createDatabaseAdapter(): Promise<DatabaseAdapter> {
  if (isReactNative()) {
    const { ReactNativeDatabaseAdapter } = await import('./react-native-adapter.js');
    return new ReactNativeDatabaseAdapter();
  } else {
    const { BetterSqliteDatabaseAdapter } = await import('./better-sqlite-adapter.js');
    return new BetterSqliteDatabaseAdapter();
  }
}

export { VaultService } from './vault.js';
export type { DatabaseAdapter, QueryResult } from './types.js';
export { ReactNativeDatabaseAdapter } from './react-native-adapter.js';
export { isReactNative };
