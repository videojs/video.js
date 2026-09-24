import { type SkinPreset, skinPresets, type SkinTheme, skinThemes } from '../../src/meta.ts';

export type SkinPackage = 'html' | 'react';

/** Workspace path of one framework package's source directory. */
export const packageSourceRoot = {
  html: 'packages/html/src',
  react: 'packages/react/src',
} as const satisfies Record<SkinPackage, string>;

/** The directory each package writer regenerates whole, one subdirectory per skin plus shared modules. */
export const packageInternalRoot = {
  html: `${packageSourceRoot.html}/internal/skins`,
  react: `${packageSourceRoot.react}/internal/skins`,
} as const satisfies Record<SkinPackage, string>;

/** The background preset ships hand-written skins that each framework package receives unchanged. */
export const backgroundPresetCopies = {
  react: [
    ['packages/skins/src/presets/background/react/skin.tsx', `${packageSourceRoot.react}/presets/background/skin.tsx`],
    ['packages/skins/src/presets/background/react/skin.css', `${packageSourceRoot.react}/presets/background/skin.css`],
  ],
  html: [
    ['packages/skins/src/presets/background/html/skin.ts', `${packageSourceRoot.html}/presets/background/skin.ts`],
    ['packages/skins/src/presets/background/html/skin.css', `${packageSourceRoot.html}/define/background/skin.css`],
  ],
} as const satisfies Record<SkinPackage, readonly (readonly [source: string, destination: string])[]>;

/** The public React preset module or stylesheet for one preset and theme. */
export function reactPresetPath(preset: SkinPreset, theme: SkinTheme, extension: 'css' | 'tsx'): string {
  return `${packageSourceRoot.react}/presets/${preset}/${theme === 'default' ? 'skin' : `${theme}-skin`}.${extension}`;
}

interface PackageOutput {
  readonly path: string;
  /** Whether the writer owns everything under `path`, rather than the one file. */
  readonly tree: boolean;
}

/**
 * Every workspace path one package writer owns. It writes each file it generates there and removes any other, and the
 * generate task caches exactly these paths, so a restored cache and a fresh run leave the same files behind.
 */
function packageOutputs(target: SkinPackage): PackageOutput[] {
  const presets =
    target === 'react'
      ? skinPresets.flatMap((preset) =>
          skinThemes.flatMap((theme) =>
            (['tsx', 'css'] as const).map((extension) => reactPresetPath(preset, theme, extension))
          )
        )
      : [];

  return [
    { path: packageInternalRoot[target], tree: true },
    ...[...presets, ...backgroundPresetCopies[target].map(([, destination]) => destination)].map((path) => ({
      path,
      tree: false,
    })),
  ];
}

/** The paths a package writer owns, for syncing generated files. */
export function packageOwnedPaths(target: SkinPackage): string[] {
  return packageOutputs(target).map((output) => output.path);
}

/** Every package writer's owned paths as workspace task-cache globs. */
export function packageOutputGlobs(): Array<{ readonly pattern: string; readonly base: 'workspace' }> {
  return (['html', 'react'] as const).flatMap((target) =>
    packageOutputs(target).map((output) => ({
      pattern: output.tree ? `${output.path}/**` : output.path,
      base: 'workspace' as const,
    }))
  );
}
