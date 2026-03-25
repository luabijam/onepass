import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ExportService } from '../src/export/service.js';
import { VaultService } from '../src/database/vault.js';
import { generateSalt, deriveKey } from '../src/crypto/index.js';
import type { Entry, Category } from '../src/models/index.js';

describe('ExportService', () => {
  let vault: VaultService;
  let exportService: ExportService;
  let key: Buffer;
  let salt: Buffer;

  beforeEach(async () => {
    vault = new VaultService();
    exportService = new ExportService();
    salt = generateSalt();
    key = deriveKey('test-password', salt);
    await vault.open(key);
  });

  afterEach(async () => {
    if (vault.isOpen) {
      await vault.close();
    }
  });

  const createTestEntry = (overrides: Partial<Entry> = {}): Entry => ({
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

  const createTestCategory = (overrides: Partial<Category> = {}): Category => ({
    id: 'cat-1',
    name: 'Social',
    icon: '👥',
    color: '#FF5722',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  describe('exportVault', () => {
    it('exports empty vault to encrypted buffer', async () => {
      const exported = await exportService.exportVault(vault, key, salt);

      expect(exported).toBeInstanceOf(Buffer);
      expect(exported.length).toBeGreaterThan(0);
    });

    it('exports vault with entries and categories', async () => {
      const category = createTestCategory();
      await vault.upsertCategory(category);

      const entry = createTestEntry({ categoryId: category.id });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      expect(exported).toBeInstanceOf(Buffer);

      const json = JSON.parse(exported.toString('utf-8'));
      expect(json.version).toBe(1);
      expect(json.salt).toBeDefined();
      expect(json.iv).toBeDefined();
      expect(json.data).toBeDefined();
    });

    it('produces different ciphertext for same data (random IV)', async () => {
      const entry = createTestEntry();
      await vault.upsertEntry(entry);

      const exported1 = await exportService.exportVault(vault, key, salt);
      const exported2 = await exportService.exportVault(vault, key, salt);

      const json1 = JSON.parse(exported1.toString('utf-8'));
      const json2 = JSON.parse(exported2.toString('utf-8'));

      expect(json1.iv).not.toBe(json2.iv);
      expect(json1.data).not.toBe(json2.data);
    });

    it('includes salt in export data', async () => {
      const exported = await exportService.exportVault(vault, key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      expect(json.salt).toBe(salt.toString('base64'));
    });

    it('uses version 1 for export format', async () => {
      const exported = await exportService.exportVault(vault, key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      expect(json.version).toBe(1);
    });
  });

  describe('importVault', () => {
    it('imports vault data from encrypted buffer', async () => {
      const category = createTestCategory();
      await vault.upsertCategory(category);

      const entry = createTestEntry({ categoryId: category.id });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries).toHaveLength(1);
      expect(result.categories).toHaveLength(2);
      expect(result.entries[0]!.title).toBe('Test Entry');
      expect(result.salt.equals(salt)).toBe(true);

      await newVault.close();
    });

    it('throws error for unsupported export version', async () => {
      const invalidExport = Buffer.from(
        JSON.stringify({
          version: 99,
          salt: salt.toString('base64'),
          iv: Buffer.from('a'.repeat(12)).toString('base64'),
          data: Buffer.from('test').toString('base64'),
        })
      );

      await expect(exportService.importVault(vault, invalidExport, key)).rejects.toThrow(
        'Unsupported export version'
      );
    });

    it('throws error for wrong password', async () => {
      const entry = createTestEntry();
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const wrongKey = deriveKey('wrong-password', salt);

      await expect(exportService.importVault(vault, exported, wrongKey)).rejects.toThrow();
    });

    it('throws error for corrupted data', async () => {
      const entry = createTestEntry();
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const json = JSON.parse(exported.toString('utf-8'));
      json.data = Buffer.from('corrupted').toString('base64');
      const corruptedExport = Buffer.from(JSON.stringify(json));

      await expect(exportService.importVault(vault, corruptedExport, key)).rejects.toThrow();
    });

    it('throws error for invalid JSON', async () => {
      const invalidExport = Buffer.from('not valid json');

      await expect(exportService.importVault(vault, invalidExport, key)).rejects.toThrow();
    });

    it('preserves entry dates through round-trip', async () => {
      const createdAt = new Date('2025-06-15T10:30:00Z');
      const updatedAt = new Date('2025-12-20T15:45:00Z');

      const entry = createTestEntry({
        createdAt,
        updatedAt,
      });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries[0]!.createdAt.toISOString()).toBe(createdAt.toISOString());
      expect(result.entries[0]!.updatedAt.toISOString()).toBe(updatedAt.toISOString());

      await newVault.close();
    });

    it('preserves optional fields through round-trip', async () => {
      const entry = createTestEntry({
        url: 'https://example.com',
        notes: 'Some notes',
      });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries[0]!.url).toBe('https://example.com');
      expect(result.entries[0]!.notes).toBe('Some notes');

      await newVault.close();
    });

    it('preserves deleted entries through round-trip', async () => {
      const entry = createTestEntry({
        deletedAt: new Date('2026-01-15T00:00:00Z'),
      });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries[0]!.deletedAt).toBeInstanceOf(Date);
      expect(result.entries[0]!.deletedAt!.toISOString()).toBe('2026-01-15T00:00:00.000Z');

      await newVault.close();
    });

    it('preserves deleted categories through round-trip', async () => {
      const category = createTestCategory({
        deletedAt: new Date('2026-01-15T00:00:00Z'),
      });
      await vault.upsertCategory(category);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      const deletedCategory = result.categories.find((c) => c.id === 'cat-1');
      expect(deletedCategory!.deletedAt).toBeInstanceOf(Date);

      await newVault.close();
    });
  });

  describe('round-trip with multiple items', () => {
    it('preserves multiple entries and categories', async () => {
      const category1 = createTestCategory({ id: 'cat-1', name: 'Social' });
      const category2 = createTestCategory({
        id: 'cat-2',
        name: 'Work',
        icon: '💼',
        color: '#2196F3',
      });
      await vault.upsertCategory(category1);
      await vault.upsertCategory(category2);

      const entries = [
        createTestEntry({ id: 'entry-1', title: 'GitHub', categoryId: 'cat-1' }),
        createTestEntry({ id: 'entry-2', title: 'AWS', categoryId: 'cat-2' }),
        createTestEntry({ id: 'entry-3', title: 'Netflix', categoryId: 'uncategorized' }),
      ];

      for (const entry of entries) {
        await vault.upsertEntry(entry);
      }

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries).toHaveLength(3);
      expect(result.categories).toHaveLength(3);

      const titles = result.entries.map((e) => e.title).sort();
      expect(titles).toEqual(['AWS', 'GitHub', 'Netflix']);

      const catNames = result.categories.map((c) => c.name).sort();
      expect(catNames).toEqual(['Social', 'Uncategorized', 'Work']);

      await newVault.close();
    });
  });

  describe('merge behavior', () => {
    it('returns imported data for caller to merge', async () => {
      const entry = createTestEntry({ title: 'Original' });
      await vault.upsertEntry(entry);

      const exported = await exportService.exportVault(vault, key, salt);

      const newVault = new VaultService();
      await newVault.open(key);

      await newVault.upsertEntry(createTestEntry({ id: 'entry-2', title: 'Existing' }));

      const result = await exportService.importVault(newVault, exported, key);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.title).toBe('Original');

      await newVault.close();
    });
  });
});
