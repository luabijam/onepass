import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);
      return saltBase64 !== null;
    } catch {
      return false;
    }
  },

  async createVault(password: string): Promise<CreateVaultResult> {
    try {
      console.log('[VaultStorage] Starting createVault...');

      console.log('[VaultStorage] Generating salt...');
      const salt = generateSalt();
      console.log('[VaultStorage] Salt generated');

      console.log('[VaultStorage] Deriving key...');
      const key = await deriveKey(password, salt);
      console.log('[VaultStorage] Key derived');

      console.log('[VaultStorage] Computing hash...');
      const keyHash = await sha256(key);
      const passwordHash = uint8ArrayToBase64(keyHash);
      console.log('[VaultStorage] Hash computed');

      const defaultCategories: Category[] = [createDefaultCategory()];

      console.log('[VaultStorage] Saving to AsyncStorage...');
      await Promise.all([
        AsyncStorage.setItem(SALT_KEY, uint8ArrayToBase64(salt)),
        AsyncStorage.setItem(PASSWORD_HASH_KEY, passwordHash),
        AsyncStorage.setItem(
          CATEGORIES_KEY,
          serializeCategories(defaultCategories),
        ),
        AsyncStorage.setItem(ENTRIES_KEY, serializeEntries([])),
      ]);
      console.log('[VaultStorage] All data saved');

      return {success: true, salt: new Uint8Array(salt)};
    } catch (error) {
      console.error('[VaultStorage] createVault error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        '[VaultStorage] Error stack:',
        error instanceof Error ? error.stack : 'N/A',
      );
      return {success: false, error: `Failed to create vault: ${errorMsg}`};
    }
  },

  async unlock(password: string): Promise<UnlockResult> {
    try {
      const [saltBase64, storedHash, entriesJson, categoriesJson] =
        await Promise.all([
          AsyncStorage.getItem(SALT_KEY),
          AsyncStorage.getItem(PASSWORD_HASH_KEY),
          AsyncStorage.getItem(ENTRIES_KEY),
          AsyncStorage.getItem(CATEGORIES_KEY),
        ]);

      if (!saltBase64 || !storedHash) {
        return {success: false, error: 'Vault not initialized'};
      }

      const salt = base64ToUint8Array(saltBase64);
      const key = await deriveKey(password, salt);
      const keyHash = await sha256(key);
      const computedHash = uint8ArrayToBase64(keyHash);

      if (computedHash !== storedHash) {
        return {success: false, error: 'Incorrect password'};
      }

      const entries = entriesJson ? deserializeEntries(entriesJson) : [];
      const categories = categoriesJson
        ? deserializeCategories(categoriesJson)
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
    return json ? deserializeCategories(json) : [createDefaultCategory()];
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

      const entriesJson = await AsyncStorage.getItem(ENTRIES_KEY);
      const categoriesJson = await AsyncStorage.getItem(CATEGORIES_KEY);
      const saltBase64 = await AsyncStorage.getItem(SALT_KEY);

      const entries = entriesJson ? deserializeEntries(entriesJson) : [];
      const categories = categoriesJson
        ? deserializeCategories(categoriesJson)
        : [];
      const salt = saltBase64 ? base64ToUint8Array(saltBase64) : null;

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
    await AsyncStorage.removeItem(ENTRIES_KEY);
    await AsyncStorage.removeItem(CATEGORIES_KEY);
    await AsyncStorage.removeItem(SALT_KEY);
    await AsyncStorage.removeItem(PASSWORD_HASH_KEY);
    const keychain = new KeychainService();
    await keychain.deletePassword(BIOMETRIC_KEY_ID);
    await keychain.deleteToken('sync_token');
  },
};
