import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { bundleStyles, styleFileOrder } from '../styles';
import type { Graph, GraphModule } from '../types';

describe('bundleStyles', () => {
  it('emits dependency styles before the modules that compose them', async () => {
    const child = fixtureModule('child', ['virtual:vjsc/css/asset/2/child.css']);
    const root = fixtureModule('root', ['virtual:vjsc/css/asset/1/root.css'], [child.id]);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [root.id, root],
        [child.id, child],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/root.css', '.root { color: red; }'],
        ['virtual:vjsc/css/asset/2/child.css', '.child { color: blue; }'],
      ]),
    };

    const css = await bundleStyles(graph, [root, child], { label: 'test' });

    expect(css.indexOf('.child')).toBeGreaterThanOrEqual(0);
    expect(css.indexOf('.child')).toBeLessThan(css.indexOf('.root'));
  });

  it('emits files in the cascade order modules agree on rather than module order', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/sliders.css']);
    const second = fixtureModule('second', [
      'virtual:vjsc/css/asset/2/popups.css',
      'virtual:vjsc/css/asset/3/sliders.css',
    ]);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/sliders.css', '.thumbnail { background: white; }'],
        ['virtual:vjsc/css/asset/2/popups.css', '.surface { background: black; }'],
        ['virtual:vjsc/css/asset/3/sliders.css', '.thumbnail { background: white; }'],
      ]),
    };

    const css = await bundleStyles(graph, [first, second], { label: 'test' });

    expect(css.indexOf('.surface')).toBeLessThan(css.indexOf('.thumbnail'));
    expect(styleFileOrder([first, second])).toEqual(['popups.css', 'sliders.css']);
  });

  it('rejects modules that disagree on the cascade order', () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/a.css', 'virtual:vjsc/css/asset/2/b.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/asset/3/b.css', 'virtual:vjsc/css/asset/4/a.css']);

    expect(() => styleFileOrder([first, second])).toThrow('disagree on the cascade order of `a.css`, `b.css`');
  });

  it('keeps equal nested rules that belong to different parents', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/a.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/asset/2/b.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/a.css', '.a { color: blue; &:hover { color: red; } }'],
        ['virtual:vjsc/css/asset/2/b.css', '.b { color: green; &:hover { color: red; } }'],
      ]),
    };

    const css = await bundleStyles(graph, [first, second], { label: 'test' });

    expect(css.match(/&:hover/g)).toHaveLength(2);
  });

  it('keeps parents whose nested rules differ and drops exact duplicate subtrees', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/a.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/asset/2/b.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/a.css', '.x { &:hover { color: red; } } .y { &:hover { color: red; } }'],
        ['virtual:vjsc/css/asset/2/b.css', '.x { &:focus { color: red; } } .y { &:hover { color: red; } }'],
      ]),
    };

    const css = await bundleStyles(graph, [first, second], { label: 'test' });

    expect(css).toContain('&:focus');
    expect(css.match(/\.y/g)).toHaveLength(1);
  });

  it('drops duplicates inside conditional blocks without leaving the blocks empty', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/a.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/asset/2/b.css']);
    const shared = '@layer components { @media (pointer: fine) { .x { color: red; } } }';
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/a.css', shared],
        ['virtual:vjsc/css/asset/2/b.css', `${shared} .z { color: blue; }`],
      ]),
    };

    const css = await bundleStyles(graph, [first, second], { label: 'test' });

    expect(css.match(/\.x/g)).toHaveLength(1);
    expect(css.match(/@media/g)).toHaveLength(1);
    expect(css).toContain('.z');
  });

  it('rejects one semantic class compiled differently by two modules in the same bundle', async () => {
    const first = fixtureModule('first', ['virtual:vjsc/css/asset/1/buttons.css']);
    const second = fixtureModule('second', ['virtual:vjsc/css/asset/2/buttons.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([
        [first.id, first],
        [second.id, second],
      ]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/buttons.css', '@layer components { .media-button { color: red; } }'],
        ['virtual:vjsc/css/asset/2/buttons.css', '@layer components { .media-button { color: blue; } }'],
      ]),
    };

    await expect(bundleStyles(graph, [first, second], { label: 'test' })).rejects.toThrow(
      /defines `\.media-button` with different declarations in `first\.tsx` and `second\.tsx`/
    );
  });

  it('lets authored files restyle classes that generated assets define', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vjsc-bundle-'));
    const module = fixtureModule('root', ['virtual:vjsc/css/asset/1/buttons.css']);
    const graph: Graph = {
      root,
      modules: new Map([[module.id, module]]),
      assets: new Map([['virtual:vjsc/css/asset/1/buttons.css', '.media-button { color: red; }']]),
    };

    await writeFile(join(root, 'base.css'), '.media-button { margin: 0; }\n');

    const css = await bundleStyles(graph, [module], { label: 'test', files: ['./base.css'] });

    expect(css).toContain('margin: 0');
    expect(css).toContain('color: red');
  });

  it('inlines local imports inside the blocks their conditions stand for', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vjsc-bundle-'));
    const graph: Graph = { root, modules: new Map(), assets: new Map() };

    await writeFile(
      join(root, 'base.css'),
      '@import "./tokens.css" layer(tokens);\n@import url("./wide.css") supports(display: grid) (min-width: 40em);\n'
    );
    await writeFile(join(root, 'tokens.css'), '.tokens { color: red; }\n');
    await writeFile(join(root, 'wide.css'), '.wide { color: blue; }\n');

    const css = await bundleStyles(graph, [], { label: 'test', files: ['./base.css'], includeAssets: false });

    expect(css).toMatch(/@layer tokens\s*\{\s*\.tokens\s*\{\s*color: red;?\s*\}\s*\}/);
    expect(css).toMatch(/@media \(width >= 40em\)\s*\{\s*@supports \(display: grid\)\s*\{\s*\.wide/);
    expect(css).not.toContain('@import');
  });

  it('rejects local imports that leave the graph root', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'vjsc-bundle-'));
    const root = join(parent, 'root');
    const graph: Graph = { root, modules: new Map(), assets: new Map() };

    await mkdir(root);
    await writeFile(join(root, 'base.css'), '@import "../outside.css" layer(x);\n');
    await writeFile(join(parent, 'outside.css'), '.outside {}\n');

    await expect(bundleStyles(graph, [], { label: 'test', files: ['./base.css'] })).rejects.toThrow(
      'VJSC graph style is outside its root: `../outside.css`.'
    );
  });

  it('keeps `@scope` unless asked to flatten it into `:where()` selectors', async () => {
    const module = fixtureModule('root', ['virtual:vjsc/css/asset/1/buttons.css']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([[module.id, module]]),
      assets: new Map([
        ['virtual:vjsc/css/asset/1/buttons.css', '@scope (.media-skin) { .media-button { color: red; } }'],
      ]),
    };

    const scoped = await bundleStyles(graph, [module], { label: 'test' });
    const flattened = await bundleStyles(graph, [module], { label: 'test', flattenScopes: true });

    expect(scoped).toContain('@scope (.media-skin)');
    expect(flattened).not.toContain('@scope');
    expect(flattened).toContain(':where(.media-skin) .media-button');
  });

  it('ignores imports outside the bundled module set', async () => {
    const root = fixtureModule('root', ['virtual:vjsc/css/asset/1/root.css'], ['missing']);
    const graph: Graph = {
      root: '/project',
      modules: new Map([[root.id, root]]),
      assets: new Map([['virtual:vjsc/css/asset/1/root.css', '.root { color: red; }']]),
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
    exports: [],
    styles: { files: assets.map((asset) => asset.slice(asset.lastIndexOf('/') + 1)), assets },
    annotations: {},
  };
}
