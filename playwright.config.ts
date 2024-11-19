import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests', // Specify the directory containing your tests
  timeout: 60000, // 60 seconds timeout for each test
  retries: 1, // Number of retries on failure
  use: {
    headless: true,
    baseURL: 'http://localhost:4200',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
