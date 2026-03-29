import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_PREFIX = 'com.onepass';

/**
 * KeychainService for React Native macOS
 *
 * Note: This implementation uses AsyncStorage as a temporary storage solution.
 * For production, a native module should be created to access macOS Keychain.
 */
export class KeychainService {
  private getServiceName(key: string): string {
    return `${SERVICE_PREFIX}.${key}`;
  }

  async storePassword(key: string, password: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.getServiceName(key), password);
      return true;
    } catch {
      throw new Error('Failed to store password');
    }
  }

  async getPassword(key: string): Promise<string | null> {
    try {
      const result = await AsyncStorage.getItem(this.getServiceName(key));
      return result;
    } catch {
      throw new Error('Failed to retrieve password');
    }
  }

  async hasPassword(key: string): Promise<boolean> {
    try {
      const result = await AsyncStorage.getItem(this.getServiceName(key));
      return result !== null;
    } catch {
      return false;
    }
  }

  async deletePassword(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.getServiceName(key));
      return true;
    } catch {
      throw new Error('Failed to delete password');
    }
  }

  async storeToken(key: string, token: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.getServiceName(key), token);
      return true;
    } catch {
      throw new Error('Failed to store token');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const result = await AsyncStorage.getItem(this.getServiceName(key));
      return result;
    } catch {
      throw new Error('Failed to retrieve token');
    }
  }

  async hasToken(key: string): Promise<boolean> {
    try {
      const result = await AsyncStorage.getItem(this.getServiceName(key));
      return result !== null;
    } catch {
      return false;
    }
  }

  async deleteToken(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.getServiceName(key));
      return true;
    } catch {
      throw new Error('Failed to delete token');
    }
  }
}
