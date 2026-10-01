/**
 * Module-graph helpers for the built CDN output.
 *
 * Shared by `check-cdn-self-contained.ts` and `build-dist-archive.ts` so the definition of "reachable from an entry"
 * stays identical between the guard and the archive it guards.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/** Static `import`/`export … from`, and dynamic `import()`, specifiers. */
const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g;

/**
 * JSDoc blocks, dropped before the scan.
 *
 * Their `{import('…')}` type annotations are indistinguishable from dynamic imports, and the modules they name are
 * types that no bundle ever loads — third-party dev bundles are full of them. Minified production bundles carry no
 * JSDoc, so nothing real is hidden by this.
 */
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;

/**
 * Drop matches that cannot be module specifiers.
 *
 * The scan is a regex rather than a parser, so it also sees the words `from` and `import` inside prose — JSDoc retained
 * in dev bundles, and template literals such as `` `… from "${type}"` ``. Real specifiers emitted by the bundler are
 * plain paths, so anything carrying whitespace or template syntax is prose.
 */
function isLikelySpecifier(value: string): boolean {
  return value.length > 0 && !/[\s{}$`]/.test(value);
}

export function collectSpecifiers(code: string): string[] {
  return [...code.replace(JSDOC_BLOCK, '').matchAll(SPECIFIER)]
    .map((match) => match[1] as string)
    .filter(isLikelySpecifier);
}

function isAbsoluteSpecifier(specifier: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(specifier);
}

function isOutsideDirectory(dir: string, path: string): boolean {
  const file = relative(dir, path);

  return file === '..' || file.startsWith(`..${sep}`) || isAbsolute(file);
}

/**
 * Every file reachable from `roots` by following relative specifiers, as paths relative to `dir`.
 *
 * The CDN build emits plain ES modules with no `import.meta.url` asset references, workers, or non-JavaScript files, so
 * the static import graph is the complete set of files an entry needs.
 */
export function resolveClosure(dir: string, roots: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];

  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;

    const path = resolve(dir, file);
    if (isOutsideDirectory(dir, path)) throw new Error(`Expected bundle resolves outside the build: ${file}`);

    if (!existsSync(path)) throw new Error(`Expected bundle is missing from the build: ${file}`);

    seen.add(file);

    for (const specifier of collectSpecifiers(readFileSync(path, 'utf8'))) {
      if (!specifier.startsWith('.')) continue;

      queue.push(relative(dir, resolve(dirname(path), specifier)));
    }
  }

  return seen;
}

/**
 * Report specifiers that would break a copy of `dir` served from an arbitrary origin: anything absolute, bare, or
 * resolving outside the directory.
 */
export function findUnresolvableSpecifiers(dir: string, files: Iterable<string>): string[] {
  const problems: string[] = [];

  for (const file of files) {
    const path = resolve(dir, file);

    for (const specifier of collectSpecifiers(readFileSync(path, 'utf8'))) {
      if (isAbsoluteSpecifier(specifier)) {
        problems.push(`${file}: absolute specifier "${specifier}"`);
        continue;
      }

      // A bare specifier has no importer to resolve it in the browser.
      if (!specifier.startsWith('.')) {
        problems.push(`${file}: bare specifier "${specifier}"`);
        continue;
      }

      const target = resolve(dirname(path), specifier);

      if (isOutsideDirectory(dir, target) || !existsSync(target)) {
        problems.push(`${file}: "${specifier}" resolves outside the build (${relative(dir, target)})`);
      }
    }
  }

  return problems;
}
