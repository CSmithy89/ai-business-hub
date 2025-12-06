import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for HYVVE Platform
 * @see https://playwright.dev/docs/test-configuration
 *
 * Timeout standards (TEA knowledge base: playwright-config.md):
 * - Action timeout: 15s (UI interactions)
 * - Navigation timeout: 30s (page loads)
 * - Test timeout: 60s (full test execution)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeouts - calibrated for complex multi-tenant flows
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Failure artifact capture (retain-on-failure pattern)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Action timeouts
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Reporters - HTML for local debugging, JUnit for CI
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Browser matrix - start with Chromium, expand as needed
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for cross-browser testing:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Web server - auto-start Next.js dev server for local testing
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
