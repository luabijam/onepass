import ReactNativeBiometrics from 'react-native-biometrics';

export type BiometryType = 'fingerprint' | 'face' | null;

export class BiometricsService {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch {
      return false;
    }
  }

  async getBiometryType(): Promise<BiometryType> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      if (!available || !biometryType) {
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

  async authenticate(promptMessage = 'Authenticate to unlock OnePass'): Promise<boolean> {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Use Password',
      });
      return success;
    } catch {
      return false;
    }
  }

  async hasBiometricKey(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch {
      return false;
    }
  }

  async createBiometricKey(): Promise<string> {
    try {
      const { publicKey } = await this.rnBiometrics.createKeys();
      return publicKey;
    } catch (error) {
      throw new Error('Failed to create biometric key');
    }
  }

  async deleteBiometricKey(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.rnBiometrics.deleteKeys();
      return keysDeleted;
    } catch (error) {
      throw new Error('Failed to delete biometric key');
    }
  }

  async createSignature(
    payload: string,
    promptMessage = 'Authenticate to sign data'
  ): Promise<string | null> {
    try {
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload,
        cancelButtonText: 'Cancel',
      });
      if (success && signature) {
        return signature;
      }
      return null;
    } catch {
      return null;
    }
  }
}
