const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
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
