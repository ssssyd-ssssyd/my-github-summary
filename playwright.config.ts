import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 30000,
  retries: 2,
  reporter: [['list'], ['html']],
});
