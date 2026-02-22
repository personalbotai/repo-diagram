module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setupTests.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js'
  ],
  collectCoverageFrom: [
    'app.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['js'],
  verbose: true
};
