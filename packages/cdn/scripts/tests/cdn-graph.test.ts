import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { collectModuleReferences, findUnresolvableSpecifiers, resolveClosure } from '../cdn-graph.ts';

describe('collectModuleReferences', () => {
  it('collects static and dynamic specifiers', () => {
    const code = [
      'import { a } from "./chunk-a.js";',
      "export { b } from './chunk-b.js';",
      'export * from "./chunk-c.js";',
      'const d = await import("./chunk-d.js");',
    ].join('\n');

    expect(collectModuleReferences('entry.js', code)).toEqual({
      specifiers: ['./chunk-a.js', './chunk-b.js', './chunk-c.js', './chunk-d.js'],
      computedImports: [],
    });
  });

  it('collects dynamic imports written as template literals', () => {
    const code = 'const l={zh:()=>import(`./zh-1P3ErJe9.js`)};';

    expect(collectModuleReferences('i18n.js', code).specifiers).toEqual(['./zh-1P3ErJe9.js']);
  });

  it('reports dynamic imports with a computed specifier', () => {
    const code = 'const 名 = "zh"; const a = import(`./${名}.js`); const b = import(url);';

    expect(collectModuleReferences('entry.js', code)).toEqual({
      specifiers: [],
      computedImports: ['import(`./${名}.js`)', 'import(url)'],
    });
  });

  it('ignores specifier-like text in comments and strings', () => {
    const code = [
      "/** @typedef {import('./player.types').PlayerControls} PlayerControls */",
      '// Re-exported from "the store package"',
      'throw new Error(`DRM: Server certificate applied successfully from `+n.urlUsed+r+` for `);',
      'const message = `imported from "${name}"`;',
    ].join('\n');

    expect(collectModuleReferences('entry.js', code)).toEqual({ specifiers: [], computedImports: [] });
  });

  it('throws on code it cannot parse', () => {
    expect(() => collectModuleReferences('broken.js', 'import {')).toThrow('Could not parse broken.js');
  });
});

describe('resolveClosure', () => {
  let cdn: string;

  beforeEach(() => {
    cdn = mkdtempSync(join(import.meta.dirname, 'cdn-graph-'));
  });

  afterEach(() => {
    rmSync(cdn, { recursive: true, force: true });
  });

  it('follows dynamic imports written as template literals', () => {
    writeFileSync(join(cdn, 'i18n.js'), 'import "./shared.js"; const zh = () => import(`./zh.js`);');
    writeFileSync(join(cdn, 'shared.js'), 'export const value = 1;');
    writeFileSync(join(cdn, 'zh.js'), 'export default {};');

    expect([...resolveClosure(cdn, ['i18n.js'])].sort()).toEqual(['i18n.js', 'shared.js', 'zh.js']);
  });
});

describe('findUnresolvableSpecifiers', () => {
  let scratch: string;
  let cdn: string;

  beforeEach(() => {
    scratch = mkdtempSync(join(import.meta.dirname, 'cdn-graph-'));
    cdn = join(scratch, 'cdn');
    mkdirSync(cdn);
  });

  afterEach(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('rejects existing imports outside the CDN directory', () => {
    writeFileSync(join(cdn, 'entry.js'), 'import "../outside.js";');
    writeFileSync(join(scratch, 'outside.js'), 'export const value = 1;');

    expect
      .soft(findUnresolvableSpecifiers(cdn, ['entry.js']))
      .toEqual(['entry.js: "../outside.js" resolves outside the build (../outside.js)']);
    expect.soft(() => resolveClosure(cdn, ['entry.js'])).toThrow('outside the build');
  });

  it('rejects a missing chunk reached only by a dynamic import', () => {
    writeFileSync(join(cdn, 'i18n.js'), 'const zh = () => import(`./zh-1P3ErJe9.js`);');

    expect(findUnresolvableSpecifiers(cdn, ['i18n.js'])).toEqual([
      'i18n.js: "./zh-1P3ErJe9.js" is missing from the build (zh-1P3ErJe9.js)',
    ]);
  });

  it('rejects absolute and bare dynamic imports', () => {
    writeFileSync(join(cdn, 'entry.js'), 'import(`https://cdn.example.com/a.js`); import(`hls.js`);');

    expect(findUnresolvableSpecifiers(cdn, ['entry.js'])).toEqual([
      'entry.js: absolute specifier "https://cdn.example.com/a.js"',
      'entry.js: bare specifier "hls.js"',
    ]);
  });

  it('rejects computed dynamic imports unless the bundle is allowed', () => {
    writeFileSync(join(cdn, 'entry.js'), 'const load = (name) => import(`./${name}.js`);');

    expect
      .soft(findUnresolvableSpecifiers(cdn, ['entry.js'], new Set()))
      .toEqual(['entry.js: computed specifier in import(`./${name}.js`)']);
    expect.soft(findUnresolvableSpecifiers(cdn, ['entry.js'], new Set(['entry.js']))).toEqual([]);
  });
});
