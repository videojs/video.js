import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { neutralLibraryConfig } from '../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

const pack: PackUserConfig = {
  ...neutralLibraryConfig,
  dts: true,
  entry: {
    index: './src/index.ts',
    'ast/index': './src/ast/index.ts',
    'components/index': './src/components/index.ts',
    'components/jsx-runtime': './src/components/jsx-runtime.ts',
    'components/jsx-dev-runtime': './src/components/jsx-dev-runtime.ts',
    'graph/index': './src/graph/index.ts',
    'html-runtime/jsx-runtime': './src/html-runtime/jsx-runtime.ts',
    'html-runtime/jsx-dev-runtime': './src/html-runtime/jsx-dev-runtime.ts',
    'target/index': './src/target/index.ts',
    'target/jsx-runtime': './src/target/jsx-runtime.ts',
    'target/jsx-dev-runtime': './src/target/jsx-dev-runtime.ts',
    'shadcn/index': './src/shadcn/index.ts',
    'styles/index': './src/styles/index.ts',
    // Loaded by path as a worker thread, so nothing imports it.
    'styles/render-worker': './src/styles/render-worker.ts',
    'tailwind/index': './src/tailwind/index.ts',
    'plugins/index': './src/plugins/index.ts',
    'vite/index': './src/vite/index.ts',
  },
  deps: { neverBundle: [/^node:/] },
};

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack && node scripts/check-exports.mjs',
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
    include: ['src/**/*.test.{ts,tsx}'],
  },
  pack,
});
