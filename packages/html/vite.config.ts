import { globSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import {
  inlineCssConfig,
  isDevBuildMode,
  type PackageBuildMode,
  packageBuildConfig,
  packageBuildModes,
} from '../../build/pack.ts';
import { copyCssPlugin } from '../../build/plugins/copy-css-plugin.ts';
import { inlineTemplatePlugin } from '../../build/plugins/inline-template-plugin.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';
import { LOCALES, localeAliases } from '../core/src/core/i18n/locales.ts';

const packageDir = dirname(fileURLToPath(import.meta.url));
const srcDir = new URL('./src', import.meta.url).pathname;

const srcAlias = { '@': srcDir };
const generatedSkinRegistration = /\/internal\/skins\/.+\/register\.[cm]?[jt]s$/;
const localeTags = [...LOCALES, ...localeAliases(LOCALES)];

const defineEntries = Object.fromEntries(
  globSync('src/define/**/*.ts', { cwd: packageDir })
    .filter((file) => !file.includes('.test.'))
    .map((file) => {
      const key = file.replace('src/', '').replace('.ts', '');

      return [key, file];
    })
);

const presetEntries = Object.fromEntries(
  globSync('src/presets/*/index.ts', { cwd: packageDir }).map((file) => {
    const key = file.replace('src/', '').replace('.ts', '');

    return [key, file];
  })
);

const iconEntries = Object.fromEntries(
  globSync('src/icons/**/index.ts', { cwd: packageDir }).map((file) => {
    const key = file.replace('src/', '').replace('.ts', '');

    return [key, file];
  })
);

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
  name: 'package',
  entry: {
    index: 'src/index.ts',
    'i18n/index': 'src/i18n/index.ts',
    ...i18nLocaleEntries,
    ...iconEntries,
    ...defineEntries,
    ...presetEntries,
  },
  treeshake: {
    // The sideEffects field in package.json uses dist paths, but the build
    // runs against source. Ensure define/* modules (which register custom
    // elements as a side effect) are never tree-shaken from skin bundles.
    moduleSideEffects: [
      { test: generatedSkinRegistration, sideEffects: true },
      { test: /\/define\//, sideEffects: true },
      { test: /\/icons\/(?:dist\/)?element\//, sideEffects: true },
      { test: /\/i18n\/locales\/.+\/register/, sideEffects: true },
    ],
  },
  deps: {
    alwaysBundle: [/^@videojs\/icons/],
  },
  alias: srcAlias,
  // Also minifies the skins' `.css?inline` imports, which tsdown inlines into the JavaScript.
  css: { ...inlineCssConfig, minify: !isDevBuildMode(mode) },
  plugins: [copyCssPlugin({ outDir: `dist/${mode}` }), inlineTemplatePlugin({ minify: !isDevBuildMode(mode) })],
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
  },
  resolve: {
    // These tests run in a simulated browser, but Vitest transforms through the SSR pipeline, where `browser`
    // is not a resolve condition. Without it a dependency that answers `browser` separately — `@videojs/media`
    // does, for the medias whose engine has a server build — hands its server stand-in to a happy-dom suite.
    conditions: ['browser', 'development', 'module', 'import', 'default'],
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    passWithNoTests: true,
    onConsoleLog: (log) => !log.includes('Lit is in dev mode'),
    environment: 'happy-dom',
    // Dynamic composite imports can exceed Vitest's default under workspace load.
    testTimeout: 15_000,
  },
  pack: packageBuildModes.map(createPackConfig),
});
