import { defineConfig } from 'vite-plus';

import { cachedTaskInputs, workspaceTaskDependencies } from '../../build/task.ts';

const testInputs = [...cachedTaskInputs, '!playwright-report/**', '!test-results/**', '!suites/registry/.generated/**'];

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  run: {
    tasks: {
      typecheck: {
        command: 'tsgo --project tsconfig.json --noEmit',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          input: testInputs,
          output: [],
        },
      },
      'prepare:player': {
        command: 'pnpm generate-pages',
        // The CDN pages import the bundles the cdn package packs, which its plain `build` task does not produce.
        dependsOn: [...workspaceTaskDependencies(), '@videojs/cdn#build:cdn'],
        cache: {
          input: testInputs,
          output: ['suites/player/app/src/index.html', 'suites/player/app/src/pages/**'],
        },
      },
      'test:player': {
        command: 'playwright test --config suites/player/playwright.config.ts',
        dependsOn: ['prepare:player'],
        cache: false,
      },
      'test:skin-parity': {
        command: 'playwright test --config suites/skin-parity/playwright.config.ts',
        dependsOn: [...workspaceTaskDependencies(), '@videojs/sandbox#setup', '@videojs/skins#generate'],
        cache: false,
      },
      'test:sandbox': {
        command: 'playwright test --config suites/sandbox/playwright.config.ts',
        dependsOn: ['@videojs/sandbox#setup'],
        cache: false,
      },
      // Opt-in: needs a local Chrome to borrow a Widevine CDM from, and runs headed.
      // Skips itself where that is missing, so it is safe to invoke anywhere — but it
      // is deliberately out of `test:all`, since hosted CI can never satisfy it.
      'test:drm': {
        command: 'playwright test --config suites/drm/playwright.config.ts',
        dependsOn: ['@videojs/sandbox#setup'],
        cache: false,
      },
      'test:registry': {
        command: 'playwright test --config suites/registry/playwright.config.ts',
        dependsOn: ['@videojs/skins#build:shadcn', '@videojs/react#build', '@videojs/html#build'],
        cache: {
          input: testInputs,
          output: [],
        },
      },
      'test:registry:full': {
        command: 'playwright test --config suites/registry/playwright.config.ts',
        dependsOn: ['@videojs/skins#build:shadcn', '@videojs/react#build', '@videojs/html#build'],
        cache: false,
      },
      'test:registry:published': {
        command: 'node --import tsx suites/registry/setup/published.ts',
        dependsOn: ['@videojs/skins#build:shadcn'],
        cache: false,
      },
    },
  },
});
