module.exports = {
  dependencies: {
    '@react-native-async-storage/async-storage': {
      platforms: {
        macos: null, // Disable native module for macOS, use JS fallback
      },
    },
  },
};
