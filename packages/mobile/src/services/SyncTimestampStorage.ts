import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@onepass:last_sync_timestamp';

export class SyncTimestampStorage {
  async getLastSyncTimestamp(): Promise<Date | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }
    const timestamp = parseInt(value, 10);
    if (isNaN(timestamp)) {
      return null;
    }
    return new Date(timestamp);
  }

  async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, timestamp.getTime().toString());
  }
}
