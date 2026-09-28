import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';
import { vjscComponentSchemaPlugin } from '../vjsc/src/plugins/component-schema.ts';
import { LOCALES, localeAliases } from './src/core/i18n/locales.ts';
import en from './src/core/i18n/locales/en.ts';

const localeTags = [...LOCALES, ...localeAliases(LOCALES)];
const textNamespaces = [...new Set(Object.keys(en).map((key) => key.split('.')[0]))];

const localeEntries = Object.fromEntries([
  ['i18n/locales/all', './src/core/i18n/locales/all.ts'],
  ['i18n/locales/en', './src/core/i18n/locales/en.ts'],
  ...localeTags.map((tag) => [`i18n/locales/${tag}`, `./src/core/i18n/locales/${tag}.ts`]),
  ...textNamespaces.map((namespace) => [`i18n/text/${namespace}`, `./src/core/i18n/text/${namespace}.ts`]),
]);

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'neutral'),
  dts:
    mode === 'dev'
      ? {
          generator: 'tsgo',
          tsconfig: 'tsconfig.dts.json',
          entry: ['src/**/*.ts'],
        }
      : false,
  deps: { neverBundle: ['vjsc/components'] },
  plugins: [
    vjscComponentSchemaPlugin({
      file: 'vjsc',
      declaration: mode === 'dev',
      source: '@videojs/core/vjsc',
      include: ['./src/core/ui/*/component.ts'],
    }),
  ],
  entry: {
    index: './src/core/index.ts',
    i18n: './src/core/i18n/index.ts',
    ...localeEntries,
    dom: './src/dom/index.ts',
  },
  define: {
    __DEV__: mode === 'dev' ? 'true' : 'false',
  },
});

export default defineConfig({
  run: {
    tasks: {
      build: {
        command:
          'node --import tsx ./scripts/generate-i18n-locales.ts && node --import tsx ./scripts/generate-i18n-types.ts && vp pack',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          // The CDN task consumes Core, but its generated output is not an input
          // to Core's locale generators or package build.
          input: [
            ...cachedTaskInputs,
            { pattern: '!packages/cdn/*.css', base: 'workspace' },
            { pattern: '!packages/cdn/*.d.ts', base: 'workspace' },
            { pattern: '!packages/cdn/*.js', base: 'workspace' },
            { pattern: '!packages/cdn/*.js.map', base: 'workspace' },
            { pattern: '!packages/cdn/archive/**', base: 'workspace' },
            { pattern: '!packages/cdn/chunks/**', base: 'workspace' },
            { pattern: '!packages/cdn/extensions/**', base: 'workspace' },
            { pattern: '!packages/cdn/locales/**', base: 'workspace' },
            { pattern: '!packages/cdn/media/**', base: 'workspace' },
            { pattern: '!packages/cdn/src/locales/**', base: 'workspace' },
          ],
          output: [
            'dist/**',
            'src/core/i18n/load-locale.ts',
            'src/core/i18n/locales/all.ts',
            'src/core/i18n/params.generated.ts',
            'src/core/i18n/text/**',
            { pattern: 'packages/html/src/i18n/locales/**', base: 'workspace' },
            { pattern: 'packages/react/src/i18n/locales/**', base: 'workspace' },
          ],
        },
      },
      'test:ci': packageTestTask('pnpm run test:types && vp test run'),
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
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          include: ['src/core/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'core/dom',
          include: ['src/dom/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: ['src/dom/tests/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'core/scripts',
          include: ['scripts/**/*.test.ts'],
        },
      },
    ],
  },
  pack: packageBuildModes.map(createPackConfig),
});
