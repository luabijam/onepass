const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SYNC_TOKEN_MESSAGE = 'onepass-sync-token';

type CryptoBuffer = Uint8Array;

async function getCrypto(): Promise<typeof globalThis.crypto> {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  throw new Error('Crypto API not available');
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

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const crypto = await getCrypto();
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  return new Uint8Array(bits);
}

async function aesGcmEncrypt(
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

async function aesGcmDecrypt(
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
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    combined.buffer as ArrayBuffer
  );
  return new Uint8Array(decrypted);
}

export async function deriveKey(password: string, salt: CryptoBuffer): Promise<CryptoBuffer> {
  return pbkdf2(password, salt);
}

export async function generateSalt(): Promise<CryptoBuffer> {
  const crypto = await getCrypto();
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

export async function computeSyncToken(key: CryptoBuffer): Promise<CryptoBuffer> {
  const hash = await sha256(key);
  return hmacSha256(hash, new TextEncoder().encode(SYNC_TOKEN_MESSAGE));
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
  return aesGcmEncrypt(data, key);
}

export async function decrypt(
  ciphertext: CryptoBuffer,
  key: CryptoBuffer,
  iv: CryptoBuffer,
  tag: CryptoBuffer
): Promise<CryptoBuffer> {
  return aesGcmDecrypt(ciphertext, key, iv, tag);
}

export { PBKDF2_ITERATIONS, KEY_LENGTH, SALT_LENGTH, GCM_IV_LENGTH, GCM_TAG_LENGTH };
