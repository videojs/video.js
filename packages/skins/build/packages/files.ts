import { type Dirent, globSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, posix, resolve } from 'node:path';

export interface GeneratedPackageFile {
  /** Workspace-relative generated path. */
  readonly path: string;
  readonly content: string;
}

/**
 * Synchronize generated framework inputs and remove stale files from their owned roots. An owned path is a file, a
 * directory, or a glob of files.
 */
export async function syncGeneratedFiles(
  workspaceDir: string,
  files: readonly GeneratedPackageFile[],
  ownedPaths: readonly string[]
): Promise<number> {
  const expected = new Map(files.map((file) => [file.path, file.content]));
  const existing = new Set<string>();

  for (const path of ownedPaths) {
    if (path.includes('*')) {
      for (const file of globSync(path, { cwd: workspaceDir })) existing.add(file.replaceAll('\\', '/'));

      continue;
    }

    const filename = resolve(workspaceDir, path);
    const entries = await readdir(filename, { withFileTypes: true }).catch((): Dirent[] | undefined => undefined);

    if (entries) {
      for (const file of await filesWithin(workspaceDir, path, entries)) existing.add(file);
    } else if (await readFile(filename).catch(() => undefined)) {
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
