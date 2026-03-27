jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncTimestampStorage } from '../src/services/SyncTimestampStorage';

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

describe('SyncTimestampStorage', () => {
  const STORAGE_KEY = '@onepass:last_sync_timestamp';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLastSyncTimestamp', () => {
    it('returns null when no timestamp has been stored', async () => {
      mockGetItem.mockResolvedValue(null);

      const storage = new SyncTimestampStorage();
      const result = await storage.getLastSyncTimestamp();

      expect(result).toBeNull();
      expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('returns the stored timestamp', async () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z');
      mockGetItem.mockResolvedValue(timestamp.getTime().toString());

      const storage = new SyncTimestampStorage();
      const result = await storage.getLastSyncTimestamp();

      expect(result).toEqual(timestamp);
      expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('handles corrupted data by returning null', async () => {
      mockGetItem.mockResolvedValue('not-a-valid-number');

      const storage = new SyncTimestampStorage();
      const result = await storage.getLastSyncTimestamp();

      expect(result).toBeNull();
    });
  });

  describe('setLastSyncTimestamp', () => {
    it('stores the timestamp as milliseconds', async () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z');

      const storage = new SyncTimestampStorage();
      await storage.setLastSyncTimestamp(timestamp);

      expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, timestamp.getTime().toString());
    });

    it('overwrites previous timestamp', async () => {
      const timestamp1 = new Date('2024-01-15T10:30:00.000Z');
      const timestamp2 = new Date('2024-01-16T14:45:00.000Z');

      const storage = new SyncTimestampStorage();
      await storage.setLastSyncTimestamp(timestamp1);
      await storage.setLastSyncTimestamp(timestamp2);

      expect(mockSetItem).toHaveBeenCalledTimes(2);
      expect(mockSetItem).toHaveBeenLastCalledWith(STORAGE_KEY, timestamp2.getTime().toString());
    });
  });

  describe('round-trip', () => {
    it('stores and retrieves the same timestamp', async () => {
      const timestamp = new Date('2024-01-15T10:30:00.000Z');

      mockGetItem.mockResolvedValue(timestamp.getTime().toString());

      const storage = new SyncTimestampStorage();
      await storage.setLastSyncTimestamp(timestamp);
      const result = await storage.getLastSyncTimestamp();

      expect(result).toEqual(timestamp);
    });
  });
});
