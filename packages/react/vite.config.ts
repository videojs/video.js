import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../build/pack.ts';
import { copyCssPlugin } from '../../build/plugins/copy-css-plugin.ts';
import { reactCompilerPlugin } from '../../build/react-compiler.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';
import { LOCALES, localeAliases } from '../core/src/core/i18n/locales.ts';
import packageJson from './package.json' with { type: 'json' };

const srcDir = new URL('./src', import.meta.url).pathname;
const srcAlias = { '@': srcDir };
const localeTags = [...LOCALES, ...localeAliases(LOCALES)];

const i18nLocaleEntries = Object.fromEntries([
  ['i18n/locales/all', 'src/i18n/locales/all.ts'],
  ['i18n/locales/all/register', 'src/i18n/locales/all/register.ts'],
  ['i18n/locales/en', 'src/i18n/locales/en.ts'],
  ['i18n/locales/en/register', 'src/i18n/locales/en/register.ts'],
  ...localeTags.map((tag) => [`i18n/locales/${tag}`, `src/i18n/locales/${tag}.ts`]),
  ...localeTags.map((tag) => [`i18n/locales/${tag}/register`, `src/i18n/locales/${tag}/register.ts`]),
]);

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'browser'),
  // Flavor modules sit beside their element's index rather than under one, so
  // they need their own entries to stay separate chunks: importing one flavor
  // must never pull the other engine in with it.
  entry: ['src/**/index.{ts,tsx}', 'src/media/*/{hls-js,spf}.tsx', i18nLocaleEntries],
  alias: srcAlias,
  // Pack does not yet preserve exact public CSS entry filenames, so retain the
  // focused source-to-dist copy until its CSS entry support can replace it.
  plugins: [reactCompilerPlugin(), copyCssPlugin({ outDir: `dist/${mode}`, rebuild: false })],
  // `packageBuildConfig` supplies `__DEV__`; a `define` here replaces it, so restate it alongside the version.
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
        dependsOn: [...workspaceTaskDependencies(), '@videojs/skins#generate'],
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
  resolve: {
    alias: srcAlias,
    // These tests run in a simulated browser, but Vitest transforms through the SSR pipeline, where `browser`
    // is not a resolve condition. Without it a dependency that answers `browser` separately — `@videojs/media`
    // does, for the medias whose engine has a server build — hands its server stand-in to a jsdom suite.
    conditions: ['browser', 'development', 'module', 'import', 'default'],
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  pack: packageBuildModes.map(createPackConfig),
});
