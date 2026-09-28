import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../../build/task.ts';
import packageJson from './package.json' with { type: 'json' };

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'browser'),
  // `@videojs/mux` is a private workspace package: inline it (code and declarations) rather than depend on it.
  deps: {
    alwaysBundle: ['@videojs/mux'],
    dts: { alwaysBundle: ['@videojs/mux'] },
  },
  entry: { index: './src/index.ts' },
  define: {
    __DEV__: mode === 'dev' ? 'true' : 'false',
    __PLAYER_VERSION__: JSON.stringify(packageJson.version),
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
  define: {
    __DEV__: 'true',
    __PLAYER_VERSION__: JSON.stringify(packageJson.version),
  },
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
