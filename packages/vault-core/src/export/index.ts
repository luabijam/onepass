import {
  encryptExport,
  decryptExport,
  combineCiphertextAndTag,
  splitCiphertextAndTag,
} from './crypto.js';
import type { Entry, Category } from '../models/index.js';
import type { SyncPayload } from '../sync/protocol.js';

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
  key: Buffer,
  salt: Buffer
): Promise<Buffer> {
  const payload: SyncPayload = { entries, categories };
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf-8');

  const { ciphertext, iv, tag } = encryptExport(plaintext, key);
  const combinedData = combineCiphertextAndTag(ciphertext, tag);

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    data: combinedData.toString('base64'),
  };

  return Buffer.from(JSON.stringify(exportData), 'utf-8');
}

export async function importVault(
  fileBytes: Buffer,
  key: Buffer
): Promise<{ entries: Entry[]; categories: Category[]; salt: Buffer }> {
  const exportData: ExportData = JSON.parse(fileBytes.toString('utf-8'));

  if (exportData.version !== EXPORT_VERSION) {
    throw new Error('Unsupported export version');
  }

  const salt = Buffer.from(exportData.salt, 'base64');
  const iv = Buffer.from(exportData.iv, 'base64');
  const data = Buffer.from(exportData.data, 'base64');

  const { ciphertext, tag } = splitCiphertextAndTag(data);
  const plaintext = decryptExport(ciphertext, key, iv, tag);
  const payload: SyncPayload = JSON.parse(plaintext.toString('utf-8'));

  return {
    entries: payload.entries,
    categories: payload.categories,
    salt,
  };
}
