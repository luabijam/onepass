const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for pnpm monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [
    // Include root node_modules for pnpm monorepo
    path.resolve(__dirname, '../../node_modules'),
    // Include workspace packages
    path.resolve(__dirname, '../vault-core'),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, '../../node_modules'),
    ],
    extraNodeModules: {
      '@onepass/vault-core': path.resolve(__dirname, '../vault-core'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
