import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const SRC_DIR = resolve(import.meta.dirname, '..');

// Generated skins are private and only reachable through the preset skin modules, which declare the boundary.
const modules = globSync('**/*.{ts,tsx}', {
  cwd: SRC_DIR,
  exclude: ['internal/skins/**', 'testing/**', '**/tests/**', '**/*.test.*', '**/*.d.ts'],
}).map((path) => ({ path, source: readFileSync(resolve(SRC_DIR, path), 'utf8') }));

const LEADING_DIRECTIVE = /^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*\n))*\s*'use client';/;
const CLIENT_IMPORT = /^import\s+(?!type\s)[^;]*from '(?:react|@videojs\/store\/react)';/m;
const HOOK = /\buse[A-Z]\w*\(/;

function needsClientBoundary({ path, source }: { path: string; source: string }): boolean {
  return path.endsWith('.tsx') || CLIENT_IMPORT.test(source) || HOOK.test(source);
}

// A directive on a barrel turns every re-export — factories, predicates, constants — into a client reference, so
// Server Components cannot call them. Each component or hook module declares its own boundary instead.
describe('client boundaries', () => {
  it('keeps index barrels server-importable', () => {
    const barrels = modules.filter(({ path, source }) => path.endsWith('index.ts') && LEADING_DIRECTIVE.test(source));

    expect(barrels.map(({ path }) => path)).toEqual([]);
  });

  it("marks every component and hook module with 'use client'", () => {
    const unmarked = modules.filter((module) => needsClientBoundary(module) && !LEADING_DIRECTIVE.test(module.source));

    expect(unmarked.map(({ path }) => path)).toEqual([]);
  });
});
