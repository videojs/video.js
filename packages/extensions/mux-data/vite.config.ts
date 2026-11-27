import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../../build/task.ts';
import packageJson from './package.json' with { type: 'json' };

/**
 * Replaces `src/mux-embed.d.ts` in the published types. A project where `mux-embed` resolves to types (it loads the
 * SDK's declaration file) keeps that `Mux`, augmentations included; elsewhere the import is `any`, so its keys include
 * `string`, and the bundled copy is used. Members of an untyped import are error types that turn any conditional
 * checking them into `any`, so only the namespace's keys are checked, and the unused branch is never resolved.
 */
const muxEmbedEntry = `// @ts-ignore: \`mux-embed\` has types only where the project loads its declaration file.
import type * as Loaded from 'mux-embed';
import type * as Bundled from './mux-embed-types.js';

export type Mux = string extends keyof typeof Loaded ? Bundled.Mux : Loaded.Mux;
export type Options = string extends keyof typeof Loaded ? Bundled.Options : Loaded.Options;
`;

/**
 * Publishes `mux-embed`'s ambient `declare module 'mux-embed'` file as a module, so the SDK types resolve for consumers
 * without clashing with the ambient file when they load it too. The `global` augmentation is dropped for the same
 * reason.
 */
function writeMuxEmbedDeclarations(outDir: string) {
  const muxEmbedDir = join(import.meta.dirname, 'node_modules/mux-embed');
  const declarations = readFileSync(join(muxEmbedDir, 'dist/types/mux-embed.d.ts'), 'utf8')
    .replace(/^declare module 'mux-embed' \{\n([\s\S]*)\n\}\n?$/, '$1\n')
    .replace(/\n {2}global \{\n[\s\S]*?\n {2}\}\n/, '\n')
    .replace(/^ {2}(function|const) /gm, '  declare $1 ');

  // Every top-level declaration of a module `.d.ts` needs `declare` or `export` (TS1046), types excepted.
  const undeclared = /^ {2}(?!type |interface |export |declare |\/\/|\/\*|[}\])>])\S/m;

  if (/declare module|^ {2}global /m.test(declarations) || undeclared.test(declarations)) {
    throw new Error('Unexpected mux-embed declaration layout; update writeMuxEmbedDeclarations.');
  }

  const license = readFileSync(join(muxEmbedDir, 'LICENSE'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => ` * ${line}`.trimEnd())
    .join('\n');

  writeFileSync(
    join(outDir, 'mux-embed-types.d.ts'),
    `/**\n * Types from mux-embed.\n *\n${license}\n */\n${declarations}`
  );
  writeFileSync(join(outDir, 'mux-embed.d.ts'), muxEmbedEntry);
}

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => {
  const config = packageBuildConfig(mode, 'browser');

  return {
    ...config,
    entry: { index: './src/index.ts' },
    hooks: config.dts ? { 'build:done': ({ options }) => writeMuxEmbedDeclarations(options.outDir) } : {},
    define: {
      __DEV__: mode === 'dev' ? 'true' : 'false',
      __PLAYER_VERSION__: JSON.stringify(packageJson.version),
    },
  };
};

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
