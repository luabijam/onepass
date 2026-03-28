const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

type CryptoBuffer = Uint8Array;

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

async function webCryptoDeriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
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

async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const crypto = await getCrypto();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'HMAC' },
    cryptoKey,
    message.buffer as ArrayBuffer
  );
  return new Uint8Array(signature);
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const crypto = await getCrypto();
  const hashBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data.buffer as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

async function webCryptoEncrypt(
  data: Uint8Array,
  key: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }> {
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

async function webCryptoDecrypt(
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

export async function deriveKey(password: string, salt: CryptoBuffer): Promise<CryptoBuffer> {
  if (isReactNative()) {
    return webCryptoDeriveKey(password, salt);
  }
  const nodeCrypto = await getNodeCrypto();
  return nodeCrypto.pbkdf2Sync(
    password,
    Buffer.from(salt),
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

export async function generateSalt(): Promise<CryptoBuffer> {
  if (isReactNative()) {
    const crypto = await getCrypto();
    const salt = new Uint8Array(SALT_LENGTH);
    crypto.getRandomValues(salt);
    return salt;
  }
  const nodeCrypto = await getNodeCrypto();
  return nodeCrypto.randomBytes(SALT_LENGTH);
}

export async function computeSyncToken(key: CryptoBuffer): Promise<CryptoBuffer> {
  if (isReactNative()) {
    const hash = await sha256(key);
    return hmacSha256(hash, new TextEncoder().encode(SYNC_TOKEN_MESSAGE));
  }
  const crypto = await getNodeCrypto();
  return crypto.createHash('sha256').update(key).update(SYNC_TOKEN_MESSAGE).digest();
}

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

  const remaining = length - required.length;
  const chars = [...required];
  for (let i = 0; i < remaining; i++) {
    chars.push(pool[Math.floor(Math.random() * pool.length)]!);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join('');
}

export async function encrypt(
  data: CryptoBuffer,
  key: CryptoBuffer
): Promise<{ ciphertext: CryptoBuffer; iv: CryptoBuffer; tag: CryptoBuffer }> {
  if (isReactNative()) {
    return webCryptoEncrypt(data, key);
  }
  const crypto = await getNodeCrypto();
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { ciphertext: encrypted, iv, tag };
}

export async function decrypt(
  ciphertext: CryptoBuffer,
  key: CryptoBuffer,
  iv: CryptoBuffer,
  tag: CryptoBuffer
): Promise<CryptoBuffer> {
  if (isReactNative()) {
    return webCryptoDecrypt(ciphertext, key, iv, tag);
  }
  const crypto = await getNodeCrypto();
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
  decipher.setAuthTag(Buffer.from(tag));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
}

export { PBKDF2_ITERATIONS, KEY_LENGTH, SALT_LENGTH, GCM_IV_LENGTH, GCM_TAG_LENGTH };
