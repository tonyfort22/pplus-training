import { defineConfig, devices } from '@playwright/test'

import { resolveWebBaseUrl } from './e2e/base-url.js'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: resolveWebBaseUrl(),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
