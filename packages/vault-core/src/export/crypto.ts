const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const GCM_KEY_LENGTH = 32;

function isReactNative(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).navigator !== 'undefined' &&
    (globalThis as Record<string, unknown>).navigator === 'ReactNative'
  );
}

async function getCrypto(): Promise<typeof globalThis.crypto> {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  throw new Error('Crypto API not available');
}

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
}

async function webCryptoEncryptExport(
  data: Uint8Array,
  key: Uint8Array
): Promise<EncryptedPayload> {
  const crypto = await getCrypto();
  const iv = new Uint8Array(GCM_IV_LENGTH);
  crypto.getRandomValues(iv);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    data.buffer as ArrayBuffer
  );

  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -GCM_TAG_LENGTH);
  const tag = encryptedArray.slice(-GCM_TAG_LENGTH);

  return { ciphertext, iv, tag };
}

async function webCryptoDecryptExport(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array
): Promise<Uint8Array> {
  const crypto = await getCrypto();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    combined.buffer as ArrayBuffer
  );

  return new Uint8Array(decrypted);
}

let nodeCrypto: typeof import('crypto') | null = null;
async function getNodeCrypto(): Promise<typeof import('crypto')> {
  if (!nodeCrypto) {
    nodeCrypto = await import('crypto');
  }
  return nodeCrypto;
}

export async function encryptExport(data: Uint8Array, key: Uint8Array): Promise<EncryptedPayload> {
  if (key.length !== GCM_KEY_LENGTH) {
    throw new Error(`Key must be ${GCM_KEY_LENGTH} bytes, got ${key.length}`);
  }

  if (isReactNative()) {
    return webCryptoEncryptExport(data, key);
  }

  const crypto = await getNodeCrypto();
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { ciphertext, iv, tag };
}

export async function decryptExport(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array
): Promise<Uint8Array> {
  if (key.length !== GCM_KEY_LENGTH) {
    throw new Error(`Key must be ${GCM_KEY_LENGTH} bytes, got ${key.length}`);
  }
  if (iv.length !== GCM_IV_LENGTH) {
    throw new Error(`IV must be ${GCM_IV_LENGTH} bytes, got ${iv.length}`);
  }
  if (tag.length !== GCM_TAG_LENGTH) {
    throw new Error(`Tag must be ${GCM_TAG_LENGTH} bytes, got ${tag.length}`);
  }

  if (isReactNative()) {
    return webCryptoDecryptExport(ciphertext, key, iv, tag);
  }

  const crypto = await getNodeCrypto();
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
  decipher.setAuthTag(Buffer.from(tag));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
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

export { GCM_IV_LENGTH, GCM_TAG_LENGTH, GCM_KEY_LENGTH };
