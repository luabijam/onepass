import initSqlJs, { Database, SqlJsStatic, QueryExecResult, BindParams } from 'sql.js';
import type { DatabaseAdapter, QueryResult } from './types.js';

export class SqlJsDatabaseAdapter implements DatabaseAdapter {
  private db: Database | null = null;
  private sql: SqlJsStatic | null = null;

  get isOpen(): boolean {
    return this.db !== null;
  }

  async open(dbPath?: string): Promise<void> {
    if (this.db) {
      await this.close();
    }

    this.sql = await initSqlJs();

    if (dbPath) {
      try {
        const fs = await import('fs');
        const fileBuffer = fs.readFileSync(dbPath);
        this.db = new this.sql.Database(fileBuffer);
      } catch {
        this.db = new this.sql.Database();
      }
    } else {
      this.db = new this.sql.Database();
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.sql = null;
  }

  run(sql: string, params?: unknown[]): void {
    if (!this.db) throw new Error('Database not open');
    this.db.run(sql, params as BindParams);
  }

  exec(sql: string, params?: unknown[]): QueryResult[] {
    if (!this.db) throw new Error('Database not open');
    const results = this.db.exec(sql, params as BindParams);
    return results.map((r: QueryExecResult) => ({
      columns: r.columns,
      values: r.values as unknown[][],
    }));
  }

  getTables(): string[] {
    const results = this.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (results.length === 0) return [];
    return results[0].values.map((row) => row[0] as string);
  }

  exportData(): Uint8Array | null {
    if (!this.db) throw new Error('Database not open');
    return this.db.export();
  }
}

export function createDatabaseAdapter(): DatabaseAdapter {
  return new SqlJsDatabaseAdapter();
}
