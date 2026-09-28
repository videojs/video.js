import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { suiteConfig, WEB_SERVER_SHUTDOWN } from '../../shared/playwright.ts';

/** CI shards the suite per preset; one value restricts the run to that preset's spec. */
const preset = process.env.VJSC_SKIN_PRESET;
/** The video preset carries twice the cases of the others, so CI splits it further as `current/total`. */
const shard = /^(\d+)\/(\d+)$/.exec(process.env.VJSC_SKIN_SHARD ?? '');

/**
 * Generator correctness: one authored skin rendered through CSS and through Tailwind, and through the authored and the
 * packaged source, has to agree. A test belongs here only when it compares two panels of the same skin; a skin behavior
 * with one expected outcome belongs in the `player` suite, where it also runs on WebKit.
 */
export default defineConfig({
  ...suiteConfig('skin-parity'),
  testDir: resolve(import.meta.dirname, 'tests'),
  testMatch: preset ? `**/vjsc-${preset}-skin-styling.spec.ts` : '**/*.spec.ts',
  shard: shard ? { current: Number(shard[1]), total: Number(shard[2]) } : null,
  // The warm-up compiles every skin and the Tailwind entry before the first case, so workers never race cold transforms.
  globalSetup: resolve(import.meta.dirname, 'setup/global.ts'),
  workers: process.env.CI ? 2 : 4,
  projects: [
    {
      name: 'vjsc-chromium',
      // Both stacked panels must fit without scrolling: a capture that scrolls moves the pointer off hovered controls.
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5190', viewport: { width: 1280, height: 1600 } },
    },
  ],
  // The sandbox hosts the comparison: its compare mode renders the two variants in two frames of the same template.
  webServer: {
    command: 'pnpm dev:sandbox --port 5190 --strictPort',
    cwd: resolve(import.meta.dirname, '../../../..'),
    port: 5190,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: WEB_SERVER_SHUTDOWN,
  },
});
