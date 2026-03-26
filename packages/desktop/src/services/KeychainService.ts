import * as keytar from 'keytar';

const SERVICE_PREFIX = 'com.onepass';

export class KeychainService {
  private getServiceName(key: string): string {
    return `${SERVICE_PREFIX}.${key}`;
  }

  async storePassword(key: string, password: string): Promise<boolean> {
    try {
      await keytar.setPassword(this.getServiceName(key), key, password);
      return true;
    } catch {
      throw new Error('Failed to store password');
    }
  }

  async getPassword(key: string): Promise<string | null> {
    try {
      const result = await keytar.getPassword(this.getServiceName(key), key);
      return result;
    } catch {
      throw new Error('Failed to retrieve password');
    }
  }

  async hasPassword(key: string): Promise<boolean> {
    try {
      const result = await keytar.getPassword(this.getServiceName(key), key);
      return result !== null;
    } catch {
      return false;
    }
  }

  async deletePassword(key: string): Promise<boolean> {
    try {
      const result = await keytar.deletePassword(this.getServiceName(key), key);
      return result;
    } catch {
      throw new Error('Failed to delete password');
    }
  }

  async storeToken(key: string, token: string): Promise<boolean> {
    try {
      await keytar.setPassword(this.getServiceName(key), key, token);
      return true;
    } catch {
      throw new Error('Failed to store token');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const result = await keytar.getPassword(this.getServiceName(key), key);
      return result;
    } catch {
      throw new Error('Failed to retrieve token');
    }
  }

  async hasToken(key: string): Promise<boolean> {
    try {
      const result = await keytar.getPassword(this.getServiceName(key), key);
      return result !== null;
    } catch {
      return false;
    }
  }

  async deleteToken(key: string): Promise<boolean> {
    try {
      const result = await keytar.deletePassword(this.getServiceName(key), key);
      return result;
    } catch {
      throw new Error('Failed to delete token');
    }
  }
}
