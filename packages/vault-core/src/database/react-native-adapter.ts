import type { DatabaseAdapter, QueryResult } from './types.js';

function isReactNative(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).navigator !== 'undefined' &&
    (globalThis as Record<string, unknown>).navigator === 'ReactNative'
  );
}

let sqliteModule: typeof import('react-native-quick-sqlite').open | null = null;

async function getReactNativeSQLite() {
  if (!sqliteModule) {
    const module = await import('react-native-quick-sqlite');
    sqliteModule = module.open;
  }
  return sqliteModule;
}

export class ReactNativeDatabaseAdapter implements DatabaseAdapter {
  private db: ReturnType<Awaited<ReturnType<typeof getReactNativeSQLite>>> | null = null;

  async open(dbPath?: string): Promise<void> {
    if (this.db) {
      await this.close();
    }
    const open = await getReactNativeSQLite();
    this.db = open({ name: dbPath || 'onepass.db' });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  run(sql: string, params?: unknown[]): void {
    if (!this.db) throw new Error('Database not open');
    this.db.execute(sql, params || []);
  }

  exec(sql: string, params?: unknown[]): QueryResult[] {
    if (!this.db) throw new Error('Database not open');
    const result = this.db.execute(sql, params || []);
    if (!result.rows || result.rows.length === 0) {
      return [];
    }
    const columns = Object.keys(result.rows._array?.[0] || {});
    const values =
      result.rows._array?.map((row: Record<string, unknown>) => columns.map((col) => row[col])) ||
      [];
    return [{ columns, values }];
  }

  getTables(): string[] {
    const results = this.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (results.length === 0) return [];
    return results[0].values.map((row) => row[0] as string);
  }
}

export function createDatabaseAdapter(): DatabaseAdapter {
  if (isReactNative()) {
    return new ReactNativeDatabaseAdapter();
  }
  throw new Error(
    'No database adapter available for this platform. Use SqlJsDatabaseAdapter for Node.js.'
  );
}
