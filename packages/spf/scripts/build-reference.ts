/**
 * Generate the `@videojs/spf` API reference under `docs/reference/` from the TypeScript sources and their JSDoc.
 *
 * `--check` renders to memory and exits 1 listing the committed files that differ, are missing, or are extra; it writes
 * nothing.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildModel } from './reference/model';
import { loadProgram } from './reference/program';
import { renderPages } from './reference/render';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(packageDir, 'docs', 'reference');

function existingPages(): string[] {
  if (!existsSync(outputDir)) return [];

  const walk = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) return walk(path);

      return entry.name.endsWith('.md') ? [relative(outputDir, path)] : [];
    });

  return walk(outputDir).sort();
}

function main(): void {
  const check = process.argv.includes('--check');
  const reference = loadProgram(packageDir);
  const pages = renderPages(reference, buildModel(reference));
  const existing = existingPages();

  if (check) {
    const stale = [...pages.keys()].filter((path) => {
      const file = join(outputDir, path);

      return !existsSync(file) || readFileSync(file, 'utf8') !== pages.get(path);
    });
    const extra = existing.filter((path) => !pages.has(path));
    const problems = [...stale.map((path) => `stale: ${path}`), ...extra.map((path) => `extra: ${path}`)].sort();

    if (problems.length > 0) {
      console.error(`The committed reference differs from the sources. Run \`pnpm -F @videojs/spf docs:reference\`.`);

      for (const problem of problems) console.error(`  ${problem}`);

      process.exit(1);
    }

    console.log(`${pages.size} reference pages are current.`);
    return;
  }

  for (const [path, content] of pages) {
    const file = join(outputDir, path);

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }

  for (const path of existing) {
    if (!pages.has(path)) rmSync(join(outputDir, path));
  }

  console.log(`Wrote ${pages.size} reference pages to ${relative(process.cwd(), outputDir) || '.'}.`);
}

main();
