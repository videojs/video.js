import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { suiteConfig, WEB_SERVER_SHUTDOWN } from '../../shared/playwright.ts';

/**
 * Product behavior and visual regression of the built packages, served by the e2e app on Chromium and WebKit. A test
 * here asserts one expected outcome. Comparisons between skin outputs belong in `skin-parity`; the sandbox shell's own
 * behavior belongs in `sandbox`.
 */
export default defineConfig({
  ...suiteConfig('player'),
  testDir: resolve(import.meta.dirname, 'tests'),
  projects: [
    {
      name: 'vite-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5180' },
    },
    {
      name: 'vite-webkit',
      use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:5180' },
    },
    {
      name: 'vite-firefox',
      use: { ...devices['Desktop Firefox'], baseURL: 'http://localhost:5180' },
    },
  ],
  // The workspace overrides vite with the Vite+ core package, which only ships the vp binary, and the app folder is not
  // a workspace package, so run Vite+ from the e2e package and point it at the app directory.
  webServer: {
    command: 'pnpm exec vp -C suites/player/app dev --port 5180 --strictPort',
    cwd: resolve(import.meta.dirname, '../..'),
    port: 5180,
    stdout: 'pipe',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    gracefulShutdown: WEB_SERVER_SHUTDOWN,
  },
});
