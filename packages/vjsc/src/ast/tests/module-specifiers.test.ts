import { describe, expect, it } from 'vite-plus/test';

import { analyzeImports, analyzeModule, replaceImportSpecifiers } from '../module-specifiers';

describe('analyzeImports', () => {
  it('classifies authored module references and preserves their source ranges', () => {
    const source = `
import value from "static";
import type { Model } from './model';
import { type Props, render } from './mixed';
export type { Result } from './result';
export { helper } from './helper';
export const lazy = import(\`./lazy\`);
export type Context = import('./context').Context;
`;

    const references = analyzeImports(source, 'source.ts');

    expect(references.map(({ specifier, kind, quote }) => ({ specifier, kind, quote }))).toEqual([
      { specifier: 'static', kind: 'static', quote: '"' },
      { specifier: './model', kind: 'type', quote: "'" },
      { specifier: './mixed', kind: 'static', quote: "'" },
      { specifier: './result', kind: 'type', quote: "'" },
      { specifier: './helper', kind: 'static', quote: "'" },
      { specifier: './lazy', kind: 'dynamic', quote: '`' },
      { specifier: './context', kind: 'type', quote: "'" },
    ]);

    for (const reference of references) {
      expect(source.slice(reference.start + 1, reference.end - 1)).toBe(reference.specifier);
    }
  });

  it('records the value bindings of import declarations', () => {
    const references = analyzeImports(
      `
import value from "static";
import * as everything from './all';
import { type Props, render as paint, "string name" as named } from './mixed';
import './effect';
export { helper } from './helper';
`,
      'source.ts'
    );

    expect(references.map(({ specifier, bindings }) => ({ specifier, bindings }))).toEqual([
      { specifier: 'static', bindings: [{ imported: 'default', local: 'value' }] },
      { specifier: './all', bindings: [{ imported: '*', local: 'everything' }] },
      {
        specifier: './mixed',
        bindings: [
          { imported: 'render', local: 'paint' },
          { imported: 'string name', local: 'named' },
        ],
      },
      { specifier: './effect', bindings: [] },
      { specifier: './helper', bindings: [] },
    ]);
  });
});

describe('replaceImportSpecifiers', () => {
  it('changes only selected specifiers without formatting source', () => {
    const source = `import value from './value';\nconst lazy = import("./lazy");\n`;
    const [value, lazy] = analyzeImports(source, 'source.ts');
    const output = replaceImportSpecifiers(source, [
      { ...value!, replacement: '@/value' },
      { ...lazy!, replacement: './installed/lazy' },
    ]);

    expect(output).toBe(`import value from '@/value';\nconst lazy = import("./installed/lazy");\n`);
  });
});

describe('analyzeModule', () => {
  it('lists runtime export names and skips type-only exports', () => {
    const { exports } = analyzeModule(
      `
        export const { a, b: [c] } = value, d = 1;
        export function Play() {}
        export class Player {}
        export enum Mode { A }
        export type Props = {};
        export interface Options {}
        export { e as f, type G } from './other';
        export * as H from './namespace';
        export * from './all';
        export default Play;
      `,
      'module.tsx'
    );

    expect(exports).toEqual(['a', 'c', 'd', 'Play', 'Player', 'Mode', 'f', 'H', 'default']);
  });

  it('names the module in parse errors', () => {
    expect(() => analyzeModule('export const = ;', 'broken.ts')).toThrow('Cannot analyze `broken.ts`');
  });
});
