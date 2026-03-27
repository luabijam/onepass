import {
  createHash,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from 'crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

export function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

export function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest();
}

export function computeSyncToken(key: Buffer): Buffer {
  return createHash('sha256').update(key).update(SYNC_TOKEN_MESSAGE).digest();
}

export function encryptAesGcm(
  plaintext: Buffer,
  key: Buffer,
): {ciphertext: Buffer; iv: Buffer; tag: Buffer} {
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {ciphertext: encrypted, iv, tag};
}

export function decryptAesGcm(
  ciphertext: Buffer,
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function combineCiphertextAndTag(
  ciphertext: Buffer,
  tag: Buffer,
): Buffer {
  return Buffer.concat([ciphertext, tag]);
}

export function splitCiphertextAndTag(combined: Buffer): {
  ciphertext: Buffer;
  tag: Buffer;
} {
  if (combined.length < GCM_TAG_LENGTH) {
    throw new Error('Combined buffer too short to contain tag');
  }
  const ciphertext = Buffer.from(combined.subarray(0, -GCM_TAG_LENGTH));
  const tag = Buffer.from(combined.subarray(-GCM_TAG_LENGTH));
  return {ciphertext, tag};
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function base64ToUint8Array(base64: string): Uint8Array {
  return Buffer.from(base64, 'base64');
}

export function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer);
}

export function uint8ArrayToBuffer(bytes: Uint8Array): Buffer {
  return Buffer.from(bytes);
}

export {
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
  GCM_IV_LENGTH,
  GCM_TAG_LENGTH,
};
