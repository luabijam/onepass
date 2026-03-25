import { exportVault as exportVaultData, importVault as importVaultData } from './index.js';
import type { VaultService } from '../database/vault.js';
import type { Entry, Category } from '../models/index.js';

export class ExportService {
  async exportVault(vault: VaultService, key: Buffer, salt: Buffer): Promise<Buffer> {
    const entries = await vault.getEntries({ includeDeleted: true });
    const categories = await vault.getCategories({ includeDeleted: true });
    return exportVaultData(entries, categories, key, salt);
  }

  async importVault(
    _vault: VaultService,
    fileBytes: Buffer,
    key: Buffer
  ): Promise<{ entries: Entry[]; categories: Category[]; salt: Buffer }> {
    return importVaultData(fileBytes, key);
  }
}
