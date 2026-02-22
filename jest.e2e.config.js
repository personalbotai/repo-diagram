module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setupE2E.js'],
  verbose: true,
  testTimeout: 30000,
  // Don't collect coverage for E2E
  collectCoverage: false
};
