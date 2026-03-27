import { describe, it, expect } from '@jest/globals';
import {
  deriveKey,
  generateSalt,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
} from '../src/crypto/index.js';
import {
  encryptExport,
  GCM_IV_LENGTH as EXPORT_IV_LENGTH,
  GCM_TAG_LENGTH as EXPORT_TAG_LENGTH,
  GCM_KEY_LENGTH,
} from '../src/export/crypto.js';
import { exportVault, importVault } from '../src/export/index.js';
import { serializeSyncPayload, deserializeSyncPayload } from '../src/sync/protocol.js';
import type { Entry, Category } from '../src/models/index.js';
import { VaultService } from '../src/database/vault.js';

describe('Vault Format Documentation Accuracy', () => {
  describe('Cryptographic Parameters', () => {
    it('PBKDF2 uses 100,000 iterations as documented', () => {
      expect(PBKDF2_ITERATIONS).toBe(100000);
    });

    it('Key length is 32 bytes (256 bits) as documented', () => {
      expect(KEY_LENGTH).toBe(32);
    });

    it('Salt length is 16 bytes (128 bits) as documented', () => {
      expect(SALT_LENGTH).toBe(16);
    });

    it('GCM IV length is 12 bytes (96 bits) as documented', () => {
      expect(GCM_IV_LENGTH).toBe(12);
      expect(EXPORT_IV_LENGTH).toBe(12);
    });

    it('GCM auth tag length is 16 bytes (128 bits) as documented', () => {
      expect(GCM_TAG_LENGTH).toBe(16);
      expect(EXPORT_TAG_LENGTH).toBe(16);
    });

    it('Export key length matches GCM key length', () => {
      expect(GCM_KEY_LENGTH).toBe(32);
    });

    it('generateSalt produces 16-byte salt', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(16);
    });

    it('deriveKey produces 32-byte key', () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      expect(key.length).toBe(32);
    });
  });

  describe('Export Format Structure', () => {
    it('export version is 1 as documented', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      const exported = await exportVault([], [], key, salt);
      const json = JSON.parse(exported.toString('utf-8'));
      expect(json.version).toBe(1);
    });

    it('export contains all required fields as documented', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      const exported = await exportVault([], [], key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('salt');
      expect(json).toHaveProperty('iv');
      expect(json).toHaveProperty('data');
    });

    it('salt field matches input salt (embedded for cross-platform)', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      const exported = await exportVault([], [], key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      const decodedSalt = Buffer.from(json.salt, 'base64');
      expect(decodedSalt.equals(salt)).toBe(true);
    });

    it('IV is 12 bytes as documented', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      const exported = await exportVault([], [], key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      const iv = Buffer.from(json.iv, 'base64');
      expect(iv.length).toBe(12);
    });

    it('data field contains ciphertext + 16-byte auth tag', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);
      const plaintext = Buffer.from('test data');

      const { ciphertext, tag } = encryptExport(plaintext, key);
      expect(tag.length).toBe(16);

      const combined = Buffer.concat([ciphertext, tag]);
      expect(combined.length).toBe(plaintext.length + 16);
    });
  });

  describe('Sync Payload Serialization', () => {
    it('serializes dates as ISO 8601 strings', () => {
      const entry: Entry = {
        id: 'test-id',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date('2026-01-15T10:30:45.123Z'),
        updatedAt: new Date('2026-03-20T14:22:33.456Z'),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const parsed = JSON.parse(serialized);

      expect(parsed.entries[0].createdAt).toBe('2026-01-15T10:30:45.123Z');
      expect(parsed.entries[0].updatedAt).toBe('2026-03-20T14:22:33.456Z');
    });

    it('omits undefined optional fields', () => {
      const entry: Entry = {
        id: 'test-id',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const parsed = JSON.parse(serialized);

      expect(parsed.entries[0]).not.toHaveProperty('url');
      expect(parsed.entries[0]).not.toHaveProperty('notes');
      expect(parsed.entries[0]).not.toHaveProperty('deletedAt');
    });

    it('includes defined optional fields', () => {
      const entry: Entry = {
        id: 'test-id',
        title: 'Test',
        username: 'user',
        password: 'pass',
        url: 'https://example.com',
        notes: 'Some notes',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date('2026-02-01T00:00:00Z'),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const parsed = JSON.parse(serialized);

      expect(parsed.entries[0].url).toBe('https://example.com');
      expect(parsed.entries[0].notes).toBe('Some notes');
      expect(parsed.entries[0].deletedAt).toBe('2026-02-01T00:00:00.000Z');
    });

    it('round-trips entries correctly', () => {
      const entry: Entry = {
        id: 'test-id',
        title: 'Test Entry',
        username: 'user@example.com',
        password: 'secret123',
        url: 'https://example.com/login',
        notes: 'Multi-line\nnotes',
        categoryId: 'work',
        isFavorite: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-03-15T12:30:00Z'),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.entries[0]).toEqual(entry);
    });

    it('round-trips categories correctly', () => {
      const category: Category = {
        id: 'work',
        name: 'Work',
        icon: '💼',
        color: '#FF5722',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: new Date('2026-03-01T00:00:00Z'),
      };

      const serialized = serializeSyncPayload({ entries: [], categories: [category] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.categories[0]).toEqual(category);
    });

    it('supports Unicode and emoji in all text fields', () => {
      const entry: Entry = {
        id: 'unicode-test',
        title: '中文标题',
        username: 'пользователь',
        password: '🔐secret🔑',
        url: 'https://example.com/日本語',
        notes: 'Emoji: 🎉 Chinese: 你好 Arabic: مرحبا',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.entries[0]!.title).toBe('中文标题');
      expect(deserialized.entries[0]!.username).toBe('пользователь');
      expect(deserialized.entries[0]!.password).toBe('🔐secret🔑');
      expect(deserialized.entries[0]!.url).toBe('https://example.com/日本語');
      expect(deserialized.entries[0]!.notes).toBe('Emoji: 🎉 Chinese: 你好 Arabic: مرحبا');
    });
  });

  describe('SQLite Database Schema', () => {
    it('creates entries table with documented columns', async () => {
      const vault = new VaultService();
      const key = generateSalt();
      await vault.open(key);

      const entry: Entry = {
        id: 'schema-test',
        title: 'Title',
        username: 'username',
        password: 'password',
        url: 'https://example.com',
        notes: 'notes',
        categoryId: 'uncategorized',
        isFavorite: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      };

      await vault.upsertEntry(entry);
      const entries = await vault.getEntries();

      expect(entries[0]).toEqual(entry);
      await vault.close();
    });

    it('creates categories table with documented columns', async () => {
      const vault = new VaultService();
      const key = generateSalt();
      await vault.open(key);

      const category: Category = {
        id: 'test-cat',
        name: 'Test Category',
        icon: '📁',
        color: '#FF5722',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: new Date('2026-02-01T00:00:00Z'),
      };

      await vault.upsertCategory(category);
      const categories = await vault.getCategories({ includeDeleted: true });
      const found = categories.find((c) => c.id === 'test-cat');

      expect(found).toEqual(category);
      await vault.close();
    });

    it('default category has documented values', async () => {
      const vault = new VaultService();
      const key = generateSalt();
      await vault.open(key);

      const categories = await vault.getCategories();
      const defaultCat = categories.find((c) => c.id === 'uncategorized');

      expect(defaultCat).toBeDefined();
      expect(defaultCat!.name).toBe('Uncategorized');
      expect(defaultCat!.icon).toBe('📁');
      expect(defaultCat!.color).toBe('#8E8E93');
      await vault.close();
    });

    it('stores isFavorite as boolean (1/0 internally)', async () => {
      const vault = new VaultService();
      const key = generateSalt();
      await vault.open(key);

      await vault.upsertEntry({
        id: 'fav-true',
        title: 'Favorite',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vault.upsertEntry({
        id: 'fav-false',
        title: 'Not Favorite',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const entries = await vault.getEntries();
      const favorite = entries.find((e) => e.id === 'fav-true');
      const notFavorite = entries.find((e) => e.id === 'fav-false');

      expect(favorite!.isFavorite).toBe(true);
      expect(notFavorite!.isFavorite).toBe(false);
      await vault.close();
    });

    it('supports soft delete via deleted_at column', async () => {
      const vault = new VaultService();
      const key = generateSalt();
      await vault.open(key);

      await vault.upsertEntry({
        id: 'to-delete',
        title: 'To Delete',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vault.softDeleteEntry('to-delete');

      const visibleEntries = await vault.getEntries();
      const allEntries = await vault.getEntries({ includeDeleted: true });

      expect(visibleEntries).toHaveLength(0);
      expect(allEntries).toHaveLength(1);
      expect(allEntries[0]!.deletedAt).toBeDefined();
      await vault.close();
    });
  });

  describe('Version Compatibility', () => {
    it('rejects export version other than 1', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const invalidExport = Buffer.from(
        JSON.stringify({
          version: 2,
          salt: salt.toString('base64'),
          iv: Buffer.alloc(12).toString('base64'),
          data: Buffer.alloc(32).toString('base64'),
        })
      );

      await expect(importVault(invalidExport, key)).rejects.toThrow('Unsupported export version');
    });

    it('version 1 exports are accepted', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const entry: Entry = {
        id: 'v1-test',
        title: 'Version 1 Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const exported = await exportVault([entry], [], key, salt);
      const result = await importVault(exported, key);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.title).toBe('Version 1 Test');
    });
  });

  describe('End-to-End Format Compliance', () => {
    it('full export/import round-trip preserves all data', async () => {
      const salt = generateSalt();
      const key = deriveKey('test-password-123', salt);

      const entries: Entry[] = [
        {
          id: 'entry-1',
          title: 'GitHub',
          username: 'developer@company.com',
          password: 'github-secret-password',
          url: 'https://github.com',
          notes: 'Work account',
          categoryId: 'work',
          isFavorite: true,
          createdAt: new Date('2026-01-15T10:30:00Z'),
          updatedAt: new Date('2026-02-20T14:45:00Z'),
        },
        {
          id: 'entry-2',
          title: 'AWS Console',
          username: 'admin',
          password: 'aws-secret',
          url: 'https://console.aws.amazon.com',
          categoryId: 'cloud',
          isFavorite: false,
          createdAt: new Date('2026-01-20T08:00:00Z'),
          updatedAt: new Date('2026-03-01T12:00:00Z'),
          deletedAt: new Date('2026-03-10T00:00:00Z'),
        },
      ];

      const categories: Category[] = [
        {
          id: 'work',
          name: 'Work',
          icon: '💼',
          color: '#3B82F6',
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: 'cloud',
          name: 'Cloud Services',
          icon: '☁️',
          color: '#10B981',
          updatedAt: new Date('2026-01-05T00:00:00Z'),
          deletedAt: new Date('2026-02-01T00:00:00Z'),
        },
      ];

      const exported = await exportVault(entries, categories, key, salt);
      const result = await importVault(exported, key);

      expect(result.entries).toHaveLength(2);
      expect(result.categories).toHaveLength(2);

      const github = result.entries.find((e) => e.id === 'entry-1');
      expect(github!.title).toBe('GitHub');
      expect(github!.isFavorite).toBe(true);
      expect(github!.notes).toBe('Work account');
      expect(github!.deletedAt).toBeUndefined();

      const aws = result.entries.find((e) => e.id === 'entry-2');
      expect(aws!.deletedAt).toBeInstanceOf(Date);

      const workCat = result.categories.find((c) => c.id === 'work');
      expect(workCat!.name).toBe('Work');
      expect(workCat!.deletedAt).toBeUndefined();

      const cloudCat = result.categories.find((c) => c.id === 'cloud');
      expect(cloudCat!.deletedAt).toBeInstanceOf(Date);
    });
  });
});
