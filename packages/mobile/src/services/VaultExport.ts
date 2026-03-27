import type { Entry, Category, SyncPayload } from '@onepass/vault-core';
import {
  deriveKey,
  sha256,
  encryptAesGcm,
  decryptAesGcm,
  uint8ArrayToBase64,
  base64ToUint8Array,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
} from './RnCrypto';

const EXPORT_VERSION = 1;

export interface ExportData {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

function serializePayload(payload: SyncPayload): string {
  return JSON.stringify({
    entries: payload.entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
    })),
    categories: payload.categories.map((category) => ({
      ...category,
      updatedAt: category.updatedAt.toISOString(),
      deletedAt: category.deletedAt?.toISOString(),
    })),
  });
}

function deserializePayload(json: string): SyncPayload {
  const data = JSON.parse(json);
  return {
    entries: data.entries.map((entry: Entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
    })),
    categories: data.categories.map((category: Category) => ({
      ...category,
      updatedAt: new Date(category.updatedAt),
      deletedAt: category.deletedAt ? new Date(category.deletedAt) : undefined,
    })),
  };
}

export async function exportVault(
  entries: Entry[],
  categories: Category[],
  key: Uint8Array,
  salt: Uint8Array
): Promise<string> {
  const payload: SyncPayload = { entries, categories };
  const plaintext = new TextEncoder().encode(serializePayload(payload));

  const { ciphertext, iv, tag } = await encryptAesGcm(plaintext, key);
  const combinedData = combineCiphertextAndTag(ciphertext, tag);

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    data: uint8ArrayToBase64(combinedData),
  };

  return JSON.stringify(exportData);
}

export async function importVault(
  fileContent: string,
  password: string
): Promise<{ entries: Entry[]; categories: Category[]; salt: Uint8Array }> {
  const exportData: ExportData = JSON.parse(fileContent);

  if (exportData.version !== EXPORT_VERSION) {
    throw new Error('Unsupported export version');
  }

  const salt = base64ToUint8Array(exportData.salt);
  const iv = base64ToUint8Array(exportData.iv);
  const combinedData = base64ToUint8Array(exportData.data);

  const key = await deriveKey(password, salt);

  const { ciphertext, tag } = splitCiphertextAndTag(combinedData);

  try {
    const plaintext = await decryptAesGcm(ciphertext, key, iv, tag);
    const payload = deserializePayload(new TextDecoder().decode(plaintext));

    return {
      entries: payload.entries,
      categories: payload.categories,
      salt,
    };
  } catch {
    throw new Error('Decryption failed. Incorrect password or corrupted file.');
  }
}

export async function verifyPassword(
  password: string,
  saltBase64: string,
  storedHash: string
): Promise<boolean> {
  const salt = base64ToUint8Array(saltBase64);
  const key = await deriveKey(password, salt);
  const keyHash = await sha256(key);
  const computedHash = uint8ArrayToBase64(keyHash);
  return computedHash === storedHash;
}

export async function deriveKeyFromPassword(
  password: string,
  saltBase64: string
): Promise<Uint8Array> {
  const salt = base64ToUint8Array(saltBase64);
  return deriveKey(password, salt);
}
