import { createHash, createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits
const GCM_IV_LENGTH = 12; // 96 bits
const GCM_TAG_LENGTH = 16; // 128 bits
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

/**
 * Derives a 256-bit encryption key from a password using PBKDF2-SHA256.
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Generates a cryptographically secure random salt.
 */
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

/**
 * Computes the sync authentication token as HMAC-SHA256(key, message).
 */
export function computeSyncToken(key: Buffer): Buffer {
  return createHash('sha256').update(key).update(SYNC_TOKEN_MESSAGE).digest();
}

/**
 * Generates a random password with specified options.
 */
export function generatePassword(options: {
  length: number;
  uppercase?: boolean;
  lowercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
}): string {
  const { length, uppercase = true, lowercase = true, digits = true, symbols = false } = options;

  if (!uppercase && !lowercase && !digits && !symbols) {
    throw new Error('At least one character class must be enabled');
  }

  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const digitChars = '0123456789';
  const symbolChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let pool = '';
  const required: string[] = [];

  if (uppercase) {
    pool += upperChars;
    required.push(upperChars[Math.floor(Math.random() * upperChars.length)]!);
  }
  if (lowercase) {
    pool += lowerChars;
    required.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]!);
  }
  if (digits) {
    pool += digitChars;
    required.push(digitChars[Math.floor(Math.random() * digitChars.length)]!);
  }
  if (symbols) {
    pool += symbolChars;
    required.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]!);
  }

  // Fill remaining length with random characters from pool
  const remaining = length - required.length;
  const chars = [...required];
  for (let i = 0; i < remaining; i++) {
    chars.push(pool[Math.floor(Math.random() * pool.length)]!);
  }

  // Shuffle the characters
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join('');
}

/**
 * Encrypts data using AES-256-GCM.
 */
export function encrypt(
  data: Buffer,
  key: Buffer
): { ciphertext: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { ciphertext: encrypted, iv, tag };
}

/**
 * Decrypts data using AES-256-GCM.
 */
export function decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export { PBKDF2_ITERATIONS, KEY_LENGTH, SALT_LENGTH, GCM_IV_LENGTH, GCM_TAG_LENGTH };
