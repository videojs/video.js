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
    include: ['src/**/*.test.ts'],
    // Scaffolding tests write real projects to disk.
    testTimeout: 20_000,
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
    // `npm create` fetches one file and the templates beside it, which only need Node built-ins.
    deps: { alwaysBundle: ['@clack/prompts', '@videojs/core', '@videojs/installation', '@videojs/utils'] },
  },
});
