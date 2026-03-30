import {NativeModules, Platform} from 'react-native';

export type BiometryType = 'fingerprint' | 'face' | null;

interface BiometricsModuleInterface {
  canAuthenticate(): Promise<boolean>;
  authenticate(options: {
    promptMessage: string;
    cancelButtonText: string;
  }): Promise<boolean>;
  getBiometryType(): Promise<string | null>;
}

// Safely get the native module - it may not exist on all platforms
const BiometricsModule: BiometricsModuleInterface | undefined =
  NativeModules.BiometricsModule;

export class BiometricsService {
  async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS !== 'macos' || !BiometricsModule) {
        return false;
      }
      const result = await BiometricsModule.canAuthenticate();
      return result;
    } catch {
      return false;
    }
  }

  async getBiometryType(): Promise<BiometryType> {
    try {
      if (Platform.OS !== 'macos' || !BiometricsModule) {
        return null;
      }
      const biometryType = await BiometricsModule.getBiometryType();
      if (!biometryType) {
        return null;
      }
      if (biometryType === 'FaceID') {
        return 'face';
      }
      return 'fingerprint';
    } catch {
      return null;
    }
  }

  async authenticate(
    promptMessage = 'Authenticate to unlock OnePass',
  ): Promise<boolean> {
    try {
      if (Platform.OS !== 'macos' || !BiometricsModule) {
        return false;
      }
      const result = await BiometricsModule.authenticate({
        promptMessage,
        cancelButtonText: 'Use Password',
      });
      return result;
    } catch {
      return false;
    }
  }

  async hasBiometricKey(): Promise<boolean> {
    return false;
  }

  async createBiometricKey(): Promise<string> {
    throw new Error(
      'Biometric key management not supported on macOS. Use keychain with access control instead.',
    );
  }

  async deleteBiometricKey(): Promise<boolean> {
    throw new Error(
      'Biometric key management not supported on macOS. Use keychain with access control instead.',
    );
  }

  async createSignature(
    _payload: string,
    _promptMessage = 'Authenticate to sign data',
  ): Promise<string | null> {
    return null;
  }
}
