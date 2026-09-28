import { resolve } from 'node:path';

import { defineConfig } from '@playwright/test';

import { suiteConfig, WEB_SERVER_SHUTDOWN } from '../../shared/playwright.ts';

/**
 * Real key-system negotiation against a local CDM.
 *
 * Opt-in: it needs a Google Chrome install to borrow a Widevine CDM from, and runs headed because a CDM will not
 * provision otherwise. The suite skips itself where that is missing rather than failing, so running it on a machine
 * without Chrome is harmless. Not part of `test:all`, and not runnable on hosted CI.
 *
 * The fixture supplies its own persistent context, so this config declares no projects — `use: { ...devices }` would
 * not reach the browser it launches.
 */
export default defineConfig({
  ...suiteConfig('drm'),
  testDir: resolve(import.meta.dirname, 'tests'),
  // One browser, one profile: a persistent context cannot be shared across workers.
  fullyParallel: false,
  workers: 1,
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
