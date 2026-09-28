import { defineConfig } from 'vite-plus';

import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'node --import tsx scripts/build-icons.ts',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          input: [...cachedTaskInputs, '!dist', '!dist/**'],
          output: ['dist/**'],
        },
      },
      'test:ci': packageTestTask('pnpm run test:types && vp test run'),
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'happy-dom',
  },
});
