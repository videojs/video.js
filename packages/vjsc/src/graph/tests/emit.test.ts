import { describe, expect, it } from 'vite-plus/test';

import { createClosureKeys } from '../closure';
import { emitModules } from '../emit';
import { fixtureGraph, rootName, roots } from './helpers/graph';

describe('emitModules', () => {
  it('shares a module every root compiles identically and places the rest per root', () => {
    const graph = fixtureGraph();
    const output = emitModules(graph, {
      roots: roots(graph),
      place: ({ module, root, shared }) =>
        shared ? `shared/${module.sourcePath}` : `${rootName(root)}/${module.sourcePath}`,
    });

    expect([...output.keys()]).toEqual([
      'a/label.tsx',
      'a/skin-a/root.tsx',
      'b/label.tsx',
      'b/skin-b/root.tsx',
      'shared/button.tsx',
      'shared/icon.tsx',
    ]);
    expect(output.get('a/skin-a/root.tsx')).toContain(`from '../../shared/button'`);
    expect(output.get('a/label.tsx')).toContain(`export const Label = 'a';`);
  });

  it('keeps a module local when something it imports differs between roots', () => {
    const graph = fixtureGraph({ iconSource: (root) => `export const Icon = '${root}';` });
    const output = emitModules(graph, {
      roots: roots(graph),
      place: ({ module, root, shared }) =>
        shared ? `shared/${module.sourcePath}` : `${rootName(root)}/${module.sourcePath}`,
    });

    expect([...output.keys()]).not.toContain('shared/button.tsx');
    expect(output.get('b/button.tsx')).toContain(`from './icon'`);
  });

  it('rejects two different modules placed at one path', () => {
    const graph = fixtureGraph();

    expect(() => emitModules(graph, { roots: roots(graph), place: ({ module }) => module.sourcePath })).toThrow(
      /would emit two different modules to `label\.tsx`/
    );
  });

  it('lets the caller remap specifiers and rewrite each output', () => {
    const graph = fixtureGraph();
    const output = emitModules(graph, {
      roots: roots(graph),
      place: ({ module, root }) => `${rootName(root)}/${module.sourcePath}`,
      resolveImport: ({ reference }) => (reference.specifier === 'react' ? 'preact/compat' : undefined),
      transform: (source) => `// generated\n${source}`,
    });

    expect(output.get('a/button.tsx')).toMatch(/^\/\/ generated\n/);
    expect(output.get('a/button.tsx')).toContain(`from 'preact/compat'`);
  });
});

describe('createClosureKeys', () => {
  it('distinguishes compiled styles only when asked', () => {
    const graph = fixtureGraph();
    const button = (root: string) =>
      [...graph.modules.values()].find((module) => module.id === `/src/button.tsx?root=${root}`)!;
    const withStyles = createClosureKeys(graph, { styles: true });
    const withoutStyles = createClosureKeys(graph);

    expect(withoutStyles(button('a'))).toBe(withoutStyles(button('b')));
    expect(withStyles(button('a'))).not.toBe(withStyles(button('b')));
  });
});
