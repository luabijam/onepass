const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  // Watch all files in the workspace root (including vault-core package)
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      // Polyfills for Node.js core modules in React Native
      crypto: require.resolve('react-native-crypto'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
