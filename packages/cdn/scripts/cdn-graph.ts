/**
 * Module-graph helpers for the built CDN output.
 *
 * Shared by `check-cdn-self-contained.ts` and `build-dist-archive.ts` so the definition of "reachable from an entry"
 * stays identical between the guard and the archive it guards.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

import { type Expression, parseSync, Visitor } from 'oxc-parser';

/**
 * Bundles allowed to `import()` a specifier computed at runtime.
 *
 * Wistia's player library loads media data as scripts from Wistia's own servers, which an embed needs no matter where
 * the player is hosted.
 */
const COMPUTED_IMPORT_BUNDLES: ReadonlySet<string> = new Set(['media/wistia-video.js', 'media/wistia-video.dev.js']);

export interface ModuleReferences {
  /** Specifiers of `import`/`export … from` declarations and of `import()` calls with a constant specifier. */
  specifiers: string[];
  /** Source text of each `import()` call whose specifier is computed at runtime. */
  computedImports: string[];
}

function constantSpecifier(source: Expression): string | null {
  if (source.type === 'Literal') return String(source.value);

  // Minified output writes constant specifiers as template literals: import(`./chunk.js`).
  if (source.type === 'TemplateLiteral' && source.expressions.length === 0) {
    return source.quasis[0]?.value.cooked ?? null;
  }

  return null;
}

export function collectModuleReferences(file: string, code: string): ModuleReferences {
  const { program, errors } = parseSync(file, code, { lang: 'js', sourceType: 'module' });
  if (errors.length > 0) throw new Error(`Could not parse ${file}: ${errors[0]?.message}`);

  const specifiers: string[] = [];
  const computedImports: string[] = [];

  new Visitor({
    ImportDeclaration(node) {
      specifiers.push(node.source.value);
    },
    ExportAllDeclaration(node) {
      specifiers.push(node.source.value);
    },
    ExportNamedDeclaration(node) {
      if (node.source) specifiers.push(node.source.value);
    },
    ImportExpression(node) {
      const specifier = constantSpecifier(node.source);

      if (specifier === null) computedImports.push(code.slice(node.start, node.end));
      else specifiers.push(specifier);
    },
  }).visit(program);

  return { specifiers, computedImports };
}

function isAbsoluteSpecifier(specifier: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(specifier);
}

function isOutsideDirectory(dir: string, path: string): boolean {
  const file = relative(dir, path);

  return file === '..' || file.startsWith(`..${sep}`) || isAbsolute(file);
}

/**
 * Every file reachable from `roots` by following relative specifiers, static or dynamic, as paths relative to `dir`.
 *
 * The CDN build emits plain ES modules with no `import.meta.url` asset references, workers, or non-JavaScript files, so
 * the import graph is the complete set of files an entry needs. Computed `import()` specifiers cannot be followed;
 * `findUnresolvableSpecifiers` rejects them.
 */
export function resolveClosure(dir: string, roots: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];

  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined || seen.has(file)) continue;

    const path = resolve(dir, file);
    if (isOutsideDirectory(dir, path)) throw new Error(`Expected bundle resolves outside the build: ${file}`);

    if (!existsSync(path)) throw new Error(`Expected bundle is missing from the build: ${file}`);

    seen.add(file);

    for (const specifier of collectModuleReferences(file, readFileSync(path, 'utf8')).specifiers) {
      if (!specifier.startsWith('.')) continue;

      queue.push(relative(dir, resolve(dirname(path), specifier)));
    }
  }

  return seen;
}

/**
 * Report specifiers that would break a copy of `dir` served from an arbitrary origin: anything absolute, bare,
 * resolving outside the directory, or computed at runtime outside `computedImportBundles`.
 */
export function findUnresolvableSpecifiers(
  dir: string,
  files: Iterable<string>,
  computedImportBundles: ReadonlySet<string> = COMPUTED_IMPORT_BUNDLES
): string[] {
  const problems: string[] = [];

  for (const file of files) {
    const path = resolve(dir, file);
    const { specifiers, computedImports } = collectModuleReferences(file, readFileSync(path, 'utf8'));

    if (!computedImportBundles.has(file)) {
      for (const expression of computedImports) {
        problems.push(`${file}: computed specifier in ${expression.replace(/\s+/g, ' ')}`);
      }
    }

    for (const specifier of specifiers) {
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

      if (isOutsideDirectory(dir, target)) {
        problems.push(`${file}: "${specifier}" resolves outside the build (${relative(dir, target)})`);
      } else if (!existsSync(target)) {
        problems.push(`${file}: "${specifier}" is missing from the build (${relative(dir, target)})`);
      }
    }
  }

  return problems;
}
