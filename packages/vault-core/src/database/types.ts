export interface DatabaseAdapter {
  open(dbPath?: string): Promise<void>;
  close(): Promise<void>;
  run(sql: string, params?: unknown[]): void;
  exec(sql: string, params?: unknown[]): QueryResult[];
  getTables(): string[];
}

export interface QueryResult {
  columns: string[];
  values: unknown[][];
}
