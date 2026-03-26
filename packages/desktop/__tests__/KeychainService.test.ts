import {KeychainService} from '../src/services/KeychainService';

jest.mock('keytar');

import * as keytar from 'keytar';

describe('KeychainService', () => {
  let keychainService: KeychainService;

  beforeEach(() => {
    jest.clearAllMocks();
    keychainService = new KeychainService();
  });

  describe('storePassword', () => {
    it('stores password securely with service name', async () => {
      (keytar.setPassword as jest.Mock).mockResolvedValueOnce(undefined);

      await keychainService.storePassword('masterPassword', 'my-password');

      expect(keytar.setPassword).toHaveBeenCalledWith(
        'com.onepass.masterPassword',
        'masterPassword',
        'my-password',
      );
    });

    it('returns true on successful store', async () => {
      (keytar.setPassword as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await keychainService.storePassword(
        'masterPassword',
        'my-password',
      );

      expect(result).toBe(true);
    });

    it('throws on error', async () => {
      (keytar.setPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(
        keychainService.storePassword('masterPassword', 'my-password'),
      ).rejects.toThrow('Failed to store password');
    });
  });

  describe('getPassword', () => {
    it('retrieves stored password', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce('my-password');

      const result = await keychainService.getPassword('masterPassword');

      expect(result).toBe('my-password');
      expect(keytar.getPassword).toHaveBeenCalledWith(
        'com.onepass.masterPassword',
        'masterPassword',
      );
    });

    it('returns null when no password stored', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce(null);

      const result = await keychainService.getPassword('masterPassword');

      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      (keytar.getPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(
        keychainService.getPassword('masterPassword'),
      ).rejects.toThrow('Failed to retrieve password');
    });
  });

  describe('hasPassword', () => {
    it('returns true when password exists', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce('my-password');

      const result = await keychainService.hasPassword('masterPassword');

      expect(result).toBe(true);
    });

    it('returns false when no password stored', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce(null);

      const result = await keychainService.hasPassword('masterPassword');

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      (keytar.getPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      const result = await keychainService.hasPassword('masterPassword');

      expect(result).toBe(false);
    });
  });

  describe('deletePassword', () => {
    it('deletes stored password', async () => {
      (keytar.deletePassword as jest.Mock).mockResolvedValueOnce(true);

      const result = await keychainService.deletePassword('masterPassword');

      expect(keytar.deletePassword).toHaveBeenCalledWith(
        'com.onepass.masterPassword',
        'masterPassword',
      );
      expect(result).toBe(true);
    });

    it('returns false when nothing to delete', async () => {
      (keytar.deletePassword as jest.Mock).mockResolvedValueOnce(false);

      const result = await keychainService.deletePassword('masterPassword');

      expect(result).toBe(false);
    });

    it('throws on error', async () => {
      (keytar.deletePassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(
        keychainService.deletePassword('masterPassword'),
      ).rejects.toThrow('Failed to delete password');
    });
  });

  describe('storeToken', () => {
    it('stores token with service name', async () => {
      (keytar.setPassword as jest.Mock).mockResolvedValueOnce(undefined);

      await keychainService.storeToken('syncToken', 'my-token');

      expect(keytar.setPassword).toHaveBeenCalledWith(
        'com.onepass.syncToken',
        'syncToken',
        'my-token',
      );
    });

    it('returns true on successful store', async () => {
      (keytar.setPassword as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await keychainService.storeToken('syncToken', 'my-token');

      expect(result).toBe(true);
    });

    it('throws on error', async () => {
      (keytar.setPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(
        keychainService.storeToken('syncToken', 'my-token'),
      ).rejects.toThrow('Failed to store token');
    });
  });

  describe('getToken', () => {
    it('retrieves stored token', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce('my-token');

      const result = await keychainService.getToken('syncToken');

      expect(result).toBe('my-token');
      expect(keytar.getPassword).toHaveBeenCalledWith(
        'com.onepass.syncToken',
        'syncToken',
      );
    });

    it('returns null when no token stored', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce(null);

      const result = await keychainService.getToken('syncToken');

      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      (keytar.getPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(keychainService.getToken('syncToken')).rejects.toThrow(
        'Failed to retrieve token',
      );
    });
  });

  describe('hasToken', () => {
    it('returns true when token exists', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce('my-token');

      const result = await keychainService.hasToken('syncToken');

      expect(result).toBe(true);
    });

    it('returns false when no token stored', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValueOnce(null);

      const result = await keychainService.hasToken('syncToken');

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      (keytar.getPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      const result = await keychainService.hasToken('syncToken');

      expect(result).toBe(false);
    });
  });

  describe('deleteToken', () => {
    it('deletes stored token', async () => {
      (keytar.deletePassword as jest.Mock).mockResolvedValueOnce(true);

      const result = await keychainService.deleteToken('syncToken');

      expect(keytar.deletePassword).toHaveBeenCalledWith(
        'com.onepass.syncToken',
        'syncToken',
      );
      expect(result).toBe(true);
    });

    it('returns false when nothing to delete', async () => {
      (keytar.deletePassword as jest.Mock).mockResolvedValueOnce(false);

      const result = await keychainService.deleteToken('syncToken');

      expect(result).toBe(false);
    });

    it('throws on error', async () => {
      (keytar.deletePassword as jest.Mock).mockRejectedValueOnce(
        new Error('Keychain error'),
      );

      await expect(keychainService.deleteToken('syncToken')).rejects.toThrow(
        'Failed to delete token',
      );
    });
  });
});
