import { existsSync, realpathSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

import type { ResolvedStyles } from './resolved';

export function isStyleModulePath(path: string): boolean {
  return /\.styles(?:\.[cm]?[jt]sx?)?$/.test(path);
}

export function resolveStyleModuleFile(importer: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;

  const file = resolveSourceModule(importer, specifier);

  return file && isStyleModulePath(file) ? file : undefined;
}

/** The loaded module a style import names, by the real path its rules are keyed by. */
export function resolveStyleModule(importer: string, specifier: string, styles: ResolvedStyles): string | undefined {
  const file = resolveStyleModuleFile(importer, specifier);
  if (!file) return undefined;

  const modulePath = realpathSync(file);

  return styles.modules.has(modulePath) ? modulePath : undefined;
}

const sourceExtensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'] as const;
const sourceExtensionSet = new Set<string>(sourceExtensions);

function resolveSourceModule(importer: string, specifier: string): string | undefined {
  const candidate = resolve(dirname(importer), specifier);
  if (sourceExtensionSet.has(extname(candidate)) && existsSync(candidate)) return candidate;

  for (const extension of sourceExtensions) {
    const filename = `${candidate}${extension}`;
    if (existsSync(filename)) return filename;
  }

  for (const extension of sourceExtensions) {
    const filename = resolve(candidate, `index${extension}`);
    if (existsSync(filename)) return filename;
  }

  return undefined;
}
