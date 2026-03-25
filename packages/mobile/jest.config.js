module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/)?(@react-native(.*)|react-native(.*)|@react-native-community(.*)|react-native-keychain)/)',
  ],
  moduleNameMapper: {
    'react-native-keychain': '<rootDir>/__mocks__/react-native-keychain.ts',
  },
};
