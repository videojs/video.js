import { defineConfig } from 'vite-plus';

import { workspaceTaskDependencies } from '../../build/task.ts';

export default defineConfig({
  run: {
    tasks: {
      // `bob build` stays the package.json `build` script; tests only need the workspace packages they import.
      'test:ci': {
        command: 'pnpm test',
        cache: false,
        dependsOn: workspaceTaskDependencies(),
      },
    },
  },
  define: {
    __DEV__: 'true',
  },
  test: {
    // Only framework-free modules are tested here: `react-native` ships Flow sources that Vitest cannot load.
    include: ['src/**/tests/*.test.ts'],
  },
});
