import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type {Entry, Category} from '@onepass/vault-core';
import {createDefaultCategory} from '@onepass/vault-core';
import {KeychainService} from './KeychainService';
import {BiometricsService} from './BiometricsService';
import {
  generateSalt,
  deriveKey,
  sha256,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './NodeCrypto';

const VAULT_DIR = 'onepass';
const ENTRIES_FILE = 'entries.json';
const CATEGORIES_FILE = 'categories.json';
const SALT_FILE = 'salt.json';
const PASSWORD_HASH_KEY = 'password_hash';
const BIOMETRIC_KEY_ID = 'biometric_key';

interface UnlockResult {
  success: boolean;
  error?: string;
  salt?: Uint8Array;
  entries?: Entry[];
  categories?: Category[];
}

interface CreateVaultResult {
  success: boolean;
  error?: string;
  salt?: Uint8Array;
}

function getVaultDir(): string {
  return path.join(os.homedir(), VAULT_DIR);
}

function ensureVaultDir(): void {
  const vaultDir = getVaultDir();
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, {recursive: true});
  }
}

function serializeEntries(entries: Entry[]): string {
  return JSON.stringify(
    entries.map(entry => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
    })),
  );
}

function deserializeEntries(json: string): Entry[] {
  const data = JSON.parse(json);
  return data.map(
    (
      entry: Entry & {createdAt: string; updatedAt: string; deletedAt?: string},
    ) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
    }),
  );
}

function serializeCategories(categories: Category[]): string {
  return JSON.stringify(
    categories.map(cat => ({
      ...cat,
      updatedAt: cat.updatedAt.toISOString(),
      deletedAt: cat.deletedAt?.toISOString(),
    })),
  );
}

function deserializeCategories(json: string): Category[] {
  const data = JSON.parse(json);
  return data.map(
    (cat: Category & {updatedAt: string; deletedAt?: string}) => ({
      ...cat,
      updatedAt: new Date(cat.updatedAt),
      deletedAt: cat.deletedAt ? new Date(cat.deletedAt) : undefined,
    }),
  );
}

