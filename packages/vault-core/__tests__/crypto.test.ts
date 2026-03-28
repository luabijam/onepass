import { describe, it, expect } from '@jest/globals';
import {
  deriveKey,
  generateSalt,
  computeSyncToken,
  generatePassword,
} from '../src/crypto/index.js';

describe('crypto', () => {
  describe('deriveKey', () => {
    it('produces 32-byte key from password and salt', () => {
      const salt = generateSalt();
      const key = deriveKey('mypassword', salt);
      expect(key.length).toBe(32);
    });

    it('is deterministic - same inputs produce same key', () => {
      const salt = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      const key1 = deriveKey('mypassword', salt);
      const key2 = deriveKey('mypassword', salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it('differs when password differs', () => {
      const salt = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      const key1 = deriveKey('password1', salt);
      const key2 = deriveKey('password2', salt);
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('generateSalt', () => {
    it('produces 16 random bytes', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(16);
    });

    it('values are random (two calls differ)', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1.equals(salt2)).toBe(false);
    });
  });

  describe('computeSyncToken', () => {
    it('produces 32-byte HMAC-SHA256', () => {
      const key = Buffer.alloc(32, 0x42);
      const token = computeSyncToken(key);
      expect(token.length).toBe(32);
    });

    it('is deterministic', () => {
      const key = Buffer.alloc(32, 0x42);
      const token1 = computeSyncToken(key);
      const token2 = computeSyncToken(key);
      expect(token1.equals(token2)).toBe(true);
    });
  });

  describe('generatePassword', () => {
    it('throws when all character classes disabled', () => {
      expect(() =>
        generatePassword({
          length: 16,
          uppercase: false,
          lowercase: false,
          digits: false,
          symbols: false,
        })
      ).toThrow();
    });

    it('generates password of requested length', () => {
      const password = generatePassword({ length: 20, uppercase: true, lowercase: true });
      expect(password.length).toBe(20);
    });

    it('includes at least one char from each enabled class', () => {
      for (let i = 0; i < 10; i++) {
        const password = generatePassword({
          length: 16,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        expect(/[A-Z]/.test(password)).toBe(true);
        expect(/[a-z]/.test(password)).toBe(true);
        expect(/[0-9]/.test(password)).toBe(true);
        expect(/[^A-Za-z0-9]/.test(password)).toBe(true);
      }
    });
  });
});
