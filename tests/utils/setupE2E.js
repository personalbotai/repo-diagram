// E2E test setup - minimal setup since we're using real browser
beforeAll(() => {
  // Increase timeout for Puppeteer launches
  jest.setTimeout(60000);
});

afterAll(async () => {
  // Cleanup if needed
});
