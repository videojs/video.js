import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

import { workspaceTaskDependencies } from '../../build/task.ts';

const require = createRequire(import.meta.url);
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));
const nativeEngineStore = fileURLToPath(new URL('./src/media/NativeEngineStore.ts', import.meta.url));
const fakeEngineStore = fileURLToPath(new URL('./test/fake-native-engine-store.ts', import.meta.url));

/**
 * Tests construct `ReactNativeMedia`, which loads the TurboModule at import time. Swap that module for an in-memory
 * engine so the suite can run without a native binary. The redirect is test-only; `bob build` does not use this
 * config.
 */
function fakeNativeEnginePlugin() {
  return {
    name: 'react-native-fake-engine',
    enforce: 'pre' as const,
    resolveId(id: string, importer?: string) {
      if (!importer) return null;

      const specifier = id.split('?')[0] ?? id;
      const resolved = resolve(dirname(importer), specifier);
      if (resolved === nativeEngineStore || `${resolved}.ts` === nativeEngineStore) return fakeEngineStore;

      return null;
    },
  };
}

export default defineConfig({
  plugins: process.env.VITEST ? [fakeNativeEnginePlugin()] : [],
  resolve: {
    // `@videojs/store/react` resolves the workspace React 19.3 copy. This package and react-dom
    // are on 19.2, and two Reacts in one renderer break hooks. Pin every import to this package's copy.
    alias: {
      react: reactDir,
      'react-dom': reactDomDir,
    },
  },
  define: {
    __DEV__: 'true',
  },
  run: {
    tasks: {
      // Tests import this package from source and the workspace packages from their builds.
      // `build` stays the package.json `bob build` script, so it is not redefined here.
      'test:ci': {
        command: 'pnpm test',
        cache: false,
        dependsOn: workspaceTaskDependencies(),
      },
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
