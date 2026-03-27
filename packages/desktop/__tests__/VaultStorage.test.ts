import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {VaultStorage} from '../src/services/VaultStorage';
import {KeychainService} from '../src/services/KeychainService';

jest.mock('../src/services/KeychainService');
jest.mock('../src/services/BiometricsService');

describe('VaultStorage', () => {
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

  const getMockVaultDir = () => {
    const testId =
      expect.getState().currentTestName?.replace(/\s+/g, '-') ?? 'test';
    return path.join(os.tmpdir(), 'onepass-test', testId);
  };

  beforeEach(() => {
    mockKeychainStore = {};
    jest.clearAllMocks();

    (KeychainService as jest.Mock).mockImplementation(
      createMockKeychainService,
    );

    const vaultDir = getMockVaultDir();
    if (fs.existsSync(vaultDir)) {
      fs.rmSync(vaultDir, {recursive: true});
    }
    fs.mkdirSync(vaultDir, {recursive: true});

    jest.spyOn(os, 'homedir').mockReturnValue(vaultDir);
  });

  afterEach(() => {
    const vaultDir = getMockVaultDir();
    if (fs.existsSync(vaultDir)) {
      fs.rmSync(vaultDir, {recursive: true});
    }
    jest.restoreAllMocks();
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

    it('stores password hash in keychain', async () => {
      const password = 'test-password';
      await VaultStorage.createVault(password);

      expect(mockKeychainStore.password_hash).toBeDefined();
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

    it('returns stored entries and categories', async () => {
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

      const result = await VaultStorage.unlock(password);
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1);
      expect(result.entries?.[0]?.title).toBe('Test Entry');
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

  describe('clearVault', () => {
    it('removes all vault data', async () => {
      await VaultStorage.createVault('password');

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

      await VaultStorage.clearVault();

      const isInitialized = await VaultStorage.isVaultInitialized();
      expect(isInitialized).toBe(false);

      expect(mockKeychainStore.password_hash).toBeUndefined();
      expect(mockKeychainStore.biometric_key).toBeUndefined();
      expect(mockKeychainStore.sync_token).toBeUndefined();
    });
  });
});
