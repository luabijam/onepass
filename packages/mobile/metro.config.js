const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@onepass/vault-core': path.resolve(workspaceRoot, 'packages/vault-core'),
      crypto: require.resolve('react-native-quick-crypto'),
      stream: require.resolve('stream-browserify'),
      os: path.resolve(projectRoot, 'src/polyfills/os.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
