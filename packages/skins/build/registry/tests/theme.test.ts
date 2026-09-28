import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { isPlainObject, isString } from '@videojs/utils/predicate';
import { describe, expect, it } from 'vite-plus/test';
import { type DesignSystem, loadDesignSystem } from 'vjsc/graph';

const packageDir = resolve(import.meta.dirname, '../../..');
const registryDir = resolve(packageDir, 'dist/registry/source/r/react');
const compilerEntry = resolve(packageDir, 'src/styles/tailwind.compiler.css');
const sharedSource = readFileSync(resolve(packageDir, 'src/styles/tailwind.css'), 'utf8');

interface ThemeItem {
  readonly cssVars?: { readonly theme?: Readonly<Record<string, string>> } | undefined;
  readonly css?: Readonly<Record<string, unknown>> | undefined;
}

describe('registry Tailwind theme', () => {
  const theme = readThemeItem();
  const exported = Object.keys(theme.css ?? {});

  it('exports every utility and custom variant declared in the shared Tailwind source', () => {
    const declared = [...sharedSource.matchAll(/@(utility|custom-variant)\s+([^\s{(;]+)/g)].map(
      ([, rule, name]) => `@${rule} ${name}`
    );

    expect(declared.length).toBeGreaterThan(5);
    expect(exported).toEqual(expect.arrayContaining(declared));
  });

  it('compiles every shipped Tailwind class with only the exported theme', async () => {
    const full = await loadDesignSystem(compilerEntry);
    const consumerEntry = writeConsumerEntry(theme);
    const consumer = await loadDesignSystem(consumerEntry);

    rmSync(dirname(consumerEntry), { recursive: true, force: true });
    const candidates = shippedCandidates(full);
    const unsupported = candidates.filter((candidate) => !consumer.recognizesCandidate(candidate));

    expect(candidates.length).toBeGreaterThan(100);
    expect(unsupported).toEqual([]);
  }, 60_000);
});

function readThemeItem(): ThemeItem {
  const registry: unknown = JSON.parse(readFileSync(resolve(registryDir, 'support/registry.json'), 'utf8'));
  const items = isPlainObject(registry) && Array.isArray(registry.items) ? registry.items : [];
  const theme = items.find((item): item is ThemeItem => isPlainObject(item) && item.name === '_style-theme');
  if (!theme) throw new Error('The registry has no `_style-theme` item. Run the skins generate task first.');

  return theme;
}

/** Recreate the stylesheet a Shadcn consumer receives: Tailwind plus the exported theme variables and css rules. */
function writeConsumerEntry(theme: ThemeItem): string {
  const variables = Object.entries(theme.cssVars?.theme ?? {}).map(([name, value]) => `  --${name}: ${value};`);
  const source = [
    '@import "tailwindcss";',
    `@theme inline {\n${variables.join('\n')}\n}`,
    renderCss(theme.css ?? {}),
    '',
  ].join('\n\n');
  const directory = mkdtempSync(resolve(packageDir, 'dist/registry-theme-test-'));
  const path = join(directory, 'consumer.css');

  writeFileSync(path, source);
  return path;
}

function renderCss(entries: Readonly<Record<string, unknown>>, indent = ''): string {
  return Object.entries(entries)
    .map(([key, value]) => {
      if (isString(value)) return `${indent}${key}: ${value};`;

      if (!isPlainObject(value)) throw new Error(`Unsupported registry css value for \`${key}\`.`);

      if (Object.keys(value).length === 0) return `${indent}${key};`;

      return `${indent}${key} {\n${renderCss(value, `${indent}  `)}\n${indent}}`;
    })
    .join('\n');
}

/** Collect every string token in the shipped Tailwind sources that the full design system recognizes as a class. */
function shippedCandidates(design: DesignSystem): string[] {
  const candidates = new Set<string>();

  for (const group of ['skins', 'ui']) {
    const root = resolve(registryDir, group, 'files');

    for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.tsx')) continue;

      const source = readFileSync(resolve(entry.parentPath, entry.name), 'utf8');

      for (const [, , literal] of source.matchAll(/(["'])((?:\\.|(?!\1)[^\\])*)\1/g)) {
        for (const token of literal!.split(/\s+/)) {
          if (token && design.recognizesCandidate(token)) candidates.add(token);
        }
      }
    }
  }

  return [...candidates].sort();
}
