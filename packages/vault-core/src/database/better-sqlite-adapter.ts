import type { DatabaseAdapter, QueryResult } from './types.js';

interface SQLiteDatabase {
  close(): void;
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): void;
  prepare(sql: string): SQLStatement;
}

interface SQLStatement {
  run(...params: unknown[]): void;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

export class BetterSqliteDatabaseAdapter implements DatabaseAdapter {
  private db: SQLiteDatabase | null = null;

  get isOpen(): boolean {
    return this.db !== null;
  }

  async open(dbPath?: string): Promise<void> {
    if (this.db) {
      await this.close();
    }
    const Database = (await import('better-sqlite3')).default as unknown as {
      new (filename: string): SQLiteDatabase;
    };
    this.db = new Database(dbPath || ':memory:');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  run(sql: string, params?: unknown[]): void {
    if (!this.db) throw new Error('Database not open');
    this.db.run(sql, params);
  }

  exec(sql: string, params?: unknown[]): QueryResult[] {
    if (!this.db) throw new Error('Database not open');
    if (params && params.length > 0) {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      if (rows.length === 0) return [];
      const columns = Object.keys(rows[0] || {});
      const values = rows.map((row) => columns.map((col) => row[col]));
      return [{ columns, values }];
    }
    this.db.exec(sql);
    return [];
  }

  getTables(): string[] {
    if (!this.db) throw new Error('Database not open');
    const rows = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
      name: string;
    }[];
    return rows.map((row) => row.name);
  }
}
