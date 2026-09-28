import { defineConfig } from 'vite-plus';

import { baseConfig } from '../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          input: cachedTaskInputs,
          output: ['dist/**'],
        },
      },
      'test:ci': packageTestTask('vp test run'),
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    include: ['src/**/*.test.ts'],
  },
  pack: {
    ...baseConfig,
    entry: { index: './src/index.ts' },
    platform: 'node',
    format: 'es',
    clean: true,
    hash: false,
    sourcemap: false,
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
    // The published package has no runtime dependencies: `npx` fetches one file that only needs Node built-ins.
    deps: { alwaysBundle: ['@videojs/installation', '@videojs/utils'] },
  },
});
