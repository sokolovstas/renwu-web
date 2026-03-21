import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig } from '@playwright/test';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import path from 'path';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4211';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './e2e' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
});

