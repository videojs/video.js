import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../../build/task.ts';

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'neutral'),
  entry: {
    helpers: './src/helpers.ts',
    index: './src/index.ts',
    server: './src/server.ts',
  },
  deps: {
    neverBundle: [/^@wistia\//, /^preact/],
  },
});

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
  define: { __DEV__: 'true' },
  resolve: { conditions: ['browser', 'development', 'module', 'import', 'default'] },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'jsdom',
  },
  pack: packageBuildModes.map(createPackConfig),
});
