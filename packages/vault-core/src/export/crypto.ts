import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const GCM_KEY_LENGTH = 32;

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
}

export function encryptExport(data: Buffer, key: Buffer): EncryptedPayload {
  if (key.length !== GCM_KEY_LENGTH) {
    throw new Error(`Key must be ${GCM_KEY_LENGTH} bytes, got ${key.length}`);
  }

  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { ciphertext, iv, tag };
}

export function decryptExport(ciphertext: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer {
  if (key.length !== GCM_KEY_LENGTH) {
    throw new Error(`Key must be ${GCM_KEY_LENGTH} bytes, got ${key.length}`);
  }
  if (iv.length !== GCM_IV_LENGTH) {
    throw new Error(`IV must be ${GCM_IV_LENGTH} bytes, got ${iv.length}`);
  }
  if (tag.length !== GCM_TAG_LENGTH) {
    throw new Error(`Tag must be ${GCM_TAG_LENGTH} bytes, got ${tag.length}`);
  }

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function combineCiphertextAndTag(ciphertext: Buffer, tag: Buffer): Buffer {
  return Buffer.concat([ciphertext, tag]);
}

export function splitCiphertextAndTag(combined: Buffer): { ciphertext: Buffer; tag: Buffer } {
  if (combined.length < GCM_TAG_LENGTH) {
    throw new Error('Combined buffer too short to contain tag');
  }
  const ciphertext = combined.subarray(0, -GCM_TAG_LENGTH);
  const tag = combined.subarray(-GCM_TAG_LENGTH);
  return { ciphertext, tag };
}

export { GCM_IV_LENGTH, GCM_TAG_LENGTH, GCM_KEY_LENGTH };
