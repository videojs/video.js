import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { suiteConfig, WEB_SERVER_SHUTDOWN } from '../../shared/playwright.ts';

/** The sandbox shell itself: its controls, compare and mirror modes, report, and localization. */
export default defineConfig({
  ...suiteConfig('sandbox'),
  testDir: resolve(import.meta.dirname, 'tests'),
  projects: [
    {
      name: 'sandbox-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(process.env.SANDBOX_URL
    ? {}
    : {
        webServer: {
          command: 'pnpm dev:sandbox --port 5299',
          cwd: resolve(import.meta.dirname, '../../../..'),
          port: 5299,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
          gracefulShutdown: WEB_SERVER_SHUTDOWN,
        },
      }),
});
