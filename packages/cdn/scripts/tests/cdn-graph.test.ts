import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { collectSpecifiers, findUnresolvableSpecifiers, resolveClosure } from '../cdn-graph.ts';

describe('collectSpecifiers', () => {
  it('collects static and dynamic specifiers', () => {
    const code = [
      'import { a } from "./chunk-a.js";',
      'export { b } from "./chunk-b.js";',
      'const c = await import("./chunk-c.js");',
    ].join('\n');

    expect(collectSpecifiers(code)).toEqual(['./chunk-a.js', './chunk-b.js', './chunk-c.js']);
  });

  it('collects dynamic imports quoted with backticks', () => {
    const code = 'const zh = () => import(`./zh-1P3ErJe9.js`);\nconst vtt = await import(`./parse-vtt-DHGCo33d.js`);';

    expect(collectSpecifiers(code)).toEqual(['./zh-1P3ErJe9.js', './parse-vtt-DHGCo33d.js']);
  });

  it('ignores type imports in JSDoc without hiding the code around them', () => {
    const code = [
      'import { a } from "./chunk-a.js";',
      "/** @typedef {import('./player.types').PlayerControls} PlayerControls */",
      "/** @typedef {import('timing-object').ITimingObject} TimingObject */",
      'const b = await import("./chunk-b.js");',
    ].join('\n');

    expect(collectSpecifiers(code)).toEqual(['./chunk-a.js', './chunk-b.js']);
  });

  it('ignores prose that reads like a specifier', () => {
    expect(collectSpecifiers('// Re-exported from "the store package"')).toEqual([]);
    expect(collectSpecifiers('throw new Error(`imported from "${name}"`)')).toEqual([]);
    expect(collectSpecifiers('const path = import(`./locales/${lang}.js`);')).toEqual([]);
    expect(collectSpecifiers('M.info(`Server certificate applied from `+n.urlUsed+r+` for `+t+`.`)')).toEqual([]);
  });
});

describe('resolveClosure', () => {
  it('follows dynamic imports quoted with backticks', () => {
    const scratch = mkdtempSync(join(import.meta.dirname, 'cdn-graph-'));

    try {
      writeFileSync(join(scratch, 'entry.js'), 'import "./i18n.js";');
      writeFileSync(join(scratch, 'i18n.js'), 'export const zh = () => import(`./zh.js`);');
      writeFileSync(join(scratch, 'zh.js'), 'export default {};');

      expect([...resolveClosure(scratch, ['entry.js'])].sort()).toEqual(['entry.js', 'i18n.js', 'zh.js']);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});

describe('findUnresolvableSpecifiers', () => {
  it('rejects existing imports outside the CDN directory', () => {
    const scratch = mkdtempSync(join(import.meta.dirname, 'cdn-graph-'));

    try {
      const cdn = join(scratch, 'cdn');

      mkdirSync(cdn);
      writeFileSync(join(cdn, 'entry.js'), 'import "../outside.js";');
      writeFileSync(join(scratch, 'outside.js'), 'export const value = 1;');

      expect
        .soft(findUnresolvableSpecifiers(cdn, ['entry.js']))
        .toEqual(['entry.js: "../outside.js" resolves outside the build (../outside.js)']);
      expect.soft(() => resolveClosure(cdn, ['entry.js'])).toThrow('outside the build');
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});
