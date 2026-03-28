const mockState = {
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

export type VaultStore = typeof mockState;
export type VaultState = typeof mockState;
export type VaultActions = typeof mockState;
