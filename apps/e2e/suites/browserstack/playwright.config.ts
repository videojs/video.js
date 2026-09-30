import { resolve } from 'node:path';

import { defineConfig } from '@playwright/test';

import { suiteConfig, WEB_SERVER_SHUTDOWN } from '../../shared/playwright.ts';
import type { Options } from './test.ts';
import { versions } from './versions.ts';

export default defineConfig<{}, Options>({
  ...suiteConfig('browserstack'),
  testDir: resolve(import.meta.dirname, 'tests'),
  testMatch: '**/*.spec.ts',
  workers: 5,
  retries: 0,
  // Remote media readiness and seeking can each take up to 40 seconds.
  timeout: 3 * 60_000,
  globalTimeout: 25 * 60_000,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL: 'http://bs-local.com:5182',
    // BrowserStack records video; iOS does not support Playwright tracing.
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    viewport: { width: 960, height: 640 },
    actionTimeout: 15_000,
  },
  projects: process.env.BROWSERSTACK_LOCAL_TEST
    ? [{ name: 'local', use: { baseURL: 'http://127.0.0.1:5182' } }]
    : [
        {
          name: `chrome-${versions.chrome}`,
          use: { caps: { browser: 'chrome', browser_version: versions.chrome, os: 'Windows', os_version: '10' } },
        },
        {
          name: `edge-${versions.edge}`,
          use: { caps: { browser: 'edge', browser_version: versions.edge, os: 'Windows', os_version: '10' } },
        },
        // Bundled engines require a Playwright release; version checks reject any drift from browserslist.
        {
          name: `firefox-${versions.firefox}`,
          use: {
            caps: {
              browser: 'playwright-firefox',
              os: 'Windows',
              os_version: '10',
              'browserstack.playwrightVersion': '1.41.2',
            },
          },
        },
        {
          name: `webkit-${versions.safari}`,
          use: {
            caps: {
              browser: 'playwright-webkit',
              os: 'OS X',
              os_version: 'Big Sur',
              'browserstack.playwrightVersion': '1.35.0',
            },
          },
        },
        {
          name: `ios-safari-${versions.ios}`,
          use: {
            caps: { browser: 'safari', osVersion: versions.ios, realMobile: 'true' },
            // BrowserStack iOS requires an explicit viewport object.
            viewport: { width: 390, height: 844 },
          },
        },
      ],
  webServer: {
    command: 'pnpm exec vp -C suites/player/app dev --host 0.0.0.0 --port 5182 --strictPort',
    cwd: resolve(import.meta.dirname, '../..'),
    port: 5182,
    env: { __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: 'bs-local.com' },
    timeout: 120_000,
    reuseExistingServer: false,
    gracefulShutdown: WEB_SERVER_SHUTDOWN,
  },
});
