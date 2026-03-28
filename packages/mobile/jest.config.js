module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/)?(@react-native(.*)|react-native(.*)|@react-native-community(.*)|react-native-keychain|react-native-quick-crypto)/)',
  ],
  moduleNameMapper: {
    'react-native-keychain': '<rootDir>/__mocks__/react-native-keychain.ts',
    'react-native-vector-icons/MaterialIcons': '<rootDir>/__mocks__/react-native-vector-icons.tsx',
    '@onepass/vault-core': '<rootDir>/__mocks__/@onepass/vault-core.ts',
    'react-native-quick-crypto': '<rootDir>/__mocks__/react-native-quick-crypto.ts',
    '@react-native-clipboard/clipboard': '<rootDir>/__mocks__/@react-native-clipboard/clipboard.ts',
    zustand: '<rootDir>/__mocks__/zustand.ts',
    '../src/stores': '<rootDir>/__mocks__/stores.ts',
    './stores': '<rootDir>/__mocks__/stores.ts',
    '^../stores$': '<rootDir>/__mocks__/stores.ts',
  },
};
