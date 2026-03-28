import 'react-native-get-random-values';
import { sha256 as sha256Hash } from '@noble/hashes/sha2';
import { hmac } from '@noble/hashes/hmac';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/hashes/utils';

const PBKDF2_ITERATIONS = 5000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

export function generateSalt(): Uint8Array {
  return randomBytes(SALT_LENGTH);
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const derivedKey = pbkdf2(sha256Hash, passwordBytes, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH,
  });

  return derivedKey;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return sha256Hash(data);
}

export async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  return hmac(sha256Hash, key, message);
}

export async function computeSyncToken(key: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const message = encoder.encode(SYNC_TOKEN_MESSAGE);
  const hash = sha256Hash(key);
  return hmac(sha256Hash, hash, message);
}

export async function encryptAesGcm(
  plaintext: Uint8Array,
  key: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }> {
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = gcm(key, iv);
  const encrypted = cipher.encrypt(plaintext);

  const ciphertext = encrypted.slice(0, -GCM_TAG_LENGTH);
  const tag = encrypted.slice(-GCM_TAG_LENGTH);

  return { ciphertext, iv, tag };
}

export async function decryptAesGcm(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array
): Promise<Uint8Array> {
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const cipher = gcm(key, iv);
  return cipher.decrypt(combined);
}

export function combineCiphertextAndTag(ciphertext: Uint8Array, tag: Uint8Array): Uint8Array {
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);
  return combined;
}

export function splitCiphertextAndTag(combined: Uint8Array): {
  ciphertext: Uint8Array;
  tag: Uint8Array;
} {
  if (combined.length < GCM_TAG_LENGTH) {
    throw new Error('Combined buffer too short to contain tag');
  }
  const ciphertext = combined.slice(0, -GCM_TAG_LENGTH);
  const tag = combined.slice(-GCM_TAG_LENGTH);
  return { ciphertext, tag };
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
    const b2 = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;

    const triplet = (b0 << 16) | (b1 << 8) | b2;

    result += CHARS[(triplet >> 18) & 63];
    result += CHARS[(triplet >> 12) & 63];
    result += i + 1 < len ? CHARS[(triplet >> 6) & 63] : '=';
    result += i + 2 < len ? CHARS[triplet & 63] : '=';
  }

  return result;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const padding = (base64.match(/[=]/g) || []).length;
  const len = base64.length;
  const byteLen = Math.floor((len * 3) / 4) - padding;
  const bytes = new Uint8Array(byteLen);
  let bytePos = 0;

  for (let i = 0; i < len; i += 4) {
    const c0 = CHARS.indexOf(base64[i] ?? 'A');
    const c1 = CHARS.indexOf(base64[i + 1] ?? 'A');
    const c2 = base64[i + 2] === '=' ? 0 : CHARS.indexOf(base64[i + 2] ?? 'A');
    const c3 = base64[i + 3] === '=' ? 0 : CHARS.indexOf(base64[i + 3] ?? 'A');

    bytes[bytePos++] = (c0 << 2) | (c1 >> 4);
    if (bytePos < bytes.length && base64[i + 2] !== '=') {
      bytes[bytePos++] = ((c1 & 15) << 4) | (c2 >> 2);
    }
    if (bytePos < bytes.length && base64[i + 3] !== '=') {
      bytes[bytePos++] = ((c2 & 3) << 6) | c3;
    }
  }

  return bytes;
}

export function uint8ArrayToBuffer(bytes: Uint8Array): Uint8Array {
  return bytes;
}

export function bufferToUint8Array(buffer: Uint8Array): Uint8Array {
  return buffer;
}

export { PBKDF2_ITERATIONS, KEY_LENGTH, SALT_LENGTH, GCM_IV_LENGTH, GCM_TAG_LENGTH };
