import { exportVault as exportVaultData, importVault as importVaultData } from './index.js';
import type { VaultService } from '../database/vault.js';
import type { Entry, Category } from '../models/index.js';

export class ExportService {
  async exportVault(vault: VaultService, key: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
    const entries = await vault.getEntries({ includeDeleted: true });
    const categories = await vault.getCategories({ includeDeleted: true });
    return exportVaultData(entries, categories, key, salt);
  }

  async importVault(
    _vault: VaultService,
    fileBytes: Uint8Array,
    key: Uint8Array
  ): Promise<{ entries: Entry[]; categories: Category[]; salt: Uint8Array }> {
    return importVaultData(fileBytes, key);
  }
}
