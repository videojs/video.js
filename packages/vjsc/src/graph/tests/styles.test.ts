import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { bundleStyles } from '../styles';
import type { Graph, GraphModule } from '../types';

describe('bundleStyles', () => {
  it('emits dependency styles before the modules that compose them', async () => {
    const child = fixtureModule('child', ['virtual:vjsc/css/2/child.css']);
    const root = fixtureModule('root', ['virtual:vjsc/css/1/root.css'], [child.id]);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [root.id, root],
        [child.id, child],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/1/root.css', '.root { color: red; }'],
        ['virtual:vjsc/css/2/child.css', '.child { color: blue; }'],
      ]),
    };

    const css = await bundleStyles(graph, [root, child], { label: 'test' });

    expect(css.indexOf('.child')).toBeGreaterThanOrEqual(0);
    expect(css.indexOf('.child')).toBeLessThan(css.indexOf('.root'));
  });

  it('rejects one semantic class compiled differently by two modules in the same bundle', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/1/buttons.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/2/buttons.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/1/buttons.css', '@layer components { .media-button { color: red; } }'],
        ['virtual:vjsc/css/2/buttons.css', '@layer components { .media-button { color: blue; } }'],
      ]),
    };

    await expect(bundleStyles(graph, [first, second], { label: 'test' })).rejects.toThrow(
      /defines `\.media-button` with different declarations in `first\.tsx` and `second\.tsx`/
    );
  });

  it('lets authored files restyle classes that generated assets define', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vjsc-bundle-'));
    const module = fixtureModule('root', ['virtual:vjsc/css/1/buttons.css']);
    const graph: Graph = {
      root,
      modules: new Map([[module.id, module]]),
      assets: new Map([['virtual:vjsc/css/1/buttons.css', '.media-button { color: red; }']]),
    };

    await writeFile(join(root, 'base.css'), '.media-button { margin: 0; }\n');

    const css = await bundleStyles(graph, [module], { label: 'test', files: ['./base.css'] });

    expect(css).toContain('margin: 0');
    expect(css).toContain('color: red');
  });

  it('keeps `@scope` unless asked to flatten it into `:where()` selectors', async () => {
    const module = fixtureModule('root', ['virtual:vjsc/css/1/buttons.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([[module.id, module]]),
      assets: new Map([['virtual:vjsc/css/1/buttons.css', '@scope (.media-skin) { .media-button { color: red; } }']]),
    };

    const scoped = await bundleStyles(graph, [module], { label: 'test' });
    const flattened = await bundleStyles(graph, [module], { label: 'test', flattenScopes: true });

    expect(scoped).toContain('@scope (.media-skin)');
    expect(flattened).not.toContain('@scope');
    expect(flattened).toContain(':where(.media-skin) .media-button');
  });

  it('ignores imports outside the bundled module set', async () => {
    const root = fixtureModule('root', ['virtual:vjsc/css/1/root.css'], ['missing']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([[root.id, root]]),
      assets: new Map([['virtual:vjsc/css/1/root.css', '.root { color: red; }']]),
    };

    await expect(bundleStyles(graph, [root], { label: 'test' })).resolves.toContain('.root');
  });
});

function fixtureModule(id: string, assets: readonly string[], dependencies: readonly string[] = []): GraphModule {
  return {
    id,
    filename: `/project/${id}.tsx`,
    sourcePath: `${id}.tsx`,
    params: {},
    source: '',
    imports: dependencies.map((resolvedId) => ({
      specifier: `./${resolvedId}`,
      kind: 'static',
      start: 0,
      end: 0,
      quote: "'",
      bindings: [],
      resolvedId,
    })),
    styles: { files: [], assets },
  };
}
