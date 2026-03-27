import crypto from 'react-native-quick-crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

export function generateSalt(): Uint8Array {
  return crypto.randomBytes(SALT_LENGTH);
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const prf = async (data: Uint8Array): Promise<Uint8Array> => {
    return hmacSha256(passwordBytes, data);
  };

  const blocks = Math.ceil(KEY_LENGTH / 32);
  const result = new Uint8Array(blocks * 32);

  for (let blockIndex = 1; blockIndex <= blocks; blockIndex++) {
    const blockIndexBytes = new Uint8Array(4);
    blockIndexBytes[0] = (blockIndex >> 24) & 0xff;
    blockIndexBytes[1] = (blockIndex >> 16) & 0xff;
    blockIndexBytes[2] = (blockIndex >> 8) & 0xff;
    blockIndexBytes[3] = blockIndex & 0xff;

    const u1Data = new Uint8Array(salt.length + 4);
    u1Data.set(salt, 0);
    u1Data.set(blockIndexBytes, salt.length);

    let u = await prf(u1Data);
    const resultBlock = new Uint8Array(u);

    for (let i = 1; i < PBKDF2_ITERATIONS; i++) {
      u = await prf(u);
      for (let j = 0; j < 32; j++) {
        resultBlock[j] ^= u[j] ?? 0;
      }
    }

    result.set(resultBlock, (blockIndex - 1) * 32);
  }

  return result.slice(0, KEY_LENGTH);
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data);
  return new Uint8Array(hashBuffer);
}

export async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign({ name: 'HMAC' }, cryptoKey, message);
  return new Uint8Array(signature);
}

export async function computeSyncToken(key: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const message = encoder.encode(SYNC_TOKEN_MESSAGE);
  const hash = await sha256(key);
  return hmacSha256(hash, message);
}

export async function encryptAesGcm(
  plaintext: Uint8Array,
  key: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }> {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    plaintext
  );

  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -GCM_TAG_LENGTH);
  const tag = encryptedArray.slice(-GCM_TAG_LENGTH);

  return { ciphertext, iv, tag };
}

export async function decryptAesGcm(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    combined
  );

  return new Uint8Array(decrypted);
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
