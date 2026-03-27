interface MockVaultState {
  isUnlocked: boolean;
  isInitialized: boolean;
  entries: unknown[];
  categories: unknown[];
  isLoading: boolean;
  error: string | null;
  salt: Uint8Array | null;
  initialize: () => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  createVault: (password: string) => Promise<boolean>;
  addEntry: (entry: unknown) => Promise<unknown>;
  updateEntry: (id: string, updates: unknown) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => unknown;
  searchEntries: (query: string) => unknown[];
  addCategory: (category: unknown) => Promise<unknown>;
  updateCategory: (id: string, updates: unknown) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => unknown;
  importData: (entries: unknown[], categories: unknown[]) => Promise<void>;
  exportData: () => { entries: unknown[]; categories: unknown[] };
  clearError: () => void;
}

const mockState: MockVaultState = {
  isUnlocked: false,
  isInitialized: false,
  entries: [],
  categories: [],
  isLoading: false,
  error: null,
  salt: null,
  initialize: jest.fn().mockResolvedValue(undefined),
  unlock: jest.fn().mockResolvedValue(false),
  lock: jest.fn().mockResolvedValue(undefined),
  createVault: jest.fn().mockResolvedValue(true),
  addEntry: jest.fn().mockResolvedValue({ id: '1' }),
  updateEntry: jest.fn().mockResolvedValue(undefined),
  deleteEntry: jest.fn().mockResolvedValue(undefined),
  getEntry: jest.fn().mockReturnValue(undefined),
  searchEntries: jest.fn().mockReturnValue([]),
  addCategory: jest.fn().mockResolvedValue({ id: '1' }),
  updateCategory: jest.fn().mockResolvedValue(undefined),
  deleteCategory: jest.fn().mockResolvedValue(undefined),
  getCategory: jest.fn().mockReturnValue(undefined),
  importData: jest.fn().mockResolvedValue(undefined),
  exportData: jest.fn().mockReturnValue({ entries: [], categories: [] }),
  clearError: jest.fn(),
};

export const useVaultStore = jest.fn(() => mockState);

export const create = jest.fn((_initializer: unknown) => {
  return () => mockState;
});
