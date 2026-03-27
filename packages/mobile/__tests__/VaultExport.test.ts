import {
  exportVault,
  importVault,
  verifyPassword,
  deriveKeyFromPassword,
} from '../src/services/VaultExport';
import { generateSalt, uint8ArrayToBase64, sha256 } from '../src/services/RnCrypto';

jest.mock('react-native-quick-crypto', () => {
  return {
    subtle: {
      digest: async (_algorithm: unknown, data: Uint8Array) => {
        const hash = new Uint8Array(32);
        for (let i = 0; i < Math.min(data.length, 32); i++) {
          hash[i] = data[i] ?? 0;
        }
        return hash;
      },
      importKey: async () => ({}),
      sign: async () => new Uint8Array(32),
      encrypt: async (_algorithm: unknown, _key: unknown, data: Uint8Array) => {
        const tagLen = 16;
        const tag = new Uint8Array(tagLen);
        const result = new Uint8Array(data.length + tagLen);
        result.set(data, 0);
        result.set(tag, data.length);
        return result;
      },
      decrypt: async (_algorithm: unknown, _key: unknown, data: Uint8Array) => {
        const tagLen = 16;
        return data.slice(0, -tagLen);
      },
    },
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomBytes: (size: number) => {
      const buffer = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    },
  };
});

describe('VaultExport', () => {
  const mockEntries = [
    {
      id: 'entry-1',
      title: 'Test Entry',
      username: 'user@example.com',
      password: 'password123',
      categoryId: 'uncategorized',
      isFavorite: false,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  const mockCategories = [
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      icon: '\u{1F4C1}',
      color: '#8E8E93',
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  describe('exportVault', () => {
    it('should export vault data as JSON string', async () => {
      const salt = generateSalt();
      const key = await deriveKeyFromPassword('password', uint8ArrayToBase64(salt));

      const exported = await exportVault(mockEntries, mockCategories, key, salt);

      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe(1);
      expect(parsed.salt).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.data).toBeDefined();
    });

    it('should include base64 encoded salt', async () => {
      const salt = generateSalt();
      const key = await deriveKeyFromPassword('password', uint8ArrayToBase64(salt));

      const exported = await exportVault(mockEntries, mockCategories, key, salt);
      const parsed = JSON.parse(exported);

      expect(parsed.salt).toBe(uint8ArrayToBase64(salt));
    });
  });

  describe('importVault', () => {
    it('should throw on unsupported version', async () => {
      const invalidExport = JSON.stringify({
        version: 999,
        salt: 'abc',
        iv: 'def',
        data: 'ghi',
      });

      await expect(importVault(invalidExport, 'password')).rejects.toThrow(
        'Unsupported export version'
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly with mock hash', async () => {
      const salt = generateSalt();
      const saltBase64 = uint8ArrayToBase64(salt);
      const key = await deriveKeyFromPassword('password', saltBase64);
      const keyHash = await sha256(key);
      const storedHash = uint8ArrayToBase64(keyHash);

      const result = await verifyPassword('password', saltBase64, storedHash);
      expect(result).toBe(true);
    });

    it('should derive key and hash consistently', async () => {
      const salt = generateSalt();
      const saltBase64 = uint8ArrayToBase64(salt);

      const key1 = await deriveKeyFromPassword('password', saltBase64);
      const key2 = await deriveKeyFromPassword('password', saltBase64);

      expect(key1).toEqual(key2);

      const hash1 = await sha256(key1);
      const hash2 = await sha256(key2);
      expect(hash1).toEqual(hash2);
    });
  });

  describe('deriveKeyFromPassword', () => {
    it('should derive a 32-byte key', async () => {
      const salt = generateSalt();
      const key = await deriveKeyFromPassword('password', uint8ArrayToBase64(salt));
      expect(key.length).toBe(32);
    });

    it('should derive same key for same password and salt', async () => {
      const salt = generateSalt();
      const saltBase64 = uint8ArrayToBase64(salt);
      const key1 = await deriveKeyFromPassword('password', saltBase64);
      const key2 = await deriveKeyFromPassword('password', saltBase64);
      expect(key1).toEqual(key2);
    });
  });
});
