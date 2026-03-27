import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Entry, Category } from '@onepass/vault-core';
import { KeychainService } from './KeychainService';
import { BiometricsService } from './BiometricsService';
import {
  generateSalt,
  deriveKey,
  sha256,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './RnCrypto';

const ENTRIES_KEY = '@onepass/entries';
const CATEGORIES_KEY = '@onepass/categories';
const SALT_KEY = '@onepass/salt';
const PASSWORD_HASH_KEY = '@onepass/password_hash';
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

function serializeEntries(entries: Entry[]): string {
  return JSON.stringify(
    entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      deletedAt: entry.deletedAt?.toISOString(),
    }))
  );
}

function deserializeEntries(json: string): Entry[] {
  const data = JSON.parse(json);
  return data.map(
    (entry: Entry & { createdAt: string; updatedAt: string; deletedAt?: string }) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      deletedAt: entry.deletedAt ? new Date(entry.deletedAt) : undefined,
    })
  );
}

function serializeCategories(categories: Category[]): string {
  return JSON.stringify(
    categories.map((cat) => ({
      ...cat,
      updatedAt: cat.updatedAt.toISOString(),
      deletedAt: cat.deletedAt?.toISOString(),
    }))
  );
}

function deserializeCategories(json: string): Category[] {
  const data = JSON.parse(json);
  return data.map((cat: Category & { updatedAt: string; deletedAt?: string }) => ({
    ...cat,
    updatedAt: new Date(cat.updatedAt),
    deletedAt: cat.deletedAt ? new Date(cat.deletedAt) : undefined,
  }));
}

export const VaultStorage = {
  async isVaultInitialized(): Promise<boolean> {
    try {
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);
      return saltBase64 !== null;
    } catch {
      return false;
    }
  },

  async createVault(password: string): Promise<CreateVaultResult> {
    try {
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      const keyHash = await sha256(key);
      const passwordHash = uint8ArrayToBase64(keyHash);

      await AsyncStorage.setItem(SALT_KEY, uint8ArrayToBase64(salt));
      await AsyncStorage.setItem(PASSWORD_HASH_KEY, passwordHash);

      const defaultCategories: Category[] = [
        {
          id: 'uncategorized',
          name: 'Uncategorized',
          icon: '\u{1F4C1}',
          color: '#8E8E93',
          updatedAt: new Date(),
        },
      ];

      await AsyncStorage.setItem(CATEGORIES_KEY, serializeCategories(defaultCategories));
      await AsyncStorage.setItem(ENTRIES_KEY, serializeEntries([]));

      return { success: true, salt };
    } catch {
      return { success: false, error: 'Failed to create vault' };
    }
  },

  async unlock(password: string): Promise<UnlockResult> {
    try {
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);
      if (!saltBase64) {
        return { success: false, error: 'Vault not initialized' };
      }

      const storedHash = await AsyncStorage.getItem(PASSWORD_HASH_KEY);
      if (!storedHash) {
        return { success: false, error: 'Vault not initialized' };
      }

      const salt = base64ToUint8Array(saltBase64);
      const key = await deriveKey(password, salt);
      const keyHash = await sha256(key);
      const computedHash = uint8ArrayToBase64(keyHash);

      if (computedHash !== storedHash) {
        return { success: false, error: 'Incorrect password' };
      }

      const entriesJson = await AsyncStorage.getItem(ENTRIES_KEY);
      const categoriesJson = await AsyncStorage.getItem(CATEGORIES_KEY);

      const entries = entriesJson ? deserializeEntries(entriesJson) : [];
      const categories = categoriesJson ? deserializeCategories(categoriesJson) : [];

      return {
        success: true,
        salt,
        entries,
        categories,
      };
    } catch {
      return { success: false, error: 'Incorrect password' };
    }
  },

  async lock(): Promise<void> {
    await Promise.resolve();
  },

  async saveEntries(entries: Entry[]): Promise<void> {
    await AsyncStorage.setItem(ENTRIES_KEY, serializeEntries(entries));
  },

  async saveCategories(categories: Category[]): Promise<void> {
    await AsyncStorage.setItem(CATEGORIES_KEY, serializeCategories(categories));
  },

  async getEntries(): Promise<Entry[]> {
    const json = await AsyncStorage.getItem(ENTRIES_KEY);
    return json ? deserializeEntries(json) : [];
  },

  async getCategories(): Promise<Category[]> {
    const json = await AsyncStorage.getItem(CATEGORIES_KEY);
    return json ? deserializeCategories(json) : [];
  },

  async getSalt(): Promise<Uint8Array | null> {
    const saltBase64 = await AsyncStorage.getItem(SALT_KEY);
    if (!saltBase64) return null;
    return base64ToUint8Array(saltBase64);
  },

  async enableBiometrics(password: string): Promise<boolean> {
    try {
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);
      if (!saltBase64) return false;

      const salt = base64ToUint8Array(saltBase64);
      const key = await deriveKey(password, salt);

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
        return { success: false, error: 'Biometrics not set up' };
      }

      const authenticated = await biometrics.authenticate();
      if (!authenticated) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      const keychain = new KeychainService();
      const keyBase64 = await keychain.getPassword(BIOMETRIC_KEY_ID);
      if (!keyBase64) {
        return { success: false, error: 'Biometric key not found' };
      }

      const entriesJson = await AsyncStorage.getItem(ENTRIES_KEY);
      const categoriesJson = await AsyncStorage.getItem(CATEGORIES_KEY);
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);

      const entries = entriesJson ? deserializeEntries(entriesJson) : [];
      const categories = categoriesJson ? deserializeCategories(categoriesJson) : [];
      const salt = saltBase64 ? base64ToUint8Array(saltBase64) : null;

      return {
        success: true,
        salt: salt ?? undefined,
        entries,
        categories,
      };
    } catch {
      return { success: false, error: 'Biometric unlock failed' };
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
    await AsyncStorage.removeItem(ENTRIES_KEY);
    await AsyncStorage.removeItem(CATEGORIES_KEY);
    await AsyncStorage.removeItem(SALT_KEY);
    await AsyncStorage.removeItem(PASSWORD_HASH_KEY);
    const keychain = new KeychainService();
    await keychain.deletePassword(BIOMETRIC_KEY_ID);
    await keychain.deleteToken('sync_token');
  },
};
