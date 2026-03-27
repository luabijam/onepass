import { describe, it, expect } from '@jest/globals';
import { exportVault, importVault } from '../src/export/index.js';
import { serializeSyncPayload, deserializeSyncPayload } from '../src/sync/protocol.js';
import { deriveKey, generateSalt } from '../src/crypto/index.js';
import type { Entry, Category } from '../src/models/index.js';
import {
  encryptExport,
  decryptExport,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
} from '../src/export/crypto.js';

describe('Vault Format Compatibility', () => {
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

  describe('Export Format Structure', () => {
    it('produces valid JSON with required fields', async () => {
      const entries = [createTestEntry()];
      const categories = [createTestCategory()];
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const exported = await exportVault(entries, categories, key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      expect(json.version).toBe(1);
      expect(typeof json.salt).toBe('string');
      expect(typeof json.iv).toBe('string');
      expect(typeof json.data).toBe('string');
    });

    it('uses base64 encoding for binary fields', async () => {
      const entries = [createTestEntry()];
      const categories = [createTestCategory()];
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const exported = await exportVault(entries, categories, key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(json.salt).toMatch(base64Regex);
      expect(json.iv).toMatch(base64Regex);
      expect(json.data).toMatch(base64Regex);
    });

    it('includes embedded salt for cross-platform key derivation', async () => {
      const entries: Entry[] = [];
      const categories: Category[] = [];
      const originalSalt = generateSalt();
      const key = deriveKey('password', originalSalt);

      const exported = await exportVault(entries, categories, key, originalSalt);
      const json = JSON.parse(exported.toString('utf-8'));

      const decodedSalt = Buffer.from(json.salt, 'base64');
      expect(decodedSalt.equals(originalSalt)).toBe(true);
    });

    it('uses AES-256-GCM with 12-byte IV', async () => {
      const entries = [createTestEntry()];
      const categories = [createTestCategory()];
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const exported = await exportVault(entries, categories, key, salt);
      const json = JSON.parse(exported.toString('utf-8'));

      const iv = Buffer.from(json.iv, 'base64');
      expect(iv.length).toBe(12);
    });

    it('produces platform-independent ciphertext', async () => {
      const entries = [createTestEntry({ title: 'Cross Platform Test' })];
      const categories = [createTestCategory({ name: 'Test Category' })];
      const salt = Buffer.alloc(16, 0x42);
      const password = 'consistent-password';
      const key = deriveKey(password, salt);

      const exported = await exportVault(entries, categories, key, salt);
      const result = await importVault(exported, key);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.title).toBe('Cross Platform Test');
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0]!.name).toBe('Test Category');
    });
  });

  describe('Cross-Platform Data Integrity', () => {
    it('preserves all entry fields through serialization', () => {
      const entry: Entry = {
        id: 'entry-full',
        title: 'Full Entry Test',
        username: 'user@example.com',
        password: 'P@ssw0rd!#$%',
        url: 'https://example.com/login?param=value&other=123',
        notes: 'Multi-line\nnotes\nwith special chars: \u0000\u001F\u{1F600}',
        categoryId: 'cat-1',
        isFavorite: true,
        createdAt: new Date('2025-06-15T10:30:45.123Z'),
        updatedAt: new Date('2025-12-20T15:45:30.456Z'),
        deletedAt: new Date('2026-01-10T08:00:00.789Z'),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.entries[0]).toEqual(entry);
    });

    it('preserves all category fields through serialization', () => {
      const category: Category = {
        id: 'cat-full',
        name: 'Full Category Test',
        icon: '\u{1F411}',
        color: '#AABBCC',
        updatedAt: new Date('2025-03-15T12:00:00Z'),
        deletedAt: new Date('2026-02-01T00:00:00Z'),
      };

      const serialized = serializeSyncPayload({ entries: [], categories: [category] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.categories[0]).toEqual(category);
    });

    it('handles Unicode characters in all text fields', () => {
      const entry: Entry = {
        id: 'unicode-entry',
        title: '\u4E2D\u6587\u6807\u9898',
        username: '\u0410\u043B\u0435\u043A\u0441\u0435\u0439',
        password: '\u{1F600}\u{1F389}emoji\u{1F384}pass',
        url: 'https://example.com/\u65E5\u672C\u8A9E/path',
        notes:
          '\u00C9moji: \u{1F600}, Chinese: \u4F60\u597D, Arabic: \u0645\u0631\u062D\u0628\u0627',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.entries[0]!.title).toBe(entry.title);
      expect(deserialized.entries[0]!.username).toBe(entry.username);
      expect(deserialized.entries[0]!.password).toBe(entry.password);
      expect(deserialized.entries[0]!.url).toBe(entry.url);
      expect(deserialized.entries[0]!.notes).toBe(entry.notes);
    });

    it('handles empty and undefined optional fields', () => {
      const entryMinimal: Entry = {
        id: 'minimal',
        title: '',
        username: '',
        password: '',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = serializeSyncPayload({ entries: [entryMinimal], categories: [] });
      const deserialized = deserializeSyncPayload(serialized);

      expect(deserialized.entries[0]!.url).toBeUndefined();
      expect(deserialized.entries[0]!.notes).toBeUndefined();
      expect(deserialized.entries[0]!.deletedAt).toBeUndefined();
    });

    it('preserves ISO 8601 date format for timestamps', () => {
      const entry = createTestEntry({
        createdAt: new Date('2025-01-15T08:30:45.123Z'),
        updatedAt: new Date('2025-06-20T14:22:33.456Z'),
      });

      const serialized = serializeSyncPayload({ entries: [entry], categories: [] });
      const parsed = JSON.parse(serialized);

      expect(parsed.entries[0].createdAt).toBe('2025-01-15T08:30:45.123Z');
      expect(parsed.entries[0].updatedAt).toBe('2025-06-20T14:22:33.456Z');
    });
  });

  describe('Encryption Compatibility', () => {
    it('uses consistent AES-256-GCM parameters', () => {
      const key = Buffer.alloc(32, 0x01);
      const plaintext = Buffer.from('test data for encryption');

      const { ciphertext, iv, tag } = encryptExport(plaintext, key);

      expect(iv.length).toBe(12);
      expect(tag.length).toBe(16);
      expect(ciphertext.length).toBe(plaintext.length);
    });

    it('decrypts ciphertext produced by encryptExport', () => {
      const key = Buffer.alloc(32, 0x01);
      const plaintext = Buffer.from('confidential data');

      const { ciphertext, iv, tag } = encryptExport(plaintext, key);
      const decrypted = decryptExport(ciphertext, key, iv, tag);

      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('handles combined ciphertext+tag format', () => {
      const key = Buffer.alloc(32, 0x01);
      const plaintext = Buffer.from('test data');

      const { ciphertext, tag } = encryptExport(plaintext, key);
      const combined = combineCiphertextAndTag(ciphertext, tag);

      expect(combined.length).toBe(ciphertext.length + tag.length);

      const { ciphertext: splitCiphertext, tag: splitTag } = splitCiphertextAndTag(combined);
      expect(splitCiphertext.equals(ciphertext)).toBe(true);
      expect(splitTag.equals(tag)).toBe(true);
    });

    it('fails decryption with wrong key', () => {
      const correctKey = Buffer.alloc(32, 0x01);
      const wrongKey = Buffer.alloc(32, 0x02);
      const plaintext = Buffer.from('secret');

      const { ciphertext, iv, tag } = encryptExport(plaintext, correctKey);

      expect(() => decryptExport(ciphertext, wrongKey, iv, tag)).toThrow();
    });

    it('fails decryption with corrupted tag', () => {
      const key = Buffer.alloc(32, 0x01);
      const plaintext = Buffer.from('secret');

      const { ciphertext, iv, tag } = encryptExport(plaintext, key);
      const corruptedTag = Buffer.from(tag);
      corruptedTag[0] ^= 0xff;

      expect(() => decryptExport(ciphertext, key, iv, corruptedTag)).toThrow();
    });
  });

  describe('End-to-End Cross-Platform Round-Trip', () => {
    it('simulates export from one platform, import to another', async () => {
      const salt = generateSalt();
      const password = 'shared-master-password';
      const key = deriveKey(password, salt);

      const entries: Entry[] = [
        createTestEntry({
          id: 'entry-1',
          title: 'GitHub',
          username: 'dev@company.com',
          password: 'github-secret',
          url: 'https://github.com',
          categoryId: 'cat-dev',
          isFavorite: true,
        }),
        createTestEntry({
          id: 'entry-2',
          title: 'AWS Console',
          username: 'admin',
          password: 'aws-secret',
          url: 'https://console.aws.amazon.com',
          notes: 'Production account',
          categoryId: 'cat-work',
        }),
      ];

      const categories: Category[] = [
        {
          id: 'cat-dev',
          name: 'Development',
          icon: '\u{1F4BB}',
          color: '#3B82F6',
          updatedAt: new Date(),
        },
        {
          id: 'cat-work',
          name: 'Work',
          icon: '\u{1F3E2}',
          color: '#10B981',
          updatedAt: new Date(),
        },
      ];

      const exportedFromPlatformA = await exportVault(entries, categories, key, salt);

      const resultOnPlatformB = await importVault(exportedFromPlatformA, key);

      expect(resultOnPlatformB.entries).toHaveLength(2);
      expect(resultOnPlatformB.categories).toHaveLength(2);

      const githubEntry = resultOnPlatformB.entries.find((e) => e.id === 'entry-1');
      expect(githubEntry).toBeDefined();
      expect(githubEntry!.title).toBe('GitHub');
      expect(githubEntry!.isFavorite).toBe(true);

      const awsEntry = resultOnPlatformB.entries.find((e) => e.id === 'entry-2');
      expect(awsEntry).toBeDefined();
      expect(awsEntry!.notes).toBe('Production account');

      const devCat = resultOnPlatformB.categories.find((c) => c.id === 'cat-dev');
      expect(devCat).toBeDefined();
      expect(devCat!.name).toBe('Development');
    });

    it('handles large vault export/import', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const entries: Entry[] = [];
      const categories: Category[] = [
        {
          id: 'cat-1',
          name: 'Category 1',
          icon: '\u{1F4C1}',
          color: '#FF0000',
          updatedAt: new Date(),
        },
      ];

      for (let i = 0; i < 100; i++) {
        entries.push(
          createTestEntry({
            id: `entry-${i}`,
            title: `Entry ${i}`,
            username: `user${i}@example.com`,
            password: `password${i}`,
            categoryId: 'cat-1',
          })
        );
      }

      const exported = await exportVault(entries, categories, key, salt);
      const result = await importVault(exported, key);

      expect(result.entries).toHaveLength(100);
      expect(result.categories).toHaveLength(1);
    });

    it('preserves deleted items for sync propagation', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const entries: Entry[] = [
        createTestEntry({ id: 'active', title: 'Active Entry' }),
        createTestEntry({
          id: 'deleted',
          title: 'Deleted Entry',
          deletedAt: new Date('2026-01-15T00:00:00Z'),
        }),
      ];

      const exported = await exportVault(entries, [], key, salt);
      const result = await importVault(exported, key);

      expect(result.entries).toHaveLength(2);
      const deletedEntry = result.entries.find((e) => e.id === 'deleted');
      expect(deletedEntry!.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Format Version Compatibility', () => {
    it('rejects unsupported export versions', async () => {
      const salt = generateSalt();
      const key = deriveKey('password', salt);

      const invalidExport = Buffer.from(
        JSON.stringify({
          version: 2,
          salt: salt.toString('base64'),
          iv: Buffer.alloc(12).toString('base64'),
          data: Buffer.alloc(16).toString('base64'),
        })
      );

      await expect(importVault(invalidExport, key)).rejects.toThrow('Unsupported export version');
    });

    it('rejects malformed JSON', async () => {
      const key = deriveKey('password', generateSalt());
      const malformed = Buffer.from('not valid json {]');

      await expect(importVault(malformed, key)).rejects.toThrow();
    });

    it('validates required export fields', async () => {
      const key = deriveKey('password', generateSalt());

      const missingFields = Buffer.from(
        JSON.stringify({
          version: 1,
          salt: Buffer.alloc(16).toString('base64'),
        })
      );

      await expect(importVault(missingFields, key)).rejects.toThrow();
    });
  });

  describe('Deterministic Key Derivation', () => {
    it('produces same key from same password and salt', () => {
      const password = 'my-master-password';
      const salt = Buffer.from('0123456789abcdef', 'hex');

      const key1 = deriveKey(password, salt);
      const key2 = deriveKey(password, salt);

      expect(key1.equals(key2)).toBe(true);
    });

    it('produces different keys from different passwords', () => {
      const salt = generateSalt();

      const key1 = deriveKey('password1', salt);
      const key2 = deriveKey('password2', salt);

      expect(key1.equals(key2)).toBe(false);
    });

    it('produces different keys from different salts', () => {
      const password = 'same-password';
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = deriveKey(password, salt1);
      const key2 = deriveKey(password, salt2);

      expect(key1.equals(key2)).toBe(false);
    });

    it('uses correct PBKDF2 parameters', () => {
      const password = 'test-password';
      const salt = Buffer.alloc(16, 0x42);

      const key = deriveKey(password, salt);

      expect(key.length).toBe(32);
    });
  });
});
