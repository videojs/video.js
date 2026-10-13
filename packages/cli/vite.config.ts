import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

import { defineConfig } from 'vite-plus';

import { baseConfig } from '../../build/pack.ts';
import { packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

const templatesDir = join(import.meta.dirname, 'templates/skin');

/**
 * `skin create` downloads its templates from the commit the CLI was built from, so a CLI version always gets its own.
 * The ref comes from the checkout rather than `GITHUB_SHA`: release recovery and PR previews build a different commit
 * from the one that triggered the workflow, and the file list below is read from the checkout. Local runs pass
 * `--templates` with this folder.
 */
function skinTemplates() {
  let ref: string | undefined;

  try {
    ref = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    ref = process.env.GITHUB_SHA;
  }

  ref ||= 'main';

  const files = readdirSync(templatesDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(templatesDir, join(entry.parentPath, entry.name)))
    .sort();

  return { ref, files };
}

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        dependsOn: workspaceTaskDependencies(),
        // The bundle records the current commit for template downloads, so a cached build would point at an old one.
        cache: false,
      },
      'test:ci': packageTestTask('vp test run'),
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    include: ['src/**/*.test.ts'],
  },
  pack: {
    ...baseConfig,
    entry: { index: './src/index.ts' },
    platform: 'node',
    format: 'es',
    clean: true,
    hash: false,
    sourcemap: false,
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
    define: { __SKIN_TEMPLATES__: JSON.stringify(skinTemplates()) },
    // The published package has no runtime dependencies: `npx` fetches one file that only needs Node built-ins. Skin
    // templates aren't published either; `skin create` downloads the ones it needs.
    deps: { alwaysBundle: ['@videojs/core', '@videojs/installation', '@videojs/utils'] },
  },
});
