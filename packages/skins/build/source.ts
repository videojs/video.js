import { relative, resolve } from 'node:path';

import { isSkinName, isSkinTheme, type SkinName, type SkinTheme } from '../src/meta.ts';

/** Authored skin source, which is also the VJSC graph root, so graph source paths are relative to it. */
export const sourceDir = resolve(import.meta.dirname, '../src');

/**
 * Where an authored module sits in `src`. The layout decides the variants a module compiles for, how its styles scope,
 * the metadata its path implies, and where it installs.
 */
export type SkinSource =
  /** `components/<category>/…`: reusable across every skin of a theme. */
  | { readonly kind: 'component'; readonly path: string; readonly category: string; readonly file: string }
  /** `skins/<theme>/<preset>/…`: owned by one skin. */
  | { readonly kind: 'skin'; readonly path: string; readonly skin: SkinName; readonly file: string }
  /** `skins/shared/<group>/…`: shared by the skins of every theme, grouped by media or behavior. */
  | { readonly kind: 'shared'; readonly path: string; readonly group: string; readonly file: string }
  /** `skins/<theme>/shared/…`: shared by the skins of one theme. */
  | { readonly kind: 'theme'; readonly path: string; readonly theme: SkinTheme; readonly file: string }
  | { readonly kind: 'other'; readonly path: string };

/** A source filename as a `src`-relative path, the form graph modules carry as `sourcePath`. */
export function skinSourcePath(filename: string): string {
  return relative(sourceDir, filename).replaceAll('\\', '/');
}

/** Classify an authored module by its `src`-relative path. */
export function skinSource(path: string): SkinSource {
  const component = /^components\/([^/]+)\/(.+)$/.exec(path);
  if (component) return { kind: 'component', path, category: component[1]!, file: component[2]! };

  const nested = /^skins\/([^/]+)\/([^/]+)\/(.+)$/.exec(path);
  if (!nested) return { kind: 'other', path };

  const [, owner, group, file] = nested as unknown as [string, string, string, string];
  const skin = `${owner}-${group}`;
  if (isSkinName(skin)) return { kind: 'skin', path, skin, file };

  if (owner === 'shared') return { kind: 'shared', path, group, file };

  return group === 'shared' && isSkinTheme(owner)
    ? { kind: 'theme', path, theme: owner, file }
    : { kind: 'other', path };
}

/** Classify an authored module by its filename. */
export function skinSourceOf(filename: string): SkinSource {
  return skinSource(skinSourcePath(filename));
}
