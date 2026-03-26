module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    'react-native/react-native': true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-native/no-inline-styles': 'off',
  },
  ignorePatterns: ['android/', 'ios/', 'macos/', 'node_modules/', 'coverage/'],
};
