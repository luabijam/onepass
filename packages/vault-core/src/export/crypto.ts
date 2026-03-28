const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const GCM_KEY_LENGTH = 32;

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

export async function encryptExport(data: Uint8Array, key: Uint8Array): Promise<EncryptedPayload> {
  if (key.length !== GCM_KEY_LENGTH) {
    throw new Error(`Key must be ${GCM_KEY_LENGTH} bytes, got ${key.length}`);
  }

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
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    data.buffer as ArrayBuffer
  );

  const encryptedArray = new Uint8Array(encrypted);
  return {
    ciphertext: encryptedArray.slice(0, -GCM_TAG_LENGTH),
    iv,
    tag: encryptedArray.slice(-GCM_TAG_LENGTH),
  };
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
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    combined.buffer as ArrayBuffer
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

export { GCM_IV_LENGTH, GCM_TAG_LENGTH, GCM_KEY_LENGTH };
