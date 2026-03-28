export { VaultService } from './vault.js';
export type { DatabaseAdapter, QueryResult } from './types.js';
export { ReactNativeDatabaseAdapter } from './react-native-adapter.js';

export async function createDatabaseAdapter(): Promise<import('./types.js').DatabaseAdapter> {
  const { SqlJsDatabaseAdapter } = await import('./sqljs-adapter.js');
  return new SqlJsDatabaseAdapter();
}
