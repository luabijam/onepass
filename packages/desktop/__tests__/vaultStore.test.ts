import {act} from '@testing-library/react-native';
import {useVaultStore} from '../src/stores/vaultStore';
import {VaultStorage} from '../src/services/VaultStorage';
import type {Entry, Category} from '@onepass/vault-core';

jest.mock('../src/services/VaultStorage');
jest.mock('../src/services/VaultExport', () => ({
  exportVault: jest.fn(),
  importVault: jest.fn(),
  deriveKeyFromPassword: jest.fn(),
  uint8ArrayToBase64: jest.fn(),
}));

const mockEntry: Entry = {
  id: 'entry-1',
  title: 'Test Entry',
  username: 'testuser',
  password: 'testpass',
  url: 'https://example.com',
  categoryId: 'uncategorized',
  isFavorite: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Personal',
  icon: '📁',
  color: '#FF0000',
  updatedAt: new Date('2024-01-01'),
};

describe('useVaultStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVaultStore.setState({
      isUnlocked: false,
      isInitialized: false,
      entries: [],
      categories: [],
      isLoading: false,
      error: null,
      salt: null,
    });
  });

  describe('initialize', () => {
    it('sets isInitialized to true when vault exists', async () => {
      (VaultStorage.isVaultInitialized as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await useVaultStore.getState().initialize();
      });

      expect(useVaultStore.getState().isInitialized).toBe(true);
    });

    it('sets isInitialized to false when vault does not exist', async () => {
      (VaultStorage.isVaultInitialized as jest.Mock).mockResolvedValue(false);

      await act(async () => {
        await useVaultStore.getState().initialize();
      });

      expect(useVaultStore.getState().isInitialized).toBe(false);
    });

    it('sets error when initialization fails', async () => {
      (VaultStorage.isVaultInitialized as jest.Mock).mockRejectedValue(
        new Error('Failed'),
      );

      await act(async () => {
        await useVaultStore.getState().initialize();
      });

      expect(useVaultStore.getState().error).toBe('Failed to initialize vault');
    });
  });

  describe('createVault', () => {
    it('creates vault successfully', async () => {
      const mockSalt = new Uint8Array(16);
      (VaultStorage.createVault as jest.Mock).mockResolvedValue({
        success: true,
        salt: mockSalt,
      });

      const result = await act(async () => {
        return useVaultStore.getState().createVault('password');
      });

      expect(result).toBe(true);
      expect(useVaultStore.getState().isUnlocked).toBe(true);
      expect(useVaultStore.getState().isInitialized).toBe(true);
      expect(useVaultStore.getState().salt).toEqual(mockSalt);
    });

    it('sets error when creation fails', async () => {
      (VaultStorage.createVault as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Creation failed',
      });

      await act(async () => {
        await useVaultStore.getState().createVault('password');
      });

      expect(useVaultStore.getState().error).toBe('Creation failed');
      expect(useVaultStore.getState().isUnlocked).toBe(false);
    });
  });

  describe('unlock', () => {
    it('unlocks vault successfully', async () => {
      const mockSalt = new Uint8Array(16);
      (VaultStorage.unlock as jest.Mock).mockResolvedValue({
        success: true,
        salt: mockSalt,
        entries: [mockEntry],
        categories: [mockCategory],
      });

      const result = await act(async () => {
        return useVaultStore.getState().unlock('password');
      });

      expect(result).toBe(true);
      expect(useVaultStore.getState().isUnlocked).toBe(true);
      expect(useVaultStore.getState().entries).toHaveLength(1);
      expect(useVaultStore.getState().categories).toHaveLength(1);
    });

    it('sets error when unlock fails', async () => {
      (VaultStorage.unlock as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Incorrect password',
      });

      await act(async () => {
        await useVaultStore.getState().unlock('wrong');
      });

      expect(useVaultStore.getState().error).toBe('Incorrect password');
      expect(useVaultStore.getState().isUnlocked).toBe(false);
    });
  });

  describe('lock', () => {
    it('clears vault state on lock', async () => {
      useVaultStore.setState({
        isUnlocked: true,
        entries: [mockEntry],
        categories: [mockCategory],
        salt: new Uint8Array(16),
      });

      await act(async () => {
        await useVaultStore.getState().lock();
      });

      expect(useVaultStore.getState().isUnlocked).toBe(false);
      expect(useVaultStore.getState().entries).toHaveLength(0);
      expect(useVaultStore.getState().categories).toHaveLength(0);
      expect(useVaultStore.getState().salt).toBeNull();
    });
  });

  describe('addEntry', () => {
    it('adds entry and saves to storage', async () => {
      useVaultStore.setState({isUnlocked: true, entries: []});
      (VaultStorage.saveEntries as jest.Mock).mockResolvedValue(undefined);

      const entry = await act(async () => {
        return useVaultStore.getState().addEntry({
          title: 'New Entry',
          username: 'user',
          password: 'pass',
          categoryId: 'uncategorized',
          isFavorite: false,
        });
      });

      expect(entry.id).toBeDefined();
      expect(entry.title).toBe('New Entry');
      expect(useVaultStore.getState().entries).toHaveLength(1);
      expect(VaultStorage.saveEntries).toHaveBeenCalled();
    });

    it('sets error when save fails', async () => {
      useVaultStore.setState({isUnlocked: true, entries: []});
      (VaultStorage.saveEntries as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        act(async () => {
          await useVaultStore.getState().addEntry({
            title: 'New Entry',
            username: 'user',
            password: 'pass',
            categoryId: 'uncategorized',
            isFavorite: false,
          });
        }),
      ).rejects.toThrow('Failed to save entry');
    });
  });

  describe('updateEntry', () => {
    it('updates entry and saves', async () => {
      useVaultStore.setState({isUnlocked: true, entries: [mockEntry]});
      (VaultStorage.saveEntries as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore
          .getState()
          .updateEntry('entry-1', {title: 'Updated'});
      });

      const entry = useVaultStore.getState().entries[0];
      expect(entry?.title).toBe('Updated');
      expect(entry?.updatedAt).not.toEqual(mockEntry.updatedAt);
    });
  });

  describe('deleteEntry', () => {
    it('soft deletes entry', async () => {
      useVaultStore.setState({isUnlocked: true, entries: [mockEntry]});
      (VaultStorage.saveEntries as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore.getState().deleteEntry('entry-1');
      });

      const entry = useVaultStore.getState().entries[0];
      expect(entry?.deletedAt).toBeDefined();
    });
  });

  describe('getEntry', () => {
    it('returns entry by id', () => {
      useVaultStore.setState({entries: [mockEntry]});

      const entry = useVaultStore.getState().getEntry('entry-1');
      expect(entry).toEqual(mockEntry);
    });

    it('returns undefined for unknown id', () => {
      useVaultStore.setState({entries: [mockEntry]});

      const entry = useVaultStore.getState().getEntry('unknown');
      expect(entry).toBeUndefined();
    });
  });

  describe('searchEntries', () => {
    it('filters entries by query', () => {
      useVaultStore.setState({entries: [mockEntry]});

      const results = useVaultStore.getState().searchEntries('Test');
      expect(results).toHaveLength(1);

      const noResults = useVaultStore.getState().searchEntries('Nonexistent');
      expect(noResults).toHaveLength(0);
    });

    it('excludes deleted entries', () => {
      useVaultStore.setState({
        entries: [{...mockEntry, deletedAt: new Date()}],
      });

      const results = useVaultStore.getState().searchEntries('Test');
      expect(results).toHaveLength(0);
    });
  });

  describe('addCategory', () => {
    it('adds category and saves', async () => {
      useVaultStore.setState({isUnlocked: true, categories: []});
      (VaultStorage.saveCategories as jest.Mock).mockResolvedValue(undefined);

      const category = await act(async () => {
        return useVaultStore.getState().addCategory({
          name: 'Personal',
          icon: '📁',
          color: '#FF0000',
        });
      });

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Personal');
      expect(useVaultStore.getState().categories).toHaveLength(1);
    });
  });

  describe('updateCategory', () => {
    it('updates category and saves', async () => {
      useVaultStore.setState({isUnlocked: true, categories: [mockCategory]});
      (VaultStorage.saveCategories as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore
          .getState()
          .updateCategory('cat-1', {name: 'Updated'});
      });

      const category = useVaultStore.getState().categories[0];
      expect(category?.name).toBe('Updated');
    });
  });

  describe('deleteCategory', () => {
    it('soft deletes category and moves entries to uncategorized', async () => {
      const entryInCategory = {...mockEntry, categoryId: 'cat-1'};
      useVaultStore.setState({
        isUnlocked: true,
        entries: [entryInCategory],
        categories: [mockCategory],
      });
      (VaultStorage.saveCategories as jest.Mock).mockResolvedValue(undefined);
      (VaultStorage.saveEntries as jest.Mock).mockResolvedValue(undefined);

      await act(async () => {
        await useVaultStore.getState().deleteCategory('cat-1');
      });

      const category = useVaultStore.getState().categories[0];
      expect(category?.deletedAt).toBeDefined();

      const entry = useVaultStore.getState().entries[0];
      expect(entry?.categoryId).toBe('uncategorized');
    });

    it('does not delete default category', async () => {
      useVaultStore.setState({
        isUnlocked: true,
        categories: [{...mockCategory, id: 'uncategorized'}],
      });

      await act(async () => {
        await useVaultStore.getState().deleteCategory('uncategorized');
      });

      expect(VaultStorage.saveCategories).not.toHaveBeenCalled();
    });
  });

  describe('exportData', () => {
    it('returns entries and categories excluding deleted', () => {
      useVaultStore.setState({
        entries: [
          mockEntry,
          {...mockEntry, id: 'entry-2', deletedAt: new Date()},
        ],
        categories: [
          mockCategory,
          {...mockCategory, id: 'cat-2', deletedAt: new Date()},
        ],
      });

      const data = useVaultStore.getState().exportData();
      expect(data.entries).toHaveLength(1);
      expect(data.categories).toHaveLength(1);
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      useVaultStore.setState({error: 'Some error'});

      act(() => {
        useVaultStore.getState().clearError();
      });

      expect(useVaultStore.getState().error).toBeNull();
    });
  });
});
