import initSqlJs, { Database, SqlJsStatic, QueryExecResult } from 'sql.js';
import type { Entry, Category } from '../models/index.js';
import { createDefaultCategory } from '../models/index.js';

const SCHEMA_VERSION = 1;

const CREATE_ENTRIES_TABLE = `
  CREATE TABLE IF NOT EXISTS entries (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    username    TEXT NOT NULL,
    password    TEXT NOT NULL,
    url         TEXT,
    notes       TEXT,
    category_id TEXT NOT NULL DEFAULT 'uncategorized',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT
  )
`;

const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    icon       TEXT NOT NULL,
    color      TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )
`;

const CREATE_ENTRIES_UPDATED_AT_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries (updated_at)
`;

const CREATE_CATEGORIES_UPDATED_AT_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories (updated_at)
`;

function entryToRow(entry: Entry): Record<string, string | number | null> {
  return {
    id: entry.id,
    title: entry.title,
    username: entry.username,
    password: entry.password,
    url: entry.url ?? null,
    notes: entry.notes ?? null,
    category_id: entry.categoryId,
    is_favorite: entry.isFavorite ? 1 : 0,
    created_at: entry.createdAt.toISOString(),
    updated_at: entry.updatedAt.toISOString(),
    deleted_at: entry.deletedAt?.toISOString() ?? null,
  };
}

function rowToEntry(row: Record<string, unknown>): Entry {
  return {
    id: row.id as string,
    title: row.title as string,
    username: row.username as string,
    password: row.password as string,
    url: (row.url as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    categoryId: row.category_id as string,
    isFavorite: row.is_favorite === 1,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
  };
}

function categoryToRow(category: Category): Record<string, string | null> {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    updated_at: category.updatedAt.toISOString(),
    deleted_at: category.deletedAt?.toISOString() ?? null,
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
  };
}

function parseRows<T>(result: QueryExecResult[], mapper: (row: Record<string, unknown>) => T): T[] {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return mapper(obj);
  });
}

export class VaultService {
  private db: Database | null = null;
  private sql: SqlJsStatic | null = null;

  get isOpen(): boolean {
    return this.db !== null;
  }

  async open(keyBytes: Buffer, dbPath?: string): Promise<void> {
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

    this.initializeSchema();
    void keyBytes;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.sql = null;
  }

  private initializeSchema(): void {
    if (!this.db) throw new Error('Database not open');

    this.db.run(CREATE_ENTRIES_TABLE);
    this.db.run(CREATE_CATEGORIES_TABLE);
    this.db.run(CREATE_ENTRIES_UPDATED_AT_INDEX);
    this.db.run(CREATE_CATEGORIES_UPDATED_AT_INDEX);

    const result = this.db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    );
    if (result.length === 0) {
      this.db.run('CREATE TABLE schema_version (version INTEGER PRIMARY KEY)');
      this.db.run('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);

      this.db.run(
        'INSERT INTO categories (id, name, icon, color, updated_at) VALUES (?, ?, ?, ?, ?)',
        [
          'uncategorized',
          'Uncategorized',
          '📁',
          '#8E8E93',
          new Date('2026-01-01T00:00:00Z').toISOString(),
        ]
      );
    }
  }

  async upsertEntry(entry: Entry): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    const row = entryToRow(entry);
    this.db.run(
      `INSERT OR REPLACE INTO entries
       (id, title, username, password, url, notes, category_id, is_favorite, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.title,
        row.username,
        row.password,
        row.url,
        row.notes,
        row.category_id,
        row.is_favorite,
        row.created_at,
        row.updated_at,
        row.deleted_at,
      ]
    );
  }

  async getEntries(options?: { includeDeleted?: boolean }): Promise<Entry[]> {
    if (!this.db) throw new Error('Database not open');

    const sql = options?.includeDeleted
      ? 'SELECT * FROM entries'
      : 'SELECT * FROM entries WHERE deleted_at IS NULL';
    const result = this.db.exec(sql);
    return parseRows(result, rowToEntry);
  }

  async getEntriesSince(since: Date): Promise<Entry[]> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec('SELECT * FROM entries WHERE updated_at > ?', [
      since.toISOString(),
    ]);
    return parseRows(result, rowToEntry);
  }

  async searchEntries(query: string): Promise<Entry[]> {
    if (!this.db) throw new Error('Database not open');

    const searchTerm = `%${query}%`;
    const result = this.db.exec(
      'SELECT * FROM entries WHERE deleted_at IS NULL AND (title LIKE ? OR username LIKE ? OR url LIKE ?)',
      [searchTerm, searchTerm, searchTerm]
    );
    return parseRows(result, rowToEntry);
  }

  async softDeleteEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    const now = new Date().toISOString();
    this.db.run('UPDATE entries SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, id]);
  }

  async upsertCategory(category: Category): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    const row = categoryToRow(category);
    this.db.run(
      `INSERT OR REPLACE INTO categories
       (id, name, icon, color, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.id, row.name, row.icon, row.color, row.updated_at, row.deleted_at]
    );
  }

  async getCategories(options?: { includeDeleted?: boolean }): Promise<Category[]> {
    if (!this.db) throw new Error('Database not open');

    const sql = options?.includeDeleted
      ? 'SELECT * FROM categories'
      : 'SELECT * FROM categories WHERE deleted_at IS NULL';
    const result = this.db.exec(sql);
    const categories = parseRows(result, rowToCategory);

    if (categories.length === 0) return [createDefaultCategory()];

    const hasDefault = categories.some((c: Category) => c.id === 'uncategorized');
    if (!hasDefault) {
      categories.push(createDefaultCategory());
    }
    return categories;
  }

  async getCategoriesSince(since: Date): Promise<Category[]> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.exec('SELECT * FROM categories WHERE updated_at > ?', [
      since.toISOString(),
    ]);
    return parseRows(result, rowToCategory);
  }

  exportData(): Uint8Array | null {
    if (!this.db) throw new Error('Database not open');
    return this.db.export();
  }
}
