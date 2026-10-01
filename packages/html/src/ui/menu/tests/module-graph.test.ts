/// <reference types="node" />

import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const menuDirectory = resolve(dirname(new URL(import.meta.url).pathname), '..');
const sourceDirectory = resolve(menuDirectory, '../..');
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;

function collectImportSpecifiers(source: string): string[] {
  return [...source.matchAll(importPattern)].flatMap((match) => (match[1] ? [match[1]] : []));
}

function resolveImport(importer: string, specifier: string): string | null {
  const base = resolve(dirname(importer), specifier);

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, resolve(base, 'index.ts'), resolve(base, 'index.tsx')]) {
    if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
  }

  return null;
}

function collectMenuGraph(entry: string): string[] {
  const graph = new Set<string>();
  const visited = new Set<string>();
  const pending = [entry];

  while (pending.length > 0) {
    const module = pending.pop();
    if (!module || visited.has(module)) continue;

    visited.add(module);

    graph.add(module);
    const source = readFileSync(module, 'utf8');

    for (const specifier of collectImportSpecifiers(source)) {
      graph.add(`${module} -> ${specifier}`);

      if (!specifier.startsWith('.')) continue;

      const dependency = resolveImport(module, specifier);
      if (!dependency) continue;

      graph.add(dependency);

      if (dependency.startsWith(sourceDirectory)) pending.push(dependency);
    }
  }

  return [...graph];
}

function forbiddenImports(graph: string[]): string[] {
  return graph.filter((module) => /(?:setting|[\\/]i18n(?:[\\/]|$))/.test(module));
}

describe('collectMenuGraph', () => {
  it.each(['@videojs/core/i18n', '@videojs/core/i18n/text/menu', './i18n/translate'])(
    'finds forbidden descendant imports through directory entries and cycles: %s',
    (specifier) => {
      const fixture = mkdtempSync(resolve(menuDirectory, 'tests/.module-graph-'));

      try {
        mkdirSync(resolve(fixture, 'child'));
        mkdirSync(resolve(fixture, 'i18n'));
        writeFileSync(resolve(fixture, 'entry.ts'), "export * from './child';");
        writeFileSync(resolve(fixture, 'child/index.ts'), "export * from '../leaf';");
        writeFileSync(resolve(fixture, 'leaf.ts'), `import '${specifier}'; export * from './entry';`);
        writeFileSync(resolve(fixture, 'i18n/translate.ts'), 'export const translate = true;');

        const graph = collectMenuGraph(resolve(fixture, 'entry.ts'));

        expect(graph).toContain(`${resolve(fixture, 'leaf.ts')} -> ${specifier}`);
        expect(forbiddenImports(graph)).toContain(`${resolve(fixture, 'leaf.ts')} -> ${specifier}`);
        expect(graph.filter((module) => module === resolve(fixture, 'entry.ts'))).toHaveLength(1);
      } finally {
        rmSync(fixture, { recursive: true, force: true });
      }
    }
  );

  it('does not depend on settings or i18n modules', () => {
    const graph = collectMenuGraph(resolve(menuDirectory, '../../define/ui/menu.ts'));

    expect(forbiddenImports(graph)).toEqual([]);
  });
});
