import { defineConfig, devices } from '@playwright/test';

// Browser tests against the deployed stack (adrs/0013-browser-tests-with-playwright.md).
// Run with `make test-browser` once the cluster is up (`make up`).

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://emploi.localhost',
    // Playwright's Chromium profile doesn't trust the mkcert CA.
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
