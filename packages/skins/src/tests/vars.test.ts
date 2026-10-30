import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vite-plus/test';

import { vars } from '../styles/vars';

describe('vars', () => {
  test('classifies every VJSC --media-* custom property', async () => {
    const root = resolve(import.meta.dirname, '..');
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    const files = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(?:css|ts|tsx)$/.test(entry.name) &&
          entry.name !== 'vars.ts' &&
          !entry.name.includes('.generated.') &&
          !entry.parentPath.includes('/src/tests')
      )
      .map((entry) => resolve(entry.parentPath, entry.name));
    const referenced = new Set<string>();

    for (const file of files) {
      const source = await readFile(file, 'utf8');

      for (const match of source.matchAll(/--media-[a-zA-Z0-9_-]+/g)) referenced.add(match[0]);
    }

    expect([...referenced].sort()).toEqual(Object.keys(vars).sort());
  });

  test('declares every internal token the shared theme keys alias', async () => {
    const stylesRoot = resolve(import.meta.dirname, '../styles');
    const source = await readFile(resolve(stylesRoot, 'tailwind.css'), 'utf8');
    const themeBlock = /@theme inline \{([\s\S]*?)\n\}/.exec(source)?.[1] ?? '';
    const themeFiles = (await readdir(resolve(stylesRoot, 'themes'))).filter((name) => name.endsWith('.css'));
    const kinds = new Map(Object.entries(vars).map(([name, variable]) => [name, variable.kind]));
    const declared = new Set<string>();

    for (const name of themeFiles) {
      const theme = await readFile(resolve(stylesRoot, 'themes', name), 'utf8');

      for (const match of theme.matchAll(/(--media-[a-zA-Z0-9_-]+):/g)) declared.add(match[1]!);
    }

    // Aliases with a fallback stay valid without a declaration, so only bare `var()` references count.
    const aliased = [...themeBlock.matchAll(/var\((--media-[a-zA-Z0-9_-]+)\)/g)].map(([, name]) => name!);
    const missing = aliased.filter((name) => kinds.get(name) === 'internal' && !declared.has(name));

    expect(aliased.length).toBeGreaterThan(20);
    expect([...new Set(missing)]).toEqual([]);
  });

  test('reserves the media prefix for classified contracts', async () => {
    const stylesRoot = resolve(import.meta.dirname, '../styles');
    const entries = await readdir(stylesRoot, { recursive: true, withFileTypes: true });
    const files = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(?:css|ts)$/.test(entry.name) &&
          entry.name !== 'vars.ts' &&
          !entry.name.includes('.generated.')
      )
      .map((entry) => resolve(entry.parentPath, entry.name));
    const customProperties = new Set<string>();

    for (const file of files) {
      const source = await readFile(file, 'utf8');

      for (const match of source.matchAll(/(?<![a-zA-Z0-9_-])--[a-zA-Z0-9_-]+/g)) customProperties.add(match[0]);
    }

    const unprefixed = [...customProperties].filter(
      (property) =>
        !property.startsWith('--media-') &&
        property !== '--spacing' &&
        // Tailwind functional utilities read their argument through `--value()`.
        property !== '--value' &&
        !/^--(?:backdrop-filter|blur|color|container|delay|drop-shadow|duration|ease|filter|font|radius|scale|shadow|spacing|text|text-shadow)-media(?:-|$)/.test(
          property
        )
    );

    expect(unprefixed).toEqual([]);
    expect([...customProperties].filter((property) => property.startsWith('--media-resolved-'))).toEqual([]);
    expect(new Set(Object.values(vars).map((variable) => variable.kind))).toEqual(
      new Set(['public', 'runtime', 'internal'])
    );
    expect(vars['--media-video-border-radius'].kind).toBe('runtime');
  });
});
