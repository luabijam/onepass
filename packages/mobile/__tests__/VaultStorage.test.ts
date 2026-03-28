import { VaultStorage } from '../src/services/VaultStorage';
import { KeychainService } from '../src/services/KeychainService';
import { BiometricsService } from '../src/services/BiometricsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../src/services/RnCrypto', () => {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function mockUint8ArrayToBase64(bytes: Uint8Array): string {
    let result = '';
    const len = bytes.length;
    for (let i = 0; i < len; i += 3) {
      const b0 = bytes[i] ?? 0;
      const b1 = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
      const b2 = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;
      const triplet = (b0 << 16) | (b1 << 8) | b2;
      result += CHARS[(triplet >> 18) & 63];
      result += CHARS[(triplet >> 12) & 63];
      result += i + 1 < len ? CHARS[(triplet >> 6) & 63] : '=';
      result += i + 2 < len ? CHARS[triplet & 63] : '=';
    }
    return result;
  }

  function mockBase64ToUint8Array(base64: string): Uint8Array {
    const padding = (base64.match(/[=]/g) || []).length;
    const len = base64.length;
    const byteLen = Math.floor((len * 3) / 4) - padding;
    const bytes = new Uint8Array(byteLen);
    let bytePos = 0;
    for (let i = 0; i < len; i += 4) {
      const c0 = CHARS.indexOf(base64[i] ?? 'A');
      const c1 = CHARS.indexOf(base64[i + 1] ?? 'A');
      const c2 = base64[i + 2] === '=' ? 0 : CHARS.indexOf(base64[i + 2] ?? 'A');
      const c3 = base64[i + 3] === '=' ? 0 : CHARS.indexOf(base64[i + 3] ?? 'A');
      bytes[bytePos++] = (c0 << 2) | (c1 >> 4);
      if (bytePos < bytes.length && base64[i + 2] !== '=') {
        bytes[bytePos++] = ((c1 & 15) << 4) | (c2 >> 2);
      }
      if (bytePos < bytes.length && base64[i + 3] !== '=') {
        bytes[bytePos++] = ((c2 & 3) << 6) | c3;
      }
    }
    return bytes;
  }

  function simpleHash(data: Uint8Array): Uint8Array {
    const hash = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      hash[i % 32] ^= data[i]!;
    }
    return hash;
  }

  return {
    generateSalt: jest.fn().mockImplementation(() => new Uint8Array(16).fill(1)),
    deriveKey: jest.fn().mockImplementation(async (password: string, _salt: Uint8Array) => {
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const key = new Uint8Array(32);
      for (let i = 0; i < passwordBytes.length; i++) {
        key[i % 32] ^= passwordBytes[i]!;
      }
      return key;
    }),
    sha256: jest.fn().mockImplementation(async (data: Uint8Array) => {
      return simpleHash(data);
    }),
    uint8ArrayToBase64: jest
      .fn()
      .mockImplementation((bytes: Uint8Array) => mockUint8ArrayToBase64(bytes)),
    base64ToUint8Array: jest
      .fn()
      .mockImplementation((base64: string) => mockBase64ToUint8Array(base64)),
  };
});

jest.mock('../src/services/KeychainService');
jest.mock('../src/services/BiometricsService');