export const VaultStorage = {
  async isVaultInitialized(): Promise<boolean> {
    try {
      const saltPath = path.join(getVaultDir(), SALT_FILE);
      return fs.existsSync(saltPath);
    } catch {
      return false;
    }
  },

  async createVault(password: string): Promise<CreateVaultResult> {
    try {
      ensureVaultDir();

      const salt = generateSalt();
      const key = deriveKey(password, salt);
      const keyHash = sha256(key);
      const passwordHash = uint8ArrayToBase64(keyHash);

      const keychain = new KeychainService();
      await keychain.storePassword(PASSWORD_HASH_KEY, passwordHash);

      const saltPath = path.join(getVaultDir(), SALT_FILE);
      fs.writeFileSync(
        saltPath,
        JSON.stringify({salt: uint8ArrayToBase64(salt)}),
      );

      const defaultCategories: Category[] = [createDefaultCategory()];
      const categoriesPath = path.join(getVaultDir(), CATEGORIES_FILE);
      fs.writeFileSync(categoriesPath, serializeCategories(defaultCategories));

      const entriesPath = path.join(getVaultDir(), ENTRIES_FILE);
      fs.writeFileSync(entriesPath, serializeEntries([]));

      return {success: true, salt: new Uint8Array(salt)};
    } catch {
      return {success: false, error: 'Failed to create vault'};
    }
  },

  async unlock(password: string): Promise<UnlockResult> {
    try {
      const saltPath = path.join(getVaultDir(), SALT_FILE);
      if (!fs.existsSync(saltPath)) {
        return {success: false, error: 'Vault not initialized'};
      }

      const keychain = new KeychainService();
      const storedHash = await keychain.getPassword(PASSWORD_HASH_KEY);
      if (!storedHash) {
        return {success: false, error: 'Vault not initialized'};
      }

      const saltData = JSON.parse(fs.readFileSync(saltPath, 'utf-8'));
      const salt = base64ToUint8Array(saltData.salt);
      const key = deriveKey(password, Buffer.from(salt));
      const keyHash = sha256(key);
      const computedHash = uint8ArrayToBase64(keyHash);

      if (computedHash !== storedHash) {
        return {success: false, error: 'Incorrect password'};
      }

      const entriesPath = path.join(getVaultDir(), ENTRIES_FILE);
      const categoriesPath = path.join(getVaultDir(), CATEGORIES_FILE);

      const entries = fs.existsSync(entriesPath)
        ? deserializeEntries(fs.readFileSync(entriesPath, 'utf-8'))
        : [];
      const categories = fs.existsSync(categoriesPath)
        ? deserializeCategories(fs.readFileSync(categoriesPath, 'utf-8'))
        : [];

      return {
        success: true,
        salt,
        entries,
        categories,
      };
    } catch {
      return {success: false, error: 'Incorrect password'};
    }
  },

  async lock(): Promise<void> {
    await Promise.resolve();
  },

  async saveEntries(entries: Entry[]): Promise<void> {
    ensureVaultDir();
    const entriesPath = path.join(getVaultDir(), ENTRIES_FILE);
    fs.writeFileSync(entriesPath, serializeEntries(entries));
  },

  async saveCategories(categories: Category[]): Promise<void> {
    ensureVaultDir();
    const categoriesPath = path.join(getVaultDir(), CATEGORIES_FILE);
    fs.writeFileSync(categoriesPath, serializeCategories(categories));
  },

  async getEntries(): Promise<Entry[]> {
    const entriesPath = path.join(getVaultDir(), ENTRIES_FILE);
    if (!fs.existsSync(entriesPath)) {
      return [];
    }
    return deserializeEntries(fs.readFileSync(entriesPath, 'utf-8'));
  },

  async getCategories(): Promise<Category[]> {
    const categoriesPath = path.join(getVaultDir(), CATEGORIES_FILE);
    if (!fs.existsSync(categoriesPath)) {
      return [createDefaultCategory()];
    }
    return deserializeCategories(fs.readFileSync(categoriesPath, 'utf-8'));
  },

  async getSalt(): Promise<Uint8Array | null> {
    const saltPath = path.join(getVaultDir(), SALT_FILE);
    if (!fs.existsSync(saltPath)) {
      return null;
    }
    const saltData = JSON.parse(fs.readFileSync(saltPath, 'utf-8'));
    return base64ToUint8Array(saltData.salt);
  },

  async enableBiometrics(password: string): Promise<boolean> {
    try {
      const salt = await this.getSalt();
      if (!salt) return false;

      const key = deriveKey(password, Buffer.from(salt));

      const biometrics = new BiometricsService();
      const hasKey = await biometrics.hasBiometricKey();
      if (!hasKey) {
        await biometrics.createBiometricKey();
      }

      const keychain = new KeychainService();
      await keychain.storePassword(BIOMETRIC_KEY_ID, uint8ArrayToBase64(key));

      return true;
    } catch {
      return false;
    }
  },

  async unlockWithBiometrics(): Promise<UnlockResult> {
    try {
      const biometrics = new BiometricsService();
      const hasKey = await biometrics.hasBiometricKey();
      if (!hasKey) {
        return {success: false, error: 'Biometrics not set up'};
      }

      const authenticated = await biometrics.authenticate();
      if (!authenticated) {
        return {success: false, error: 'Biometric authentication failed'};
      }

      const keychain = new KeychainService();
      const keyBase64 = await keychain.getPassword(BIOMETRIC_KEY_ID);
      if (!keyBase64) {
        return {success: false, error: 'Biometric key not found'};
      }

      const entriesPath = path.join(getVaultDir(), ENTRIES_FILE);
      const categoriesPath = path.join(getVaultDir(), CATEGORIES_FILE);
      const saltPath = path.join(getVaultDir(), SALT_FILE);

      const entries = fs.existsSync(entriesPath)
        ? deserializeEntries(fs.readFileSync(entriesPath, 'utf-8'))
        : [];
      const categories = fs.existsSync(categoriesPath)
        ? deserializeCategories(fs.readFileSync(categoriesPath, 'utf-8'))
        : [];
      const salt = fs.existsSync(saltPath)
        ? base64ToUint8Array(
            JSON.parse(fs.readFileSync(saltPath, 'utf-8')).salt,
          )
        : null;

      return {
        success: true,
        salt: salt ?? undefined,
        entries,
        categories,
      };
    } catch {
      return {success: false, error: 'Biometric unlock failed'};
    }
  },

  async isBiometricsEnabled(): Promise<boolean> {
    try {
      const keychain = new KeychainService();
      return await keychain.hasPassword(BIOMETRIC_KEY_ID);
    } catch {
      return false;
    }
  },

  async disableBiometrics(): Promise<void> {
    try {
      const keychain = new KeychainService();
      await keychain.deletePassword(BIOMETRIC_KEY_ID);
    } catch {
      // Ignore errors
    }
  },

  async clearVault(): Promise<void> {
    const vaultDir = getVaultDir();
    const entriesPath = path.join(vaultDir, ENTRIES_FILE);
    const categoriesPath = path.join(vaultDir, CATEGORIES_FILE);
    const saltPath = path.join(vaultDir, SALT_FILE);

    if (fs.existsSync(entriesPath)) fs.unlinkSync(entriesPath);
    if (fs.existsSync(categoriesPath)) fs.unlinkSync(categoriesPath);
    if (fs.existsSync(saltPath)) fs.unlinkSync(saltPath);

    const keychain = new KeychainService();
    await keychain.deletePassword(PASSWORD_HASH_KEY);
    await keychain.deletePassword(BIOMETRIC_KEY_ID);
    await keychain.deleteToken('sync_token');
  },
};
