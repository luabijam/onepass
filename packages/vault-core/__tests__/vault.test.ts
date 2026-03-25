import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VaultService } from '../src/database/vault.js';
import type { Entry, Category } from '../src/models/index.js';
import { generateSalt } from '../src/crypto/index.js';

describe('VaultService', () => {
  let vault: VaultService;
  let key: Buffer;

  beforeEach(async () => {
    vault = new VaultService();
    key = generateSalt();
  });

  afterEach(async () => {
    if (vault.isOpen) {
      await vault.close();
    }
  });

  describe('open/close', () => {
    it('starts closed', () => {
      expect(vault.isOpen).toBe(false);
    });

    it('opens successfully', async () => {
      await vault.open(key);
      expect(vault.isOpen).toBe(true);
    });

    it('closes successfully', async () => {
      await vault.open(key);
      expect(vault.isOpen).toBe(true);
      await vault.close();
      expect(vault.isOpen).toBe(false);
    });

    it('can reopen after close', async () => {
      await vault.open(key);
      await vault.close();
      await vault.open(key);
      expect(vault.isOpen).toBe(true);
    });

    it('reopening closes existing database', async () => {
      await vault.open(key);
      await vault.upsertEntry({
        id: 'test-1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await vault.open(key);
      const entries = await vault.getEntries();
      expect(entries).toHaveLength(0);
    });
  });

  describe('entries CRUD', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    const createEntry = (overrides: Partial<Entry> = {}): Entry => ({
      id: 'entry-1',
      title: 'Test Entry',
      username: 'testuser',
      password: 'testpass',
      categoryId: 'uncategorized',
      isFavorite: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    });

    it('starts with empty entries', async () => {
      const entries = await vault.getEntries();
      expect(entries).toHaveLength(0);
    });

    it('inserts an entry', async () => {
      const entry = createEntry();
      await vault.upsertEntry(entry);
      const entries = await vault.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('entry-1');
      expect(entries[0].title).toBe('Test Entry');
    });

    it('updates an existing entry (upsert)', async () => {
      const entry = createEntry();
      await vault.upsertEntry(entry);

      const updated = createEntry({ title: 'Updated Title', updatedAt: new Date() });
      await vault.upsertEntry(updated);

      const entries = await vault.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Updated Title');
    });

    it('stores all entry fields correctly', async () => {
      const entry: Entry = {
        id: 'full-entry',
        title: 'Full Entry',
        username: 'user@example.com',
        password: 'supersecret',
        url: 'https://example.com',
        notes: 'Some notes',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-15T10:30:00Z'),
        updatedAt: new Date('2026-01-20T14:45:00Z'),
      };
      await vault.upsertEntry(entry);

      const entries = await vault.getEntries();
      expect(entries[0]).toEqual(entry);
    });

    it('soft deletes an entry', async () => {
      const entry = createEntry();
      await vault.upsertEntry(entry);

      await vault.softDeleteEntry('entry-1');

      const entries = await vault.getEntries();
      expect(entries).toHaveLength(0);
    });

    it('searches entries by title', async () => {
      await vault.upsertEntry(createEntry({ id: '1', title: 'GitHub Account' }));
      await vault.upsertEntry(createEntry({ id: '2', title: 'GitLab Account' }));
      await vault.upsertEntry(createEntry({ id: '3', title: 'Google Mail' }));

      const results = await vault.searchEntries('Git');
      expect(results).toHaveLength(2);
    });

    it('searches entries by username', async () => {
      await vault.upsertEntry(createEntry({ id: '1', username: 'alice@example.com' }));
      await vault.upsertEntry(createEntry({ id: '2', username: 'bob@example.com' }));

      const results = await vault.searchEntries('alice');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('alice@example.com');
    });

    it('searches entries by url', async () => {
      await vault.upsertEntry(createEntry({ id: '1', url: 'https://github.com' }));
      await vault.upsertEntry(createEntry({ id: '2', url: 'https://gitlab.com' }));

      const results = await vault.searchEntries('github');
      expect(results).toHaveLength(1);
    });

    it('does not return soft-deleted entries in search', async () => {
      await vault.upsertEntry(createEntry({ id: '1', title: 'GitHub Account' }));
      await vault.softDeleteEntry('1');

      const results = await vault.searchEntries('Git');
      expect(results).toHaveLength(0);
    });

    it('gets entries since a date', async () => {
      await vault.upsertEntry(
        createEntry({ id: '1', updatedAt: new Date('2026-01-01T00:00:00Z') })
      );
      await vault.upsertEntry(
        createEntry({ id: '2', updatedAt: new Date('2026-02-01T00:00:00Z') })
      );
      await vault.upsertEntry(
        createEntry({ id: '3', updatedAt: new Date('2026-03-01T00:00:00Z') })
      );

      const entries = await vault.getEntriesSince(new Date('2026-01-15T00:00:00Z'));
      expect(entries).toHaveLength(2);
    });

    it('includes soft-deleted entries in getEntriesSince', async () => {
      await vault.upsertEntry(
        createEntry({ id: '1', updatedAt: new Date('2026-01-01T00:00:00Z') })
      );
      await vault.softDeleteEntry('1');

      const entries = await vault.getEntriesSince(new Date('2025-12-01T00:00:00Z'));
      expect(entries).toHaveLength(1);
      expect(entries[0].deletedAt).toBeDefined();
    });
  });

  describe('categories CRUD', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    const createCategory = (overrides: Partial<Category> = {}): Category => ({
      id: 'cat-1',
      name: 'Work',
      icon: '💼',
      color: '#FF0000',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    });

    it('returns default category when empty', async () => {
      const categories = await vault.getCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].id).toBe('uncategorized');
    });

    it('inserts a category', async () => {
      const category = createCategory();
      await vault.upsertCategory(category);

      const categories = await vault.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories.find((c) => c.id === 'cat-1')).toBeDefined();
    });

    it('updates an existing category (upsert)', async () => {
      const category = createCategory();
      await vault.upsertCategory(category);

      const updated = createCategory({ name: 'Personal', updatedAt: new Date() });
      await vault.upsertCategory(updated);

      const categories = await vault.getCategories();
      const found = categories.find((c) => c.id === 'cat-1');
      expect(found?.name).toBe('Personal');
    });

    it('gets categories since a date', async () => {
      await vault.upsertCategory(
        createCategory({ id: '1', updatedAt: new Date('2026-01-01T00:00:00Z') })
      );
      await vault.upsertCategory(
        createCategory({ id: '2', updatedAt: new Date('2026-02-01T00:00:00Z') })
      );

      const categories = await vault.getCategoriesSince(new Date('2026-01-15T00:00:00Z'));
      expect(categories).toHaveLength(1);
      expect(categories[0].id).toBe('2');
    });

    it('does not return soft-deleted categories in getCategories', async () => {
      const category = createCategory();
      await vault.upsertCategory(category);

      await vault.upsertCategory({
        ...category,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      const categories = await vault.getCategories();
      expect(categories.find((c) => c.id === 'cat-1')).toBeUndefined();
    });

    it('ensures default category is always present', async () => {
      await vault.upsertCategory(createCategory({ id: 'work' }));
      await vault.upsertCategory(createCategory({ id: 'personal' }));

      const categories = await vault.getCategories();
      expect(categories.find((c) => c.id === 'uncategorized')).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('throws when operating on closed database', async () => {
      await expect(vault.getEntries()).rejects.toThrow('Database not open');
      await expect(vault.upsertEntry({} as Entry)).rejects.toThrow('Database not open');
      await expect(vault.getCategories()).rejects.toThrow('Database not open');
    });
  });

  describe('export', () => {
    it('exports database data', async () => {
      await vault.open(key);
      await vault.upsertEntry({
        id: 'test-1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const data = vault.exportData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data!.length).toBeGreaterThan(0);
    });

    it('throws when exporting closed database', () => {
      expect(() => vault.exportData()).toThrow('Database not open');
    });
  });
});
