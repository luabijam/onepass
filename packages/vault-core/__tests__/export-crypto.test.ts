import { describe, it, expect } from '@jest/globals';
import {
  encryptExport,
  decryptExport,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
  GCM_KEY_LENGTH,
} from '../src/export/crypto.js';
import { randomBytes } from 'crypto';

describe('export/crypto', () => {
  const validKey = randomBytes(32);

  describe('encryptExport', () => {
    it('encrypts data and returns ciphertext, iv, and tag', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const result = encryptExport(plaintext, validKey);

      expect(result.ciphertext).toBeInstanceOf(Buffer);
      expect(result.iv).toBeInstanceOf(Buffer);
      expect(result.tag).toBeInstanceOf(Buffer);
      expect(result.iv.length).toBe(GCM_IV_LENGTH);
      expect(result.tag.length).toBe(GCM_TAG_LENGTH);
    });

    it('produces different ciphertext for same plaintext (random IV)', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const result1 = encryptExport(plaintext, validKey);
      const result2 = encryptExport(plaintext, validKey);

      expect(result1.ciphertext.equals(result2.ciphertext)).toBe(false);
      expect(result1.iv.equals(result2.iv)).toBe(false);
    });

    it('produces different ciphertext with different keys', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const key2 = randomBytes(32);

      const result1 = encryptExport(plaintext, validKey);
      const result2 = encryptExport(plaintext, key2);

      expect(result1.ciphertext.equals(result2.ciphertext)).toBe(false);
    });

    it('throws error for invalid key length', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const invalidKey = Buffer.alloc(16);

      expect(() => encryptExport(plaintext, invalidKey)).toThrow(
        `Key must be ${GCM_KEY_LENGTH} bytes, got 16`
      );
    });

    it('encrypts empty data', () => {
      const plaintext = Buffer.alloc(0);
      const result = encryptExport(plaintext, validKey);

      expect(result.ciphertext).toBeInstanceOf(Buffer);
      expect(result.ciphertext.length).toBe(0);
      expect(result.tag.length).toBe(GCM_TAG_LENGTH);
    });

    it('encrypts large data', () => {
      const plaintext = randomBytes(10000);
      const result = encryptExport(plaintext, validKey);

      expect(result.ciphertext.length).toBe(10000);
    });
  });

  describe('decryptExport', () => {
    it('decrypts data encrypted with encryptExport', () => {
      const plaintext = Buffer.from('secret message', 'utf-8');
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);

      const decrypted = decryptExport(ciphertext, validKey, iv, tag);

      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('decrypts empty data', () => {
      const plaintext = Buffer.alloc(0);
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);

      const decrypted = decryptExport(ciphertext, validKey, iv, tag);

      expect(decrypted.length).toBe(0);
    });

    it('throws error for invalid key length', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const invalidKey = Buffer.alloc(16);

      expect(() => decryptExport(ciphertext, invalidKey, iv, tag)).toThrow(
        `Key must be ${GCM_KEY_LENGTH} bytes, got 16`
      );
    });

    it('throws error for invalid IV length', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, tag } = encryptExport(plaintext, validKey);
      const invalidIv = Buffer.alloc(8);

      expect(() => decryptExport(ciphertext, validKey, invalidIv, tag)).toThrow(
        `IV must be ${GCM_IV_LENGTH} bytes, got 8`
      );
    });

    it('throws error for invalid tag length', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, iv } = encryptExport(plaintext, validKey);
      const invalidTag = Buffer.alloc(8);

      expect(() => decryptExport(ciphertext, validKey, iv, invalidTag)).toThrow(
        `Tag must be ${GCM_TAG_LENGTH} bytes, got 8`
      );
    });

    it('throws error for wrong key', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const wrongKey = randomBytes(32);

      expect(() => decryptExport(ciphertext, wrongKey, iv, tag)).toThrow();
    });

    it('throws error for tampered ciphertext', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const tamperedCiphertext = Buffer.from(ciphertext);
      tamperedCiphertext[0] ^= 0xff;

      expect(() => decryptExport(tamperedCiphertext, validKey, iv, tag)).toThrow();
    });

    it('throws error for tampered tag', () => {
      const plaintext = Buffer.from('test data', 'utf-8');
      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const tamperedTag = Buffer.from(tag);
      tamperedTag[0] ^= 0xff;

      expect(() => decryptExport(ciphertext, validKey, iv, tamperedTag)).toThrow();
    });
  });

  describe('combineCiphertextAndTag', () => {
    it('combines ciphertext and tag into single buffer', () => {
      const ciphertext = Buffer.from('ciphertext', 'utf-8');
      const tag = Buffer.alloc(16, 0x42);

      const combined = combineCiphertextAndTag(ciphertext, tag);

      expect(combined.length).toBe(ciphertext.length + tag.length);
      expect(combined.subarray(0, ciphertext.length).equals(ciphertext)).toBe(true);
      expect(combined.subarray(-16).equals(tag)).toBe(true);
    });

    it('preserves data at correct offsets', () => {
      const ciphertext = randomBytes(100);
      const tag = randomBytes(16);

      const combined = combineCiphertextAndTag(ciphertext, tag);

      expect(combined.subarray(0, 100).equals(ciphertext)).toBe(true);
      expect(combined.subarray(100).equals(tag)).toBe(true);
    });
  });

  describe('splitCiphertextAndTag', () => {
    it('splits combined buffer into ciphertext and tag', () => {
      const ciphertext = Buffer.from('ciphertext', 'utf-8');
      const tag = Buffer.alloc(16, 0x42);
      const combined = Buffer.concat([ciphertext, tag]);

      const result = splitCiphertextAndTag(combined);

      expect(result.ciphertext.equals(ciphertext)).toBe(true);
      expect(result.tag.equals(tag)).toBe(true);
    });

    it('splits correctly for various sizes', () => {
      for (const size of [0, 10, 100, 1000]) {
        const ciphertext = randomBytes(size);
        const tag = randomBytes(16);
        const combined = Buffer.concat([ciphertext, tag]);

        const result = splitCiphertextAndTag(combined);

        expect(result.ciphertext.length).toBe(size);
        expect(result.tag.length).toBe(16);
        expect(result.ciphertext.equals(ciphertext)).toBe(true);
        expect(result.tag.equals(tag)).toBe(true);
      }
    });

    it('throws error for buffer too short to contain tag', () => {
      const shortBuffer = Buffer.alloc(15);

      expect(() => splitCiphertextAndTag(shortBuffer)).toThrow(
        'Combined buffer too short to contain tag'
      );
    });

    it('handles exactly tag-length buffer (empty ciphertext)', () => {
      const tag = randomBytes(16);

      const result = splitCiphertextAndTag(tag);

      expect(result.ciphertext.length).toBe(0);
      expect(result.tag.equals(tag)).toBe(true);
    });
  });

  describe('round-trip encryption', () => {
    it('preserves data through encrypt -> combine -> split -> decrypt', () => {
      const plaintext = Buffer.from('sensitive vault data', 'utf-8');

      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const combined = combineCiphertextAndTag(ciphertext, tag);
      const { ciphertext: splitCiphertext, tag: splitTag } = splitCiphertextAndTag(combined);
      const decrypted = decryptExport(splitCiphertext, validKey, iv, splitTag);

      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('preserves binary data', () => {
      const plaintext = randomBytes(500);

      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const decrypted = decryptExport(ciphertext, validKey, iv, tag);

      expect(decrypted.equals(plaintext)).toBe(true);
    });

    it('preserves unicode text', () => {
      const plaintext = Buffer.from('🔐 Password: 你好世界 🌍', 'utf-8');

      const { ciphertext, iv, tag } = encryptExport(plaintext, validKey);
      const decrypted = decryptExport(ciphertext, validKey, iv, tag);

      expect(decrypted.toString('utf-8')).toBe('🔐 Password: 你好世界 🌍');
    });
  });
});
