import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The templates published with the package, beside the bundle: `dist/index.mjs` → `templates/skin`. They stay plain
 * files rather than bundled strings, so the `agents` commands load no more than before.
 */
export function defaultTemplateSource(): string {
  return fileURLToPath(new URL('../templates/skin', import.meta.url));
}

/** The template files under each of `directories` in `source`, keyed by directory and then by path within it. */
export async function loadTemplates(
  source: string,
  directories: readonly string[]
): Promise<Map<string, Map<string, string>>> {
  const result = new Map<string, Map<string, string>>();

  for (const directory of directories) {
    const root = resolve(source, directory);
    const files = new Map<string, string>();
    const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => {
      throw new Error(`Could not read skin templates from ${root}.`);
    });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const path = join(entry.parentPath, entry.name);

      files.set(relative(root, path), await readFile(path, 'utf8'));
    }

    result.set(directory, files);
  }

  return result;
}
