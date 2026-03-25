const ReactNativeBiometrics = jest.fn().mockImplementation(() => ({
  isSensorAvailable: jest.fn().mockResolvedValue({ available: true, biometryType: 'Biometrics' }),
  simplePrompt: jest.fn().mockResolvedValue({ success: true }),
  createKeys: jest.fn().mockResolvedValue({ publicKey: 'mock-public-key' }),
  deleteKeys: jest.fn().mockResolvedValue({ keysDeleted: true }),
  createSignature: jest.fn().mockResolvedValue({ success: true, signature: 'mock-signature' }),
  biometricKeysExist: jest.fn().mockResolvedValue({ keysExist: false }),
}));

export const BiometryTypes = {
  TouchID: 'TouchID',
  FaceID: 'FaceID',
  Biometrics: 'Biometrics',
};

export default ReactNativeBiometrics;
