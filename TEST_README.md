# Automation Test Suite for RepoDiagram

This directory contains comprehensive tests for the gh-pages application.

## Structure

- `unit/` - Unit tests for core functions (Jest + jsdom)
- `integration/` - Integration tests for user flows
- `e2e/` - End-to-end tests with Puppeteer
- `fixtures/` - Test data and mock responses
- `utils/` - Test utilities and helpers

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Coverage Goals

- Core logic: 90%+
- UI interactions: 80%+
- Error handling: 95%+
