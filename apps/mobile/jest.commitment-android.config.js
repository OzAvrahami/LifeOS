const base = require('jest-expo/jest-preset');
const android = require('jest-expo/android/jest-preset');

// jest-expo 57's platform preset replaces the default Babel options, dropping
// the inferred Expo preset in projects without babel.config.js. Retain those
// options and override only the platform for this focused native regression run.
const transformKey = '\\.[jt]sx?$';
const [transformer, options] = base.transform[transformKey];

module.exports = {
  ...android,
  rootDir: __dirname,
  setupFiles: [...android.setupFiles, '<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/commitment-time-picker-test.tsx'],
  transform: {
    ...android.transform,
    [transformKey]: [transformer, { ...options, caller: { ...options.caller, platform: 'android' } }],
  },
};