describe('VaultStorage', () => {
  let mockStorage: Record<string, string> = {};
  let mockKeychainStore: Record<string, string> = {};

  const createMockKeychainService = () => ({
    storePassword: jest.fn((key: string, value: string) => {
      mockKeychainStore[key] = value;
      return Promise.resolve(true);
    }),
    getPassword: jest.fn((key: string) => {
      return Promise.resolve(mockKeychainStore[key] ?? null);
    }),
    hasPassword: jest.fn((key: string) => {
      return Promise.resolve(key in mockKeychainStore);
    }),
    deletePassword: jest.fn((key: string) => {
      delete mockKeychainStore[key];
      return Promise.resolve(true);
    }),
    storeToken: jest.fn((key: string, value: string) => {
      mockKeychainStore[key] = value;
      return Promise.resolve(true);
    }),
    getToken: jest.fn((key: string) => {
      return Promise.resolve(mockKeychainStore[key] ?? null);
    }),
    hasToken: jest.fn((key: string) => {
      return Promise.resolve(key in mockKeychainStore);
    }),
    deleteToken: jest.fn((key: string) => {
      delete mockKeychainStore[key];
      return Promise.resolve(true);
    }),
  });

  const createMockBiometricsService = () => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    getBiometryType: jest.fn().mockResolvedValue('fingerprint'),
    authenticate: jest.fn().mockResolvedValue(true),
    hasBiometricKey: jest.fn().mockResolvedValue(true),
    createBiometricKey: jest.fn().mockResolvedValue('public-key-base64'),
    deleteBiometricKey: jest.fn().mockResolvedValue(true),
    createSignature: jest.fn().mockResolvedValue('signature-base64'),
  });

  beforeEach(() => {
    mockStorage = {};
    mockKeychainStore = {};

    jest.clearAllMocks();

    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(mockStorage[key] ?? null);
    });

    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    });

    (KeychainService as jest.Mock).mockImplementation(createMockKeychainService);
    (BiometricsService as jest.Mock).mockImplementation(createMockBiometricsService);
  });

  describe('isVaultInitialized', () => {
    it('returns false when vault not initialized', async () => {
      const result = await VaultStorage.isVaultInitialized();
      expect(result).toBe(false);
    });

    it('returns true when vault is initialized', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      const result = await VaultStorage.isVaultInitialized();
      expect(result).toBe(true);
    });
  });

  describe('createVault', () => {
    it('creates a new vault successfully', async () => {
      const password = 'test-password';
      const result = await VaultStorage.createVault(password);

      expect(result.success).toBe(true);
      expect(result.salt).toBeDefined();
      expect(result.salt?.length).toBe(16);
    });

    it('stores salt in async storage', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      expect(mockStorage['@onepass/salt']).toBeDefined();
    });

    it('creates default uncategorized category', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const categories = await VaultStorage.getCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0]?.id).toBe('uncategorized');
      expect(categories[0]?.name).toBe('Uncategorized');
    });

    it('creates empty entries list', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const entries = await VaultStorage.getEntries();
      expect(entries).toHaveLength(0);
    });
  });

  describe('unlock', () => {
    it('fails when vault not initialized', async () => {
      const result = await VaultStorage.unlock('password');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Vault not initialized');
    });

    it('fails with incorrect password', async () => {
      const password = 'correct-password';
      await VaultStorage.createVault(password);

      const result = await VaultStorage.unlock('wrong-password');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Incorrect password');
    });

    it('succeeds with correct password', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const result = await VaultStorage.unlock(password);
      expect(result.success).toBe(true);
      expect(result.salt).toBeDefined();
      expect(result.entries).toEqual([]);
      expect(result.categories).toHaveLength(1);
    });
  });

  describe('enableBiometrics', () => {
    it('returns false when vault not initialized', async () => {
      const result = await VaultStorage.enableBiometrics('password');
      expect(result).toBe(false);
    });

    it('creates biometric key if not exists', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockResolvedValueOnce(false);
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      const result = await VaultStorage.enableBiometrics(password);

      expect(result).toBe(true);
      expect(mockBiometrics.createBiometricKey).toHaveBeenCalled();
    });

    it('does not create biometric key if already exists', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockResolvedValueOnce(true);
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      const result = await VaultStorage.enableBiometrics(password);

      expect(result).toBe(true);
      expect(mockBiometrics.createBiometricKey).not.toHaveBeenCalled();
    });

    it('stores derived key in keychain', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const result = await VaultStorage.enableBiometrics(password);

      expect(result).toBe(true);
      expect(mockKeychainStore.biometric_key).toBeDefined();
    });

    it('returns false on error', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockRejectedValue(new Error('Biometric error'));
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      const result = await VaultStorage.enableBiometrics(password);

      expect(result).toBe(false);
    });
  });

  describe('unlockWithBiometrics', () => {
    it('fails when biometrics not set up', async () => {
      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockResolvedValueOnce(false);
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      const result = await VaultStorage.unlockWithBiometrics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometrics not set up');
    });

    it('fails when authentication is cancelled', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockResolvedValueOnce(true);
      mockBiometrics.authenticate.mockResolvedValueOnce(false);
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      const result = await VaultStorage.unlockWithBiometrics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication failed');
    });

    it('fails when biometric key not found in keychain', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      const mockBiometrics = createMockBiometricsService();
      mockBiometrics.hasBiometricKey.mockResolvedValueOnce(true);
      mockBiometrics.authenticate.mockResolvedValueOnce(true);
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      mockKeychainStore = {};

      const result = await VaultStorage.unlockWithBiometrics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric key not found');
    });

    it('succeeds with valid biometric authentication', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await VaultStorage.saveEntries([entry]);

      await VaultStorage.enableBiometrics(password);

      const result = await VaultStorage.unlockWithBiometrics();

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1);
      expect(result.entries?.[0]?.title).toBe('Test Entry');
      expect(result.categories).toHaveLength(1);
    });

    it('prompts for biometric authentication with correct message', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      const mockBiometrics = createMockBiometricsService();
      (BiometricsService as jest.Mock).mockImplementation(() => mockBiometrics);

      await VaultStorage.unlockWithBiometrics();

      expect(mockBiometrics.authenticate).toHaveBeenCalledWith();
    });

    it('returns empty entries and categories for new vault', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      const result = await VaultStorage.unlockWithBiometrics();

      expect(result.success).toBe(true);
      expect(result.entries).toEqual([]);
      expect(result.categories).toHaveLength(1);
    });
  });

  describe('isBiometricsEnabled', () => {
    it('returns false when biometric key not stored', async () => {
      const result = await VaultStorage.isBiometricsEnabled();
      expect(result).toBe(false);
    });

    it('returns true when biometric key is stored', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      const result = await VaultStorage.isBiometricsEnabled();
      expect(result).toBe(true);
    });
  });

  describe('disableBiometrics', () => {
    it('removes biometric key from keychain', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);
      await VaultStorage.enableBiometrics(password);

      expect(mockKeychainStore.biometric_key).toBeDefined();

      await VaultStorage.disableBiometrics();

      expect(mockKeychainStore.biometric_key).toBeUndefined();
    });

    it('does not throw when no biometric key exists', async () => {
      await expect(VaultStorage.disableBiometrics()).resolves.not.toThrow();
    });
  });

  describe('clearVault', () => {
    it('removes all vault data', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      const entry = {
        id: 'test-entry',
        title: 'Test',
        username: 'user',
        password: 'pass',
        categoryId: 'uncategorized',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await VaultStorage.saveEntries([entry]);
      await VaultStorage.enableBiometrics(password);

      await VaultStorage.clearVault();

      const isInitialized = await VaultStorage.isVaultInitialized();
      expect(isInitialized).toBe(false);

      expect(mockKeychainStore.biometric_key).toBeUndefined();
      expect(mockKeychainStore.sync_token).toBeUndefined();
    });
  });

  describe('saveEntries and getEntries', () => {
    it('saves and retrieves entries', async () => {
      const entries = [
        {
          id: 'entry-1',
          title: 'Test',
          username: 'user',
          password: 'pass',
          categoryId: 'uncategorized',
          isFavorite: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      await VaultStorage.saveEntries(entries);
      const retrieved = await VaultStorage.getEntries();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]?.id).toBe('entry-1');
      expect(retrieved[0]?.title).toBe('Test');
    });
  });

  describe('saveCategories and getCategories', () => {
    it('saves and retrieves categories', async () => {
      const categories = [
        {
          id: 'cat-1',
          name: 'Personal',
          icon: '📁',
          color: '#FF0000',
          updatedAt: new Date('2024-01-01'),
        },
      ];

      await VaultStorage.saveCategories(categories);
      const retrieved = await VaultStorage.getCategories();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]?.id).toBe('cat-1');
      expect(retrieved[0]?.name).toBe('Personal');
    });
  });

  describe('getSalt', () => {
    it('returns salt after vault creation', async () => {
      await VaultStorage.createVault('password');
      const salt = await VaultStorage.getSalt();
      expect(salt).toBeDefined();
      expect(salt?.length).toBe(16);
    });
  });
});
