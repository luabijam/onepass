import {
  generateSalt,
  deriveKey,
  sha256,
  computeSyncToken,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
  uint8ArrayToBase64,
  base64ToUint8Array,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
} from '../src/services/RnCrypto';

// Mock Web Crypto API for tests
const mockCrypto = {
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
};

Object.defineProperty(globalThis, 'crypto', {
  value: mockCrypto,
});

describe('RnCrypto', () => {
  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(SALT_LENGTH);
    });

    it('should generate different salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('deriveKey', () => {
    it('should derive a key of correct length', async () => {
      const salt = generateSalt();
      const key = await deriveKey('password', salt);
      expect(key.length).toBe(KEY_LENGTH);
    });

    it('should derive the same key for same password and salt', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('password', salt);
      const key2 = await deriveKey('password', salt);
      expect(key1).toEqual(key2);
    });
  });

  describe('sha256', () => {
    it('should produce a 32-byte hash', async () => {
      const data = new TextEncoder().encode('test data');
      const hash = await sha256(data);
      expect(hash.length).toBe(32);
    });

    it('should produce the same hash for same input', async () => {
      const data = new TextEncoder().encode('test data');
      const hash1 = await sha256(data);
      const hash2 = await sha256(data);
      expect(hash1).toEqual(hash2);
    });
  });

  describe('computeSyncToken', () => {
    it('should produce a token from a key', async () => {
      const key = generateSalt();
      const token = await computeSyncToken(key);
      expect(token.length).toBe(32);
    });

    it('should produce the same token for same key', async () => {
      const key = generateSalt();
      const token1 = await computeSyncToken(key);
      const token2 = await computeSyncToken(key);
      expect(token1).toEqual(token2);
    });
  });

  describe('base64 conversion', () => {
    it('should convert bytes to base64', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = uint8ArrayToBase64(bytes);
      expect(base64).toBe('SGVsbG8=');
    });

    it('should convert base64 to bytes', () => {
      const base64 = 'SGVsbG8=';
      const decoded = base64ToUint8Array(base64);
      expect(decoded).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('should handle padding correctly', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = uint8ArrayToBase64(bytes);
      const decoded = base64ToUint8Array(base64);
      expect(decoded).toEqual(bytes);
    });
  });

  describe('combineCiphertextAndTag / splitCiphertextAndTag', () => {
    it('should combine and split correctly', () => {
      const ciphertext = generateSalt();
      const tag = generateSalt();
      const combined = combineCiphertextAndTag(ciphertext, tag);
      const { ciphertext: ct, tag: t } = splitCiphertextAndTag(combined);
      expect(ct).toEqual(ciphertext);
      expect(t).toEqual(tag);
    });

    it('should throw for buffer too short', () => {
      const shortBuffer = new Uint8Array(10);
      expect(() => splitCiphertextAndTag(shortBuffer)).toThrow('Combined buffer too short');
    });
  });

  describe('constants', () => {
    it('should have correct PBKDF2 iterations', () => {
      expect(PBKDF2_ITERATIONS).toBe(100000);
    });

    it('should have correct key length', () => {
      expect(KEY_LENGTH).toBe(32);
    });

    it('should have correct salt length', () => {
      expect(SALT_LENGTH).toBe(16);
    });

    it('should have correct GCM IV length', () => {
      expect(GCM_IV_LENGTH).toBe(12);
    });

    it('should have correct GCM tag length', () => {
      expect(GCM_TAG_LENGTH).toBe(16);
    });
  });
});
