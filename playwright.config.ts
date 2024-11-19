import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 60000,
  retries: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:4200',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
