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
    include: ['src/**/*.test.ts'],
  },
  pack: {
    ...neutralLibraryConfig,
    entry: {
      index: './src/index.ts',
      node: './src/node.ts',
    },
    // The site's installation Markdown edge function loads `dist/index.js` through an import map, and Netlify's edge
    // bundler can't resolve workspace packages from there.
    deps: { alwaysBundle: ['@videojs/media'] },
  },
});
