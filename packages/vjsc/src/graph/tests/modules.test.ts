import { describe, expect, it } from 'vite-plus/test';

import { collectModules, relativeImport, rewriteImports, stripStyleImports, traverseModules } from '../modules';
import { fixtureGraph, roots } from './helpers/graph';

describe('traverseModules', () => {
  it('visits each reachable module once, before or after its dependencies', () => {
    const graph = fixtureGraph();
    const [root] = roots(graph);
    const paths = (order: 'pre' | 'post') =>
      traverseModules(graph.modules, [root!, root!], { order }).map((module) => module.sourcePath);

    expect(paths('pre')).toEqual(['skin-a/root.tsx', 'button.tsx', 'icon.tsx', 'label.tsx']);
    expect(paths('post')).toEqual(['icon.tsx', 'button.tsx', 'label.tsx', 'skin-a/root.tsx']);
  });

  it('follows only the dependencies the caller accepts', () => {
    const graph = fixtureGraph();
    const modules = traverseModules(graph.modules, roots(graph).slice(0, 1), {
      follow: (dependency) => dependency.sourcePath !== 'button.tsx',
    });

    expect(modules.map((module) => module.sourcePath)).toEqual(['skin-a/root.tsx', 'label.tsx']);
  });
});

describe('collectModules', () => {
  it('collects a root and its closure, and rejects a root the graph lacks', () => {
    const graph = fixtureGraph();

    expect(collectModules(graph, '/src/skin-b/root.tsx?root=b')).toHaveLength(4);
    expect(() => collectModules(graph, '/src/missing.tsx')).toThrow('VJSC graph root module is missing');
  });
});

describe('rewriteImports', () => {
  it('replaces the captured specifiers the resolver maps, keeping the quotes', () => {
    const graph = fixtureGraph();
    const button = graph.modules.get('/src/button.tsx?root=a')!;
    const rewritten = rewriteImports(graph, button, ({ dependency, reference }) =>
      dependency ? `./shared/${dependency.sourcePath.replace(/\.tsx$/, '')}` : reference.specifier
    );

    expect(rewritten).toContain(`import { Icon } from './shared/icon';`);
    expect(rewritten).toContain(`import { h } from 'react';`);
  });
});

describe('relativeImport', () => {
  it('builds extensionless relative specifiers between generated paths', () => {
    expect(relativeImport('skins/video/skin.tsx', 'skins/video/controls.tsx')).toBe('./controls');
    expect(relativeImport('skins/video/skin.tsx', 'components/button.tsx')).toBe('../../components/button');
  });
});

describe('stripStyleImports', () => {
  it('removes generated stylesheet imports and nothing else', () => {
    const source = [
      `import 'virtual:vjsc/css/asset/000000000000/button.css';`,
      `import './authored.css';`,
      ``,
      ``,
      `export const a = 1;`,
    ].join('\n');

    expect(stripStyleImports(source)).toBe(`import './authored.css';\n\nexport const a = 1;`);
  });
});
