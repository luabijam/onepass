import {
  generateSalt,
  deriveKey,
  sha256,
  computeSyncToken,
  encryptAesGcm,
  decryptAesGcm,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
  uint8ArrayToBase64,
  base64ToUint8Array,
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
} from '../src/services/NodeCrypto';

describe('NodeCrypto', () => {
  describe('generateSalt', () => {
    it('generates a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(SALT_LENGTH);
    });

    it('generates unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('deriveKey', () => {
    it('derives a key of correct length', () => {
      const password = 'test-password';
      const salt = generateSalt();
      const key = deriveKey(password, salt);
      expect(key.length).toBe(KEY_LENGTH);
    });

    it('produces same key for same password and salt', () => {
      const password = 'test-password';
      const salt = generateSalt();
      const key1 = deriveKey(password, salt);
      const key2 = deriveKey(password, salt);
      expect(key1).toEqual(key2);
    });

    it('produces different keys for different passwords', () => {
      const salt = generateSalt();
      const key1 = deriveKey('password1', salt);
      const key2 = deriveKey('password2', salt);
      expect(key1).not.toEqual(key2);
    });

    it('produces different keys for different salts', () => {
      const password = 'test-password';
      const key1 = deriveKey(password, generateSalt());
      const key2 = deriveKey(password, generateSalt());
      expect(key1).not.toEqual(key2);
    });
  });

  describe('sha256', () => {
    it('produces consistent hash for same input', () => {
      const data = Buffer.from('test data');
      const hash1 = sha256(data);
      const hash2 = sha256(data);
      expect(hash1).toEqual(hash2);
    });

    it('produces different hash for different input', () => {
      const hash1 = sha256(Buffer.from('data1'));
      const hash2 = sha256(Buffer.from('data2'));
      expect(hash1).not.toEqual(hash2);
    });

    it('produces 32-byte hash', () => {
      const hash = sha256(Buffer.from('test'));
      expect(hash.length).toBe(32);
    });
  });

  describe('computeSyncToken', () => {
    it('produces consistent token for same key', () => {
      const key = deriveKey('password', generateSalt());
      const token1 = computeSyncToken(key);
      const token2 = computeSyncToken(key);
      expect(token1).toEqual(token2);
    });

    it('produces different tokens for different keys', () => {
      const key1 = deriveKey('password1', generateSalt());
      const key2 = deriveKey('password2', generateSalt());
      const token1 = computeSyncToken(key1);
      const token2 = computeSyncToken(key2);
      expect(token1).not.toEqual(token2);
    });
  });

  describe('encryptAesGcm and decryptAesGcm', () => {
    it('encrypts and decrypts data correctly', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const {ciphertext, iv, tag} = encryptAesGcm(plaintext, key);
      const decrypted = decryptAesGcm(ciphertext, key, iv, tag);
      expect(decrypted.toString()).toBe('secret message');
    });

    it('produces different ciphertext for same plaintext', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const result1 = encryptAesGcm(plaintext, key);
      const result2 = encryptAesGcm(plaintext, key);
      expect(result1.ciphertext).not.toEqual(result2.ciphertext);
    });

    it('produces IV of correct length', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const {iv} = encryptAesGcm(plaintext, key);
      expect(iv.length).toBe(GCM_IV_LENGTH);
    });

    it('produces tag of correct length', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const {tag} = encryptAesGcm(plaintext, key);
      expect(tag.length).toBe(GCM_TAG_LENGTH);
    });

    it('fails decryption with wrong key', () => {
      const plaintext = Buffer.from('secret message');
      const key1 = deriveKey('password1', generateSalt());
      const key2 = deriveKey('password2', generateSalt());
      const {ciphertext, iv, tag} = encryptAesGcm(plaintext, key1);
      expect(() => decryptAesGcm(ciphertext, key2, iv, tag)).toThrow();
    });

    it('fails decryption with wrong IV', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const {ciphertext, tag} = encryptAesGcm(plaintext, key);
      const wrongIv = Buffer.alloc(GCM_IV_LENGTH, 0);
      expect(() => decryptAesGcm(ciphertext, key, wrongIv, tag)).toThrow();
    });

    it('fails decryption with wrong tag', () => {
      const plaintext = Buffer.from('secret message');
      const key = deriveKey('password', generateSalt());
      const {ciphertext, iv} = encryptAesGcm(plaintext, key);
      const wrongTag = Buffer.alloc(GCM_TAG_LENGTH, 0);
      expect(() => decryptAesGcm(ciphertext, key, iv, wrongTag)).toThrow();
    });
  });

  describe('combineCiphertextAndTag and splitCiphertextAndTag', () => {
    it('combines and splits correctly', () => {
      const ciphertext = Buffer.from('ciphertext-data');
      const tag = Buffer.alloc(16, 0x42);
      const combined = combineCiphertextAndTag(ciphertext, tag);
      const result = splitCiphertextAndTag(combined);
      expect(result.ciphertext.equals(ciphertext)).toBe(true);
      expect(result.tag.equals(tag)).toBe(true);
    });

    it('throws for buffer too short', () => {
      const shortBuffer = Buffer.alloc(GCM_TAG_LENGTH - 1);
      expect(() => splitCiphertextAndTag(shortBuffer)).toThrow(
        'Combined buffer too short',
      );
    });
  });

  describe('base64 conversion', () => {
    it('converts Uint8Array to base64 and back', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const base64 = uint8ArrayToBase64(bytes);
      const decoded = base64ToUint8Array(base64);
      expect(new Uint8Array(decoded)).toEqual(bytes);
    });

    it('handles empty array', () => {
      const bytes = new Uint8Array([]);
      const base64 = uint8ArrayToBase64(bytes);
      const decoded = base64ToUint8Array(base64);
      expect(new Uint8Array(decoded)).toEqual(bytes);
    });

    it('handles array with padding', () => {
      const bytes = new Uint8Array([1, 2]);
      const base64 = uint8ArrayToBase64(bytes);
      const decoded = base64ToUint8Array(base64);
      expect(new Uint8Array(decoded)).toEqual(bytes);
    });
  });

  describe('constants', () => {
    it('has correct PBKDF2 iterations', () => {
      expect(PBKDF2_ITERATIONS).toBe(100000);
    });

    it('has correct key length', () => {
      expect(KEY_LENGTH).toBe(32);
    });

    it('has correct salt length', () => {
      expect(SALT_LENGTH).toBe(16);
    });

    it('has correct IV length', () => {
      expect(GCM_IV_LENGTH).toBe(12);
    });

    it('has correct tag length', () => {
      expect(GCM_TAG_LENGTH).toBe(16);
    });
  });
});
