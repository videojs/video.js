import { defineConfig } from 'vite-plus';

import { neutralLibraryConfig } from '../../build/pack.ts';
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
      'test:ci': packageTestTask(),
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    // Vitest v4 compatibility: keep separate Vite servers for inline projects.
    // Remove when plugins and config hooks can run once for shared projects.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#inline-projects-share-the-vite-server-by-default
    sharedViteServer: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'utils',
          include: ['src/**/*.test.ts'],
          exclude: ['src/dom/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'utils/dom',
          include: ['src/dom/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
  },
  pack: {
    ...neutralLibraryConfig,
    entry: {
      array: './src/array/index.ts',
      dom: './src/dom/index.ts',
      events: './src/events/index.ts',
      function: './src/function/index.ts',
      i18n: './src/i18n/index.ts',
      jwt: './src/jwt/index.ts',
      number: './src/number/index.ts',
      object: './src/object/index.ts',
      percent: './src/percent/index.ts',
      predicate: './src/predicate/index.ts',
      string: './src/string/index.ts',
      style: './src/style/index.ts',
      time: './src/time/index.ts',
      types: './src/types/index.ts',
    },
  },
});
