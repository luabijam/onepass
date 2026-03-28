const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    nodeModulesPaths: [
      require('path').resolve(__dirname, 'node_modules'),
      require('path').resolve(__dirname, '../../node_modules'),
    ],
  },
  watchFolders: [require('path').resolve(__dirname, '../../node_modules')],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
