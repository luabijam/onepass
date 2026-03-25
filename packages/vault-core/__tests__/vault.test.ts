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

  describe('entries - include deleted', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('getEntries with includeDeleted returns all entries including deleted', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Active Entry',
        username: 'user1',
        password: 'pass1',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await vault.upsertEntry({
        id: 'entry-2',
        title: 'Deleted Entry',
        username: 'user2',
        password: 'pass2',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vault.softDeleteEntry('entry-2');

      const allEntries = await vault.getEntries({ includeDeleted: true });
      expect(allEntries).toHaveLength(2);

      const activeEntries = await vault.getEntries();
      expect(activeEntries).toHaveLength(1);
      expect(activeEntries[0].id).toBe('entry-1');
    });

    it('getEntries without includeDeleted excludes soft-deleted entries', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Entry',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await vault.softDeleteEntry('entry-1');

      const entries = await vault.getEntries({ includeDeleted: false });
      expect(entries).toHaveLength(0);
    });
  });

  describe('categories - include deleted', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('getCategories with includeDeleted returns all categories including deleted', async () => {
      await vault.upsertCategory({
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF0000',
        updatedAt: new Date(),
      });
      await vault.upsertCategory({
        id: 'personal',
        name: 'Personal',
        icon: '🏠',
        color: '#00FF00',
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      const allCategories = await vault.getCategories({ includeDeleted: true });
      expect(allCategories.length).toBe(3);

      const activeCategories = await vault.getCategories();
      expect(activeCategories.length).toBe(2);
    });
  });

  describe('search edge cases', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('search returns empty array when no matches', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'GitHub',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const results = await vault.searchEntries('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('search is case-insensitive', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'GitHub',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const results = await vault.searchEntries('GITHUB');
      expect(results).toHaveLength(1);
    });

    it('search handles special characters', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: "O'Brien's Account",
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const results = await vault.searchEntries("O'Brien");
      expect(results).toHaveLength(1);
    });

    it('search handles empty query', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const results = await vault.searchEntries('');
      expect(results).toHaveLength(1);
    });
  });

  describe('multiple entries ordering', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('stores and retrieves multiple entries', async () => {
      for (let i = 0; i < 10; i++) {
        await vault.upsertEntry({
          id: `entry-${i}`,
          title: `Entry ${i}`,
          username: `user${i}`,
          password: `pass${i}`,
          categoryId: 'uncategorized',
          isFavorite: i % 2 === 0,
          createdAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`),
          updatedAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`),
        });
      }

      const entries = await vault.getEntries();
      expect(entries).toHaveLength(10);

      const favorites = entries.filter((e) => e.isFavorite);
      expect(favorites).toHaveLength(5);
    });

    it('updates multiple entries independently', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'First',
        username: 'user1',
        password: 'pass1',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await vault.upsertEntry({
        id: 'entry-2',
        title: 'Second',
        username: 'user2',
        password: 'pass2',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Updated First',
        username: 'user1-updated',
        password: 'pass1-new',
        categoryId: 'uncategorized',
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const entries = await vault.getEntries();
      expect(entries).toHaveLength(2);
      const updated = entries.find((e) => e.id === 'entry-1');
      expect(updated?.title).toBe('Updated First');
      expect(updated?.username).toBe('user1-updated');
      expect(updated?.isFavorite).toBe(true);

      const unchanged = entries.find((e) => e.id === 'entry-2');
      expect(unchanged?.title).toBe('Second');
    });
  });

  describe('getEntriesSince edge cases', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('returns empty array when no entries match date', async () => {
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Old Entry',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      const entries = await vault.getEntriesSince(new Date('2027-01-01T00:00:00Z'));
      expect(entries).toHaveLength(0);
    });

    it('returns entries updated exactly at boundary time', async () => {
      const boundaryTime = new Date('2026-06-15T12:00:00Z');
      await vault.upsertEntry({
        id: 'entry-1',
        title: 'Boundary Entry',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: boundaryTime,
        updatedAt: boundaryTime,
      });

      const entries = await vault.getEntriesSince(new Date('2026-06-15T11:59:59Z'));
      expect(entries).toHaveLength(1);
    });
  });

  describe('getCategoriesSince edge cases', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('returns empty array when no categories match date', async () => {
      await vault.upsertCategory({
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF0000',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      const categories = await vault.getCategoriesSince(new Date('2027-01-01T00:00:00Z'));
      expect(categories).toHaveLength(0);
    });

    it('includes soft-deleted categories', async () => {
      await vault.upsertCategory({
        id: 'deleted-cat',
        name: 'Deleted',
        icon: '🗑️',
        color: '#000000',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
        deletedAt: new Date('2026-06-02T00:00:00Z'),
      });

      const categories = await vault.getCategoriesSince(new Date('2026-05-01T00:00:00Z'));
      expect(categories).toHaveLength(1);
      expect(categories[0].deletedAt).toBeDefined();
    });
  });

  describe('entry with all optional fields', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('stores and retrieves entry with url and notes', async () => {
      const entry: Entry = {
        id: 'full-entry',
        title: 'Complete Entry',
        username: 'user@example.com',
        password: 'supersecret',
        url: 'https://example.com/login',
        notes: 'These are my notes\nwith multiple lines',
        categoryId: 'uncategorized',
        isFavorite: true,
        createdAt: new Date('2026-03-15T10:30:00Z'),
        updatedAt: new Date('2026-03-20T14:45:00Z'),
      };

      await vault.upsertEntry(entry);
      const entries = await vault.getEntries();

      expect(entries[0].url).toBe('https://example.com/login');
      expect(entries[0].notes).toBe('These are my notes\nwith multiple lines');
      expect(entries[0].isFavorite).toBe(true);
    });

    it('handles entry with empty strings', async () => {
      await vault.upsertEntry({
        id: 'empty-strings',
        title: '',
        username: '',
        password: '',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const entries = await vault.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('');
      expect(entries[0].username).toBe('');
      expect(entries[0].password).toBe('');
    });
  });

  describe('category operations', () => {
    beforeEach(async () => {
      await vault.open(key);
    });

    it('stores and retrieves multiple categories', async () => {
      await vault.upsertCategory({
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF0000',
        updatedAt: new Date(),
      });
      await vault.upsertCategory({
        id: 'personal',
        name: 'Personal',
        icon: '🏠',
        color: '#00FF00',
        updatedAt: new Date(),
      });
      await vault.upsertCategory({
        id: 'finance',
        name: 'Finance',
        icon: '💰',
        color: '#0000FF',
        updatedAt: new Date(),
      });

      const categories = await vault.getCategories();
      expect(categories.length).toBe(4);
      expect(categories.map((c) => c.id).sort()).toEqual([
        'finance',
        'personal',
        'uncategorized',
        'work',
      ]);
    });

    it('updates category while preserving data', async () => {
      await vault.upsertCategory({
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF0000',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });

      await vault.upsertCategory({
        id: 'work',
        name: 'Work Updated',
        icon: '📁',
        color: '#00FF00',
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      });

      const categories = await vault.getCategories();
      const work = categories.find((c) => c.id === 'work');
      expect(work?.name).toBe('Work Updated');
      expect(work?.icon).toBe('📁');
      expect(work?.color).toBe('#00FF00');
    });
  });

  describe('database persistence via export/import', () => {
    it('persists data across reopen using exported data', async () => {
      await vault.open(key);

      await vault.upsertEntry({
        id: 'persistent-entry',
        title: 'Persistent',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vault.upsertCategory({
        id: 'persistent-cat',
        name: 'Persistent Category',
        icon: '🔒',
        color: '#123456',
        updatedAt: new Date(),
      });

      const exportedData = vault.exportData();
      await vault.close();

      const vault2 = new VaultService();
      await vault2.open(key);
      const entries = await vault2.getEntries();
      const categories = await vault2.getCategories();

      expect(entries).toHaveLength(0);
      expect(categories).toHaveLength(1);
      await vault2.close();

      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const tempFile = path.join(os.tmpdir(), `test-vault-${Date.now()}.db`);
      fs.writeFileSync(tempFile, Buffer.from(exportedData!));

      const vault3 = new VaultService();
      await vault3.open(key, tempFile);

      const restoredEntries = await vault3.getEntries();
      const restoredCategories = await vault3.getCategories();

      expect(restoredEntries).toHaveLength(1);
      expect(restoredEntries[0].title).toBe('Persistent');
      expect(restoredCategories.find((c) => c.id === 'persistent-cat')).toBeDefined();

      await vault3.close();
      fs.unlinkSync(tempFile);
    });
  });
});
