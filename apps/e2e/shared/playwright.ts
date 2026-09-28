import { resolve } from 'node:path';

import type { PlaywrightTestConfig } from '@playwright/test';

const CI = Boolean(process.env.CI);
/** Pull requests retry once: a second retry mostly re-records video and traces for the same flake. */
const RETRIES = process.env.GITHUB_EVENT_NAME === 'pull_request' ? 1 : 2;
/**
 * Under the 15-minute job timeout in `e2e.yml`, with room for the job's own setup. When the runner cancels a job the
 * conclusion is `cancelled` rather than `failure`, so no report uploads and failure triage never runs; Playwright
 * ending the run itself keeps both.
 */
const GLOBAL_TIMEOUT = 12 * 60_000;
const e2eDir = resolve(import.meta.dirname, '..');

/**
 * Stop a suite's web server with SIGTERM before Playwright falls back to SIGKILL. pnpm 12.6 starts the command it runs
 * in a process group of its own, so the SIGKILL Playwright sends to the server's group ends pnpm alone; the orphaned
 * dev server keeps the output pipes open and teardown waits on them until the global timeout. pnpm forwards SIGTERM.
 */
export const WEB_SERVER_SHUTDOWN = { signal: 'SIGTERM', timeout: 10_000 } as const;

/** Apply the shared reporting, retry, trace, and screenshot policy to one E2E suite. */
export function suiteConfig(name: string): PlaywrightTestConfig {
  return {
    snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
    outputDir: resolve(e2eDir, 'test-results', name),
    timeout: 60_000,
    globalTimeout: CI ? GLOBAL_TIMEOUT : 0,
    retries: CI ? RETRIES : 0,
    fullyParallel: true,
    reporter: CI
      ? [['html', { open: 'never', outputFolder: resolve(e2eDir, 'playwright-report', name) }], ['github'], ['blob']]
      : [['html', { open: 'never', outputFolder: resolve(e2eDir, 'playwright-report', name) }]],
    expect: {
      timeout: 10_000,
      toHaveScreenshot: {
        maxDiffPixelRatio: 0.05,
        threshold: 0.3,
        animations: 'disabled',
      },
    },
    use: {
      // Recording every local run slows the transform-heavy suites; keep traces only where they help debug.
      trace: CI ? 'on-first-retry' : 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: CI ? 'on-first-retry' : 'off',
      actionTimeout: 10_000,
    },
  };
}
