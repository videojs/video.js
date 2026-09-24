import { isAbsolute, posix } from 'node:path';

import type { RegistryItem } from 'shadcn/schema';

import { setUnique } from '../utils/map';
import { escapesRoot, toPosixPath } from '../utils/path';

export function validateRelativePath(path: string, label: string): void {
  const normalized = normalizePath(path);

  if (
    !normalized ||
    normalized === '.' ||
    isAbsolute(path) ||
    posix.isAbsolute(normalized) ||
    escapesRoot(normalized)
  ) {
    throw new Error(`${label} must be a non-empty relative path: \`${path}\`.`);
  }
}

export function validateRegistryPaths(
  paths: { readonly install?: string | undefined; readonly import?: string | undefined },
  label: string
): void {
  if (paths.install !== undefined) validateRelativePath(paths.install, `${label} install path`);

  if (paths.import !== undefined && (!paths.import || paths.import.startsWith('.'))) {
    throw new Error(`${label} import path must be an absolute module specifier.`);
  }
}

export function validateItemName(name: string): void {
  if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
    throw new Error(`Shadcn registry item has an invalid name: \`${name}\`.`);
  }
}

/** Reject two files of one item that share a source path or an installation target. */
export function validateRegistryFiles(items: readonly RegistryItem[]): void {
  for (const item of items) {
    const paths = new Set<string>();
    const targets = new Set<string>();

    for (const file of item.files ?? []) {
      if (paths.has(file.path)) {
        throw new Error(`Shadcn registry item \`${item.name}\` contains duplicate source path \`${file.path}\`.`);
      }

      paths.add(file.path);

      if (file.target && targets.has(file.target)) {
        throw new Error(
          `Shadcn registry item \`${item.name}\` contains duplicate installation target \`${file.target}\`.`
        );
      }

      if (file.target) targets.add(file.target);
    }
  }
}

export function normalizePath(path: string): string {
  return path ? posix.normalize(toPosixPath(path)).replace(/^\.\//, '') : '';
}

export function normalizeGroup(group: string): string {
  validateRelativePath(group, 'Shadcn registry group');
  return normalizePath(group);
}

export function assertNoCollision(paths: Map<string, string>, path: string, id: string, kind: string): void {
  setUnique(
    paths,
    path,
    id,
    (previous) => `Shadcn registry ${kind} collision: \`${previous}\` and \`${id}\` both map to \`${path}\`.`
  );
}

export function addUnique(files: Map<string, string>, path: string, content: string, kind: string): void {
  setUnique(files, path, content, () => `Shadcn registry ${kind} collision: \`${path}\`.`);
}
