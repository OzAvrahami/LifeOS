const base = require('./jest.commitment-android.config');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/__tests__/task-date-native-test.tsx'],
};
