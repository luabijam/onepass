import {BiometricsService} from '../src/services/BiometricsService';

jest.mock('react-native', () => ({
  NativeModules: {
    BiometricsModule: {
      canAuthenticate: jest.fn(),
      authenticate: jest.fn(),
      getBiometryType: jest.fn(),
    },
  },
  Platform: {
    OS: 'macos',
    select: jest.fn((obj: Record<string, unknown>) => obj.macos),
  },
}));

import {NativeModules} from 'react-native';

const mockCanAuthenticate = NativeModules.BiometricsModule
  .canAuthenticate as jest.Mock;
const mockAuthenticate = NativeModules.BiometricsModule
  .authenticate as jest.Mock;
const mockGetBiometryType = NativeModules.BiometricsModule
  .getBiometryType as jest.Mock;

describe('BiometricsService', () => {
  let biometricsService: BiometricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    biometricsService = new BiometricsService();
  });

  describe('isAvailable', () => {
    it('returns true when biometric sensor is available', async () => {
      mockCanAuthenticate.mockResolvedValue(true);

      const result = await biometricsService.isAvailable();

      expect(result).toBe(true);
      expect(mockCanAuthenticate).toHaveBeenCalled();
    });

    it('returns false when biometric sensor is not available', async () => {
      mockCanAuthenticate.mockResolvedValue(false);

      const result = await biometricsService.isAvailable();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockCanAuthenticate.mockRejectedValue(new Error('Sensor check failed'));

      const result = await biometricsService.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getBiometryType', () => {
    it('returns fingerprint for Touch ID', async () => {
      mockGetBiometryType.mockResolvedValue('TouchID');

      const result = await biometricsService.getBiometryType();

      expect(result).toBe('fingerprint');
    });

    it('returns face for Face ID', async () => {
      mockGetBiometryType.mockResolvedValue('FaceID');

      const result = await biometricsService.getBiometryType();

      expect(result).toBe('face');
    });

    it('returns null when biometrics not available', async () => {
      mockGetBiometryType.mockResolvedValue(null);

      const result = await biometricsService.getBiometryType();

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockGetBiometryType.mockRejectedValue(new Error('Failed to get type'));

      const result = await biometricsService.getBiometryType();

      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('returns true when authentication succeeds', async () => {
      mockAuthenticate.mockResolvedValue(true);

      const result = await biometricsService.authenticate();

      expect(result).toBe(true);
      expect(mockAuthenticate).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to unlock OnePass',
        cancelButtonText: 'Use Password',
      });
    });

    it('returns true with custom prompt message', async () => {
      mockAuthenticate.mockResolvedValue(true);

      const result = await biometricsService.authenticate('Custom message');

      expect(result).toBe(true);
      expect(mockAuthenticate).toHaveBeenCalledWith({
        promptMessage: 'Custom message',
        cancelButtonText: 'Use Password',
      });
    });

    it('returns false when user cancels', async () => {
      mockAuthenticate.mockResolvedValue(false);

      const result = await biometricsService.authenticate();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Authentication failed'));

      const result = await biometricsService.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('hasBiometricKey', () => {
    it('returns false on macOS (keychain-based approach)', async () => {
      const result = await biometricsService.hasBiometricKey();

      expect(result).toBe(false);
    });
  });

  describe('createBiometricKey', () => {
    it('throws error on macOS (keychain-based approach)', async () => {
      await expect(biometricsService.createBiometricKey()).rejects.toThrow(
        'Biometric key management not supported on macOS. Use keychain with access control instead.',
      );
    });
  });

  describe('deleteBiometricKey', () => {
    it('throws error on macOS (keychain-based approach)', async () => {
      await expect(biometricsService.deleteBiometricKey()).rejects.toThrow(
        'Biometric key management not supported on macOS. Use keychain with access control instead.',
      );
    });
  });

  describe('createSignature', () => {
    it('returns null on macOS (keychain-based approach)', async () => {
      const result = await biometricsService.createSignature('test-payload');

      expect(result).toBeNull();
    });
  });
});
