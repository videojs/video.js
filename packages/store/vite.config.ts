import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../build/pack.ts';
import { reactCompilerPlugin } from '../../build/react-compiler.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'neutral'),
  entry: {
    index: './src/core/index.ts',
    html: './src/html/index.ts',
    react: './src/react/index.ts',
  },
  plugins: [reactCompilerPlugin({ include: /[/\\]src[/\\]react[/\\]/ })],
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
    onConsoleLog: (log) => !log.includes('Lit is in dev mode'),
    projects: [
      {
        extends: true,
        test: {
          name: 'store',
          include: ['src/core/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'store/html',
          include: ['src/html/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'store/react',
          include: ['src/react/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],
  },
  pack: packageBuildModes.map(createPackConfig),
});
