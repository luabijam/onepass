import { BiometricsService } from '../src/services/BiometricsService';

const mockIsSensorAvailable = jest.fn();
const mockSimplePrompt = jest.fn();
const mockCreateKeys = jest.fn();
const mockDeleteKeys = jest.fn();
const mockCreateSignature = jest.fn();
const mockBiometricKeysExist = jest.fn();

jest.mock('react-native-biometrics', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      isSensorAvailable: mockIsSensorAvailable,
      simplePrompt: mockSimplePrompt,
      createKeys: mockCreateKeys,
      deleteKeys: mockDeleteKeys,
      createSignature: mockCreateSignature,
      biometricKeysExist: mockBiometricKeysExist,
    })),
  };
});

const BiometryTypes = {
  TouchID: 'TouchID',
  FaceID: 'FaceID',
  Biometrics: 'Biometrics',
};

describe('BiometricsService', () => {
  let biometricsService: BiometricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    biometricsService = new BiometricsService();
  });

  describe('isAvailable', () => {
    it('returns true when biometric sensor is available', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.Biometrics,
      });

      const result = await biometricsService.isAvailable();

      expect(result).toBe(true);
      expect(mockIsSensorAvailable).toHaveBeenCalled();
    });

    it('returns false when biometric sensor is not available', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        biometryType: null,
      });

      const result = await biometricsService.isAvailable();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockIsSensorAvailable.mockRejectedValue(new Error('Sensor check failed'));

      const result = await biometricsService.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getBiometryType', () => {
    it('returns fingerprint for Biometrics type', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.Biometrics,
      });

      const result = await biometricsService.getBiometryType();

      expect(result).toBe('fingerprint');
    });

    it('returns face for FaceID type', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.FaceID,
      });

      const result = await biometricsService.getBiometryType();

      expect(result).toBe('face');
    });

    it('returns fingerprint for TouchID type', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: true,
        biometryType: BiometryTypes.TouchID,
      });

      const result = await biometricsService.getBiometryType();

      expect(result).toBe('fingerprint');
    });

    it('returns null when biometrics not available', async () => {
      mockIsSensorAvailable.mockResolvedValue({
        available: false,
        biometryType: null,
      });

      const result = await biometricsService.getBiometryType();

      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('returns true when authentication succeeds', async () => {
      mockSimplePrompt.mockResolvedValue({
        success: true,
      });

      const result = await biometricsService.authenticate();

      expect(result).toBe(true);
      expect(mockSimplePrompt).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to unlock OnePass',
        cancelButtonText: 'Use Password',
      });
    });

    it('returns false when user cancels', async () => {
      mockSimplePrompt.mockResolvedValue({
        success: false,
      });

      const result = await biometricsService.authenticate();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockSimplePrompt.mockRejectedValue(new Error('Authentication failed'));

      const result = await biometricsService.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('hasBiometricKey', () => {
    it('returns true when biometric key exists', async () => {
      mockBiometricKeysExist.mockResolvedValue({
        keysExist: true,
      });

      const result = await biometricsService.hasBiometricKey();

      expect(result).toBe(true);
    });

    it('returns false when no biometric key exists', async () => {
      mockBiometricKeysExist.mockResolvedValue({
        keysExist: false,
      });

      const result = await biometricsService.hasBiometricKey();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      mockBiometricKeysExist.mockRejectedValue(new Error('Key check failed'));

      const result = await biometricsService.hasBiometricKey();

      expect(result).toBe(false);
    });
  });

  describe('createBiometricKey', () => {
    it('creates a new biometric key pair', async () => {
      mockCreateKeys.mockResolvedValue({
        publicKey: 'public-key-base64',
      });

      const result = await biometricsService.createBiometricKey();

      expect(result).toBe('public-key-base64');
      expect(mockCreateKeys).toHaveBeenCalled();
    });

    it('throws on error', async () => {
      mockCreateKeys.mockRejectedValue(new Error('Key creation failed'));

      await expect(biometricsService.createBiometricKey()).rejects.toThrow(
        'Failed to create biometric key'
      );
    });
  });

  describe('deleteBiometricKey', () => {
    it('deletes existing biometric key', async () => {
      mockDeleteKeys.mockResolvedValue({
        keysDeleted: true,
      });

      const result = await biometricsService.deleteBiometricKey();

      expect(result).toBe(true);
      expect(mockDeleteKeys).toHaveBeenCalled();
    });

    it('returns false when no keys to delete', async () => {
      mockDeleteKeys.mockResolvedValue({
        keysDeleted: false,
      });

      const result = await biometricsService.deleteBiometricKey();

      expect(result).toBe(false);
    });

    it('throws on error', async () => {
      mockDeleteKeys.mockRejectedValue(new Error('Key deletion failed'));

      await expect(biometricsService.deleteBiometricKey()).rejects.toThrow(
        'Failed to delete biometric key'
      );
    });
  });

  describe('createSignature', () => {
    it('creates signature with biometric authentication', async () => {
      mockCreateSignature.mockResolvedValue({
        success: true,
        signature: 'signature-base64',
      });

      const result = await biometricsService.createSignature(
        'test-payload',
        'Authenticate to sign data'
      );

      expect(result).toBe('signature-base64');
      expect(mockCreateSignature).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to sign data',
        payload: 'test-payload',
        cancelButtonText: 'Cancel',
      });
    });

    it('returns null when user cancels', async () => {
      mockCreateSignature.mockResolvedValue({
        success: false,
      });

      const result = await biometricsService.createSignature('test-payload');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockCreateSignature.mockRejectedValue(new Error('Signature creation failed'));

      const result = await biometricsService.createSignature('test-payload');

      expect(result).toBeNull();
    });
  });
});
