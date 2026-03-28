import {
  encryptExport,
  decryptExport,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
} from './crypto.js';
import type { Entry, Category } from '../models/index.js';
import { serializeSyncPayload, deserializeSyncPayload } from '../sync/protocol.js';

const EXPORT_VERSION = 1;

export interface ExportData {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

export async function exportVault(
  entries: Entry[],
  categories: Category[],
  key: Uint8Array,
  salt: Uint8Array
): Promise<Uint8Array> {
  const payload = { entries, categories };
  const plaintext = new TextEncoder().encode(serializeSyncPayload(payload));

  const { ciphertext, iv, tag } = await encryptExport(plaintext, key);
  const combinedData = combineCiphertextAndTag(ciphertext, tag);

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...combinedData)),
  };

  return new TextEncoder().encode(JSON.stringify(exportData));
}

export async function importVault(
  fileBytes: Uint8Array,
  key: Uint8Array
): Promise<{ entries: Entry[]; categories: Category[]; salt: Uint8Array }> {
  const exportData: ExportData = JSON.parse(new TextDecoder().decode(fileBytes));

  if (exportData.version !== EXPORT_VERSION) {
    throw new Error('Unsupported export version');
  }

  const salt = Uint8Array.from(atob(exportData.salt), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(exportData.iv), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(exportData.data), (c) => c.charCodeAt(0));

  const { ciphertext, tag } = splitCiphertextAndTag(data);
  const plaintext = await decryptExport(ciphertext, key, iv, tag);
  const payload = deserializeSyncPayload(new TextDecoder().decode(plaintext));

  return {
    entries: payload.entries,
    categories: payload.categories,
    salt,
  };
}
