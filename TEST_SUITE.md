# RepoDiagram Test Suite

Comprehensive testing for the GitHub repository visualization tool.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests (unit + E2E)
npm test

# Run only unit tests (fast)
npm run test:unit

# Run only E2E tests (requires display)
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/                    # Unit tests for pure functions
│   └── repoDiagram.test.js
├── integration/             # Integration tests for UI interactions
│   └── repoDiagram.integration.test.js
├── e2e/                     # End-to-end browser tests
│   └── repoDiagram.e2e.test.js
├── fixtures/                # Mock data
│   └── mockData.js
└── utils/                   # Test utilities
    ├── setupTests.js
    └── setupE2E.js
```

## What's Being Tested

### Unit Tests (`tests/unit/`)
- `buildTree()` - Converts flat GitHub tree to hierarchical structure
- `formatSize()` - Human-readable file sizes
- `getFileExtension()` - Extension extraction
- `getIconForFilename()` - Emoji icon mapping
- `countFiles()` - Recursive file counting
- `collectStats()` - Repository statistics
- `calculateSmartDepth()` - Automatic depth selection
- `escapeHtml()` - XSS prevention
- Class initialization and state management

### Integration Tests (`tests/integration/`)
- DOM element initialization
- Loading states and error handling
- Search filtering
- Dark mode toggle
- Zoom and pan controls
- Tab navigation
- Stats updates
- Mermaid code generation
- Keyboard navigation

### E2E Tests (`tests/e2e/`)
- Full application loading
- Repository loading with mock API
- UI interactions (clicks, typing)
- Modal dialogs
- Export functionality
- Cross-browser compatibility

## CI/CD Integration

The `.github/workflows/tests.yml` file provides:
- Automated testing on push/PR
- Unit tests with coverage reporting to Codecov
- E2E tests with Puppeteer
- Matrix testing across Node.js versions (can be added)

## Coverage Goals

- **Core logic**: 90%+
- **UI interactions**: 80%+
- **Error handling**: 95%+

## Writing New Tests

### Unit Test Example

```javascript
describe('functionName', () => {
  test('should handle edge case', () => {
    const result = functionName(input);
    expect(result).toEqual(expected);
  });
});
```

### Integration Test Example

```javascript
test('should update UI on user action', async () => {
  fireEvent.click(button);
  await waitFor(() => {
    expect(element.textContent).toBe('expected');
  });
});
```

### E2E Test Example

```javascript
test('should complete user flow', async () => {
  await page.goto('http://localhost:8080');
  await page.type('#input', 'value');
  await page.click('#button');
  await page.waitForSelector('.result');
  const text = await page.$eval('.result', el => el.textContent);
  expect(text).toContain('success');
});
```

## Mocking Strategy

- **fetch**: Mocked in unit/integration tests
- **DOM**: jsdom environment for unit tests
- **Canvas/Image**: Mocked to avoid native dependencies
- **GitHub API**: Mock responses in fixtures/

## Troubleshooting

### E2E tests fail to launch browser
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install -y ca-certificates fonts-liberation libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils
```

### Memory leaks in tests
- Ensure all event listeners are cleaned up
- Use `afterEach` to reset state
- Call `jest.clearAllMocks()`

### Tests are flaky
- Add explicit waits (`await waitFor(...)`)
- Increase timeouts in jest.config.js
- Check for async operations not being awaited

## Performance Benchmarks

Target times (on CI):
- Unit tests: < 30s
- Integration tests: < 60s
- E2E tests: < 120s

## Future Improvements

- [ ] Add visual regression testing (Percy/Chromatic)
- [ ] Add performance benchmarks (Lighthouse CI)
- [ ] Add accessibility testing (axe-core)
- [ ] Expand E2E to cover all export formats
- [ ] Add mutation testing (Stryker)
