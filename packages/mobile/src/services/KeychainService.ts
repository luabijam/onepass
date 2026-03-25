import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'com.onepass';

export class KeychainService {
  private getServiceName(key: string): string {
    return `${SERVICE_PREFIX}.${key}`;
  }

  async storePassword(key: string, password: string): Promise<boolean> {
    try {
      const result = await Keychain.setGenericPassword(key, password, {
        service: this.getServiceName(key),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return result !== false;
    } catch {
      throw new Error('Failed to store password');
    }
  }

  async getPassword(key: string): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({
        service: this.getServiceName(key),
      });
      if (result && result.password) {
        return result.password;
      }
      return null;
    } catch {
      throw new Error('Failed to retrieve password');
    }
  }

  async hasPassword(key: string): Promise<boolean> {
    try {
      const result = await Keychain.getGenericPassword({
        service: this.getServiceName(key),
      });
      return result !== false;
    } catch {
      return false;
    }
  }

  async deletePassword(key: string): Promise<boolean> {
    try {
      const result = await Keychain.resetGenericPassword({
        service: this.getServiceName(key),
      });
      return result;
    } catch {
      throw new Error('Failed to delete password');
    }
  }

  async storeToken(key: string, token: string): Promise<boolean> {
    try {
      const result = await Keychain.setGenericPassword(key, token, {
        service: this.getServiceName(key),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return result !== false;
    } catch {
      throw new Error('Failed to store token');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({
        service: this.getServiceName(key),
      });
      if (result && result.password) {
        return result.password;
      }
      return null;
    } catch {
      throw new Error('Failed to retrieve token');
    }
  }

  async hasToken(key: string): Promise<boolean> {
    try {
      const result = await Keychain.getGenericPassword({
        service: this.getServiceName(key),
      });
      return result !== false;
    } catch {
      return false;
    }
  }

  async deleteToken(key: string): Promise<boolean> {
    try {
      const result = await Keychain.resetGenericPassword({
        service: this.getServiceName(key),
      });
      return result;
    } catch {
      throw new Error('Failed to delete token');
    }
  }
}
