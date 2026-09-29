import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { cssExclude, cssTargets } from './css-targets.ts';

/** `dev` and `default` outputs consumed by package `exports` conditions. */
export type PackageBuildMode = 'dev' | 'default';

export const packageBuildModes: PackageBuildMode[] = ['dev', 'default'];

const isWatchMode =
  process.env.VP_PACK_WATCH === 'true' || process.argv.includes('--watch') || process.argv.includes('-w');

/** Applied to every Vite+ pack config in the monorepo. */
export const baseConfig = {
  inputOptions: {
    experimental: {
      nativeMagicString: true,
    },
  },
  // Matches `packages/<name>/dist` and bucketed `packages/<bucket>/<name>/dist`.
  ignoreWatch: [/[/\\]packages[/\\](?:[^/\\]+[/\\])?[^/\\]+[/\\]dist(?:[/\\]|$)/],
  report: process.env.CI === 'true',
} satisfies PackUserConfig;

/**
 * Input options for unbundled packs. Each source file maps to one output file, so `'use client'` stays at the top of
 * it; Rolldown's warning only applies to directives merged into a shared chunk. Bundled packs keep the warning.
 */
const unbundledInputOptions = {
  ...baseConfig.inputOptions,
  onLog(level, log, defaultHandler) {
    if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;

    defaultHandler(level, log);
  },
} satisfies PackUserConfig['inputOptions'];

/**
 * CSS options for packs that inline skin CSS through `?inline` imports, which tsdown transforms itself: without targets
 * it drops the vendor prefixes the skins rely on.
 */
export const inlineCssConfig = {
  lightningcss: { targets: cssTargets, exclude: cssExclude },
} satisfies PackUserConfig['css'];

/** Shared options for packages that emit `dist/dev` and `dist/default`. */
export function packageBuildConfig(mode: PackageBuildMode, platform: 'browser' | 'neutral' = 'neutral') {
  return {
    ...baseConfig,
    inputOptions: unbundledInputOptions,
    platform,
    format: 'es' as const,
    // The default build is unminified, so source maps add ~1,400 files to the
    // published packages for little debugging value. Bundlers pick the `dev`
    // build through the `development` condition, which keeps its maps.
    sourcemap: mode === 'dev',
    clean: !isWatchMode,
    hash: false,
    unbundle: true,
    outDir: `dist/${mode}`,
    define: {
      __DEV__: mode === 'dev' ? 'true' : 'false',
    },
    dts: mode === 'dev' ? ({ generator: 'tsgo', tsconfig: 'tsconfig.dts.json' } as const) : (false as const),
  };
}

export function isDevBuildMode(mode: PackageBuildMode): boolean {
  return mode === 'dev';
}

/** Single-output packages (e.g. `@videojs/utils`) without dev/default splits. */
export const neutralLibraryConfig = {
  ...baseConfig,
  inputOptions: unbundledInputOptions,
  platform: 'neutral' as const,
  format: 'es' as const,
  sourcemap: true,
  clean: !isWatchMode,
  hash: false,
  unbundle: true,
  dts: { generator: 'tsgo', tsconfig: 'tsconfig.dts.json' } as const,
};
