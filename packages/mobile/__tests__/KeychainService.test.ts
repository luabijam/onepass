import { KeychainService } from '../src/services/KeychainService';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
}));

import * as Keychain from 'react-native-keychain';

describe('KeychainService', () => {
  let keychainService: KeychainService;

  beforeEach(() => {
    jest.clearAllMocks();
    keychainService = new KeychainService();
  });

  describe('storePassword', () => {
    it('stores password securely with service name', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({
        service: 'com.onepass.masterPassword',
        storage: 'encrypted',
      });

      await keychainService.storePassword('masterPassword', 'my-password');

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'masterPassword',
        'my-password',
        expect.objectContaining({
          service: 'com.onepass.masterPassword',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
      );
    });

    it('returns true on successful store', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({
        service: 'com.onepass.masterPassword',
        storage: 'encrypted',
      });

      const result = await keychainService.storePassword('masterPassword', 'my-password');

      expect(result).toBe(true);
    });

    it('returns false on store failure', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.storePassword('masterPassword', 'my-password');

      expect(result).toBe(false);
    });

    it('throws on error', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      await expect(keychainService.storePassword('masterPassword', 'my-password')).rejects.toThrow(
        'Failed to store password'
      );
    });
  });

  describe('getPassword', () => {
    it('retrieves stored password', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'masterPassword',
        password: 'my-password',
        service: 'com.onepass.masterpassword',
        storage: 'encrypted',
      });

      const result = await keychainService.getPassword('masterPassword');

      expect(result).toBe('my-password');
    });

    it('returns null when no password stored', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.getPassword('masterPassword');

      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      await expect(keychainService.getPassword('masterPassword')).rejects.toThrow(
        'Failed to retrieve password'
      );
    });
  });

  describe('hasPassword', () => {
    it('returns true when password exists', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'masterPassword',
        password: 'my-password',
        service: 'com.onepass.masterpassword',
        storage: 'encrypted',
      });

      const result = await keychainService.hasPassword('masterPassword');

      expect(result).toBe(true);
    });

    it('returns false when no password stored', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.hasPassword('masterPassword');

      expect(result).toBe(false);
    });
  });

  describe('deletePassword', () => {
    it('deletes stored password', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await keychainService.deletePassword('masterPassword');

      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.onepass.masterPassword',
      });
      expect(result).toBe(true);
    });

    it('returns false when nothing to delete', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.deletePassword('masterPassword');

      expect(result).toBe(false);
    });

    it('throws on error', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      await expect(keychainService.deletePassword('masterPassword')).rejects.toThrow(
        'Failed to delete password'
      );
    });
  });

  describe('storeToken', () => {
    it('stores sync token with different service name', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({
        service: 'com.onepass.syncToken',
        storage: 'encrypted',
      });

      await keychainService.storeToken('syncToken', 'my-token');

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'syncToken',
        'my-token',
        expect.objectContaining({
          service: 'com.onepass.syncToken',
        })
      );
    });
  });

  describe('getToken', () => {
    it('retrieves stored sync token', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'syncToken',
        password: 'my-token',
        service: 'com.onepass.syncToken',
        storage: 'encrypted',
      });

      const result = await keychainService.getToken('syncToken');

      expect(result).toBe('my-token');
    });
  });
});
