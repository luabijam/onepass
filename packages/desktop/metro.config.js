const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [
    // Include root node_modules for npm workspaces
    path.resolve(__dirname, '../../node_modules'),
  ],
  resolver: {
    extraNodeModules: {
      // Polyfills for Node.js core modules in React Native
      crypto: require.resolve('react-native-crypto'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
