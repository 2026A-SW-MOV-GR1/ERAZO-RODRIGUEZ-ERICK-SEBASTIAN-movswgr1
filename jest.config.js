module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/src/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    'react-native-sqlite-storage': '<rootDir>/__mocks__/react-native-sqlite-storage.js',
    'react-native-mmkv': '<rootDir>/__mocks__/react-native-mmkv.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-sqlite-storage|react-native-mmkv)/)',
  ],
};
