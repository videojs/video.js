import type { Dirent } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, posix, resolve } from 'node:path';

export interface GeneratedFile {
  /** Workspace-relative generated path. */
  readonly path: string;
  readonly content: string;
}

/**
 * Write generated files into the workspace and remove stale files from their owned paths. Every generated file must sit
 * inside an owned path, so a generator can never overwrite a file it does not own and leave it behind when it stops.
 */
export async function syncGeneratedFiles(
  workspaceDir: string,
  files: readonly GeneratedFile[],
  ownedPaths: readonly string[]
): Promise<number> {
  const owned = ownedPaths.map((path) => workspacePath(path));
  const expected = new Map(files.map((file) => [workspacePath(file.path), file.content]));
  const existing = new Set<string>();
  const unowned = [...expected.keys()].filter(
    (path) => !owned.some((root) => path === root || path.startsWith(`${root}/`))
  );

  if (unowned.length > 0) {
    throw new Error(
      `Generated files are outside every owned path: ${unowned.map((path) => `\`${path}\``).join(', ')}.`
    );
  }

  for (const path of owned) {
    const filename = resolve(workspaceDir, path);
    const entries = await readdir(filename, { withFileTypes: true }).catch((): Dirent[] | undefined => undefined);

    if (entries) {
      for (const file of await filesWithin(workspaceDir, path, entries)) existing.add(file);
    } else if ((await stat(filename).catch(() => undefined))?.isFile()) {
      existing.add(path);
    }
  }

  let changed = 0;

  for (const path of existing) {
    if (expected.has(path)) continue;

    await rm(resolve(workspaceDir, path), { force: true });
    changed += 1;
  }

  for (const [path, content] of expected) {
    const filename = resolve(workspaceDir, path);
    const current = await readFile(filename, 'utf8').catch(() => undefined);
    if (current === content) continue;

    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, content);
    changed += 1;
  }

  return changed;
}

/**
 * A generated path in normalized workspace-relative form. Ownership is checked on this form, so a path such as
 * `out/../elsewhere.ts` cannot pass as a file under `out`.
 */
function workspacePath(path: string): string {
  const normalized = posix.normalize(path.replaceAll('\\', '/'));

  if (
    isAbsolute(path) ||
    posix.isAbsolute(normalized) ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized === '.'
  ) {
    throw new Error(`Generated path \`${path}\` must be relative to the workspace and inside it.`);
  }

  return normalized.replace(/\/$/, '');
}

async function filesWithin(workspaceDir: string, root: string, entries?: readonly Dirent[]): Promise<string[]> {
  const children = entries ?? (await readdir(resolve(workspaceDir, root), { withFileTypes: true }));

  return (
    await Promise.all(
      children.map((entry) => {
        const path = posix.join(root, entry.name);

        return entry.isDirectory() ? filesWithin(workspaceDir, path) : [path];
      })
    )
  ).flat();
}
