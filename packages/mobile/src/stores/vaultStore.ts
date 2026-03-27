import { create } from 'zustand';
import type { Entry, Category } from '@onepass/vault-core';
import {
  createCategory,
  DEFAULT_CATEGORY_ID,
  mergeEntries,
  mergeCategories,
} from '@onepass/vault-core';
import {
  VaultStorage,
  exportVault,
  importVault,
  deriveKeyFromPassword,
  uint8ArrayToBase64,
} from '../services';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface VaultState {
  isUnlocked: boolean;
  isInitialized: boolean;
  entries: Entry[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  salt: Uint8Array | null;
}

export interface VaultActions {
  initialize: () => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  createVault: (password: string) => Promise<boolean>;
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => Entry | undefined;
  searchEntries: (query: string) => Entry[];
  addCategory: (category: Omit<Category, 'id' | 'updatedAt' | 'deletedAt'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  importData: (entries: Entry[], categories: Category[]) => Promise<void>;
  exportData: () => { entries: Entry[]; categories: Category[] };
  exportVault: (password: string) => Promise<string>;
  importVault: (fileContent: string, password: string) => Promise<void>;
  clearError: () => void;
}

export type VaultStore = VaultState & VaultActions;

export const useVaultStore = create<VaultStore>((set, get) => ({
  isUnlocked: false,
  isInitialized: false,
  entries: [],
  categories: [],
  isLoading: false,
  error: null,
  salt: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const isInitialized = await VaultStorage.isVaultInitialized();
      set({ isInitialized, isLoading: false });
    } catch {
      set({ error: 'Failed to initialize vault', isLoading: false });
    }
  },

  unlock: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await VaultStorage.unlock(password);
      if (result.success && result.salt && result.entries && result.categories) {
        set({
          isUnlocked: true,
          salt: result.salt,
          entries: result.entries,
          categories: result.categories,
          isLoading: false,
        });
        return true;
      }
      set({ error: result.error || 'Failed to unlock vault', isLoading: false });
      return false;
    } catch {
      set({ error: 'Failed to unlock vault', isLoading: false });
      return false;
    }
  },

  lock: async () => {
    set({ isLoading: true, error: null });
    try {
      await VaultStorage.lock();
      set({
        isUnlocked: false,
        entries: [],
        categories: [],
        salt: null,
        isLoading: false,
      });
    } catch {
      set({ error: 'Failed to lock vault', isLoading: false });
    }
  },

  createVault: async (password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await VaultStorage.createVault(password);
      if (result.success && result.salt) {
        const defaultCategory = createCategory(
          DEFAULT_CATEGORY_ID,
          'Uncategorized',
          '\u{1F4C1}',
          '#8E8E93'
        );
        set({
          isUnlocked: true,
          isInitialized: true,
          salt: result.salt,
          entries: [],
          categories: [defaultCategory],
          isLoading: false,
        });
        return true;
      }
      set({ error: result.error || 'Failed to create vault', isLoading: false });
      return false;
    } catch {
      set({ error: 'Failed to create vault', isLoading: false });
      return false;
    }
  },

  addEntry: async (entryData: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => {
    const { entries } = get();
    const id = generateId();
    const now = new Date();
    const categoryId = entryData.categoryId || DEFAULT_CATEGORY_ID;

    const entry: Entry = {
      ...entryData,
      id,
      categoryId,
      isFavorite: entryData.isFavorite ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const updatedEntries = [...entries, entry];
    set({ entries: updatedEntries });

    try {
      await VaultStorage.saveEntries(updatedEntries);
    } catch {
      set({ entries, error: 'Failed to save entry' });
      throw new Error('Failed to save entry');
    }

    return entry;
  },

  updateEntry: async (id: string, updates: Partial<Entry>) => {
    const { entries } = get();
    const index = entries.findIndex((e: Entry) => e.id === id);
    if (index === -1) return;

    const updatedEntry: Entry = {
      ...entries[index]!,
      ...updates,
      updatedAt: new Date(),
    };

    const updatedEntries = [...entries];
    updatedEntries[index] = updatedEntry;
    set({ entries: updatedEntries });

    try {
      await VaultStorage.saveEntries(updatedEntries);
    } catch {
      set({ entries, error: 'Failed to update entry' });
      throw new Error('Failed to update entry');
    }
  },

  deleteEntry: async (id: string) => {
    const { entries } = get();
    const updatedEntries = entries.map((entry: Entry) =>
      entry.id === id ? { ...entry, deletedAt: new Date(), updatedAt: new Date() } : entry
    );
    set({ entries: updatedEntries });

    try {
      await VaultStorage.saveEntries(updatedEntries);
    } catch {
      set({ entries, error: 'Failed to delete entry' });
      throw new Error('Failed to delete entry');
    }
  },

  getEntry: (id: string) => {
    return get().entries.find((e: Entry) => e.id === id);
  },

  searchEntries: (query: string) => {
    const { entries } = get();
    const lowerQuery = query.toLowerCase();
    return entries.filter(
      (entry: Entry) =>
        !entry.deletedAt &&
        (entry.title.toLowerCase().includes(lowerQuery) ||
          entry.username.toLowerCase().includes(lowerQuery) ||
          (entry.url?.toLowerCase().includes(lowerQuery) ?? false))
    );
  },

  addCategory: async (categoryData: Omit<Category, 'id' | 'updatedAt' | 'deletedAt'>) => {
    const { categories } = get();
    const id = generateId();
    const category: Category = {
      ...categoryData,
      id,
      updatedAt: new Date(),
    };

    const updatedCategories = [...categories, category];
    set({ categories: updatedCategories });

    try {
      await VaultStorage.saveCategories(updatedCategories);
    } catch {
      set({ categories, error: 'Failed to save category' });
      throw new Error('Failed to save category');
    }

    return category;
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const { categories } = get();
    const index = categories.findIndex((c: Category) => c.id === id);
    if (index === -1) return;

    const updatedCategory: Category = {
      ...categories[index]!,
      ...updates,
      updatedAt: new Date(),
    };

    const updatedCategories = [...categories];
    updatedCategories[index] = updatedCategory;
    set({ categories: updatedCategories });

    try {
      await VaultStorage.saveCategories(updatedCategories);
    } catch {
      set({ categories, error: 'Failed to update category' });
      throw new Error('Failed to update category');
    }
  },

  deleteCategory: async (id: string) => {
    const { categories, entries } = get();
    if (id === DEFAULT_CATEGORY_ID) return;

    const updatedCategories = categories.map((cat: Category) =>
      cat.id === id ? { ...cat, deletedAt: new Date(), updatedAt: new Date() } : cat
    );

    const updatedEntries = entries.map((entry: Entry) =>
      entry.categoryId === id
        ? { ...entry, categoryId: DEFAULT_CATEGORY_ID, updatedAt: new Date() }
        : entry
    );

    set({ categories: updatedCategories, entries: updatedEntries });

    try {
      await VaultStorage.saveCategories(updatedCategories);
      await VaultStorage.saveEntries(updatedEntries);
    } catch {
      set({ categories, entries, error: 'Failed to delete category' });
      throw new Error('Failed to delete category');
    }
  },

  getCategory: (id: string) => {
    return get().categories.find((c: Category) => c.id === id);
  },

  importData: async (importedEntries: Entry[], importedCategories: Category[]) => {
    const { entries, categories } = get();

    const mergeResultEntries = mergeEntries(
      new Map(entries.map((e: Entry) => [e.id, e])),
      importedEntries
    );
    const mergeResultCategories = mergeCategories(
      new Map(categories.map((c: Category) => [c.id, c])),
      importedCategories
    );

    const mergedEntries = Array.from(mergeResultEntries.entries.values());
    const mergedCategories = Array.from(mergeResultCategories.categories.values());

    set({ entries: mergedEntries, categories: mergedCategories });

    try {
      await VaultStorage.saveEntries(mergedEntries);
      await VaultStorage.saveCategories(mergedCategories);
    } catch {
      set({ entries, categories, error: 'Failed to import data' });
      throw new Error('Failed to import data');
    }
  },

  exportData: () => {
    const { entries, categories } = get();
    return {
      entries: entries.filter((e: Entry) => !e.deletedAt),
      categories: categories.filter((c: Category) => !c.deletedAt),
    };
  },

  exportVault: async (password: string) => {
    const { entries, categories, salt } = get();
    if (!salt) {
      throw new Error('Vault not unlocked');
    }

    const key = await deriveKeyFromPassword(password, uint8ArrayToBase64(salt));

    return exportVault(entries, categories, key, salt);
  },

  importVault: async (fileContent: string, password: string) => {
    const result = await importVault(fileContent, password);

    await get().importData(result.entries, result.categories);
  },

  clearError: () => {
    set({ error: null });
  },
}));
