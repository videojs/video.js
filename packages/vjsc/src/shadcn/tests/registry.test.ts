import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { ComponentMeta } from '../../components';
import type { Graph, GraphModule } from '../../graph';
import { createShadcnRegistryFiles } from '../registry';

interface FixtureMeta extends ComponentMeta {
  readonly type: 'block' | 'component';
  readonly title: string;
  readonly description: string;
}

describe('createShadcnRegistryFiles', () => {
  it('keeps source-identical modules local when their generated styles differ', async () => {
    const graph = fixtureGraph();
    const files = await createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (!module.meta) return null;

          if (module.meta.type === 'component') {
            if (module.params.theme === 'minimal') return null;

            return {
              name: 'button',
              type: 'registry:ui',
              title: 'Button',
              description: 'Button.',
              group: 'ui',
              target: 'ui/button.tsx',
            };
          }

          const name = module.params.theme === 'minimal' ? 'video-minimal' : 'video';

          return {
            name,
            type: 'registry:block',
            title: name,
            description: `${name}.`,
            group: 'skins',
            directives: ['use client'],
            target: `skins/${name}/skin.tsx`,
            place: () => `skins/${name}/ui/button.tsx`,
          };
        },
      },
    });
    const defaultItem = registryItem(files, 'skins/registry.json', 'video');
    const minimalItem = registryItem(files, 'skins/registry.json', 'video-minimal');

    expect(defaultItem.registryDependencies).toEqual(['@example/button']);
    expect(defaultItem.files).toHaveLength(1);
    expect(defaultItem.directives).toBeUndefined();
    expect(sourceFile(files, 'skins/files/video/skins/video/skin.tsx')).toMatch(/^"use client";\n\n/);
    expect(minimalItem.registryDependencies).toBeUndefined();
    expect(minimalItem.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/skins/video-minimal/skin.tsx',
      'components/example/skins/video-minimal/ui/button.tsx',
    ]);
  });

  it('keeps source-identical modules local when a module they import differs', async () => {
    const graph = chainFixtureGraph();
    const files = await createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (!module.meta) return null;

          if (module.meta.type === 'component') {
            if (module.params.theme === 'minimal') return null;

            return {
              name: module.meta.name,
              type: 'registry:ui',
              title: module.meta.title,
              description: module.meta.description,
              group: 'ui',
              target: `ui/${module.meta.name}.tsx`,
            };
          }

          const name = module.params.theme === 'minimal' ? 'video-minimal' : 'video';

          return {
            name,
            type: 'registry:block',
            title: name,
            description: `${name}.`,
            group: 'skins',
            target: `skins/${name}/skin.tsx`,
            place: (candidate) => `skins/${name}/ui/${candidate.sourcePath.slice('components/'.length)}`,
          };
        },
      },
    });
    const defaultItem = registryItem(files, 'skins/registry.json', 'video');
    const minimalItem = registryItem(files, 'skins/registry.json', 'video-minimal');

    // The rate button's own source is the same for both themes, but it renders a button whose styles are not.
    expect(defaultItem.registryDependencies).toEqual(['@example/rate-button']);
    expect(defaultItem.files).toHaveLength(1);
    expect(minimalItem.registryDependencies).toBeUndefined();
    expect(minimalItem.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/skins/video-minimal/skin.tsx',
      'components/example/skins/video-minimal/ui/button.tsx',
      'components/example/skins/video-minimal/ui/rate-button.tsx',
    ]);
  });

  it('selects the registry theme item that owns a source theme target', async () => {
    const graph = fixtureGraph();
    const files = await createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (module.meta?.type !== 'block') return null;

          const theme = module.params.theme;

          return {
            name: `video-${theme}`,
            type: 'registry:block',
            title: `Video ${theme}`,
            description: `Video ${theme}.`,
            group: 'skins',
            target: `skins/video/${theme}.tsx`,
            place: (candidate) => `skins/video/${theme}/${candidate.sourcePath}`,
            theme: `styles/${theme}.css`,
          };
        },
      },
      styles: {
        theme: {
          name: '_style-default',
          title: 'Default theme',
          description: 'Default theme.',
          target: 'styles/default.css',
        },
        themes: [
          {
            name: '_style-minimal',
            title: 'Minimal theme',
            description: 'Minimal theme.',
            target: 'styles/minimal.css',
          },
        ],
      },
    });
    const defaultItem = registryItem(files, 'skins/registry.json', 'video-default');
    const minimalItem = registryItem(files, 'skins/registry.json', 'video-minimal');

    expect(defaultItem.registryDependencies).toEqual(['@example/_style-default']);
    expect(minimalItem.registryDependencies).toEqual(['@example/_style-minimal']);
    expect(sourceFile(files, 'skins/files/video-default/skins/video/default.tsx')).toMatch(
      /^import '\.\.\/\.\.\/styles\/default\.css';/
    );
    expect(sourceFile(files, 'skins/files/video-minimal/skins/video/minimal.tsx')).toMatch(
      /^import '\.\.\/\.\.\/styles\/minimal\.css';/
    );
  });

  it('imports multiple registered theme stylesheets in configured order', async () => {
    const graph = fixtureGraph();
    const files = await createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (module.meta?.type !== 'component' || module.params.theme !== 'minimal') return null;

          return {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button.',
            group: 'ui',
            target: 'ui/button.tsx',
            theme: ['styles/tokens.css', 'styles/overrides.css'],
          };
        },
      },
      styles: {
        theme: {
          name: '_style-base',
          title: 'Base theme',
          description: 'Base theme.',
          target: 'styles/tokens.css',
        },
        themes: [
          {
            name: '_style-minimal',
            title: 'Minimal theme',
            description: 'Minimal theme.',
            target: 'styles/overrides.css',
          },
        ],
      },
    });
    const item = registryItem(files, 'ui/registry.json', 'button');
    const source = sourceFile(files, 'ui/files/button/button.tsx');

    expect(item.registryDependencies).toEqual(['@example/_style-base', '@example/_style-minimal']);
    expect(source).toMatch(/^import '\.\.\/styles\/tokens\.css';\n\nimport '\.\.\/styles\/overrides\.css';/);
  });

  it('imports one registered theme before a source-owned stylesheet', async () => {
    const graph = fixtureGraph();
    const files = await createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (!module.meta || module.params.theme !== 'default') return null;

          if (module.meta.type === 'component') {
            return {
              name: 'button',
              type: 'registry:ui',
              title: 'Button',
              description: 'Button.',
              group: 'ui',
              target: 'ui/button.tsx',
            };
          }

          return {
            name: 'video',
            type: 'registry:block',
            title: 'Video',
            description: 'Video.',
            group: 'skins',
            target: 'video/skin.tsx',
            stylesheet: { target: 'audio/skin.css' },
            theme: 'styles/theme.css',
          };
        },
      },
      styles: {
        theme: {
          name: '_style-theme',
          title: 'Theme',
          description: 'Theme.',
          target: 'styles/theme.css',
        },
      },
    });
    const source = sourceFile(files, 'skins/files/video/default.tsx');

    expect(source).toMatch(/^import '\.\.\/styles\/theme\.css';\n\nimport '\.\.\/audio\/skin\.css';/);
  });

  it('rejects a named theme target when no registry theme owns it', async () => {
    const graph = fixtureGraph();
    const files = createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (module.meta?.type !== 'component' || module.params.theme !== 'default') return null;

          return {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button.',
            group: 'ui',
            target: 'ui/button.tsx',
            theme: 'styles/missing.css',
          };
        },
      },
    });

    await expect(files).rejects.toThrow(
      'Shadcn item `button` references an unknown registry theme target: `styles/missing.css`.'
    );
  });

  it('rejects a primary theme request when only additional themes are configured', async () => {
    const graph = fixtureGraph();
    const files = createShadcnRegistryFiles(graph, {
      name: 'example',
      homepage: 'https://example.com',
      namespace: '@example',
      paths: { install: 'components/example', import: '@/components/example' },
      items: {
        resolve({ module }) {
          if (module.meta?.type !== 'component' || module.params.theme !== 'default') return null;

          return {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button.',
            group: 'ui',
            target: 'ui/button.tsx',
            theme: true,
          };
        },
      },
      styles: {
        themes: [
          {
            name: '_style-extra',
            title: 'Extra theme',
            description: 'Extra theme.',
            target: 'styles/extra.css',
          },
        ],
      },
    });

    await expect(files).rejects.toThrow(
      'Shadcn item `button` requests a primary registry theme, but none is configured.'
    );
  });
});

describe('createShadcnRegistryFiles options', () => {
  const shared = {
    name: 'example',
    homepage: 'https://example.com',
    namespace: '@example',
    paths: { install: 'components/example', import: '@/components/example' },
  } as const;
  const button = (theme?: boolean | string) => ({
    resolve({ module }: { readonly module: GraphModule<FixtureMeta> }) {
      if (module.meta?.type !== 'component' || module.params.theme !== 'default') return null;

      return {
        name: 'button',
        type: 'registry:ui' as const,
        title: 'Button',
        description: 'Button.',
        group: 'ui',
        target: 'ui/button.tsx',
        ...(theme === undefined ? {} : { theme }),
      };
    },
  });
  const theme = { name: '_style-theme', title: 'Theme', description: 'Theme.', target: 'styles/theme.css' };

  it('imports the primary theme for styled items unless they opt out', async () => {
    const graph = fixtureGraph();
    const automatic = await createShadcnRegistryFiles(graph, { ...shared, items: button(), styles: { theme } });
    const optedOut = await createShadcnRegistryFiles(graph, { ...shared, items: button(false), styles: { theme } });

    expect(registryItem(automatic, 'ui/registry.json', 'button').registryDependencies).toEqual([
      '@example/_style-theme',
    ]);
    expect(sourceFile(automatic, 'ui/files/button/button.tsx')).toContain(`import '../styles/theme.css';`);
    expect(registryItem(optedOut, 'ui/registry.json', 'button').registryDependencies).toBeUndefined();
    expect(sourceFile(optedOut, 'ui/files/button/button.tsx')).not.toContain('theme.css');
  });

  it('derives theme files and dependencies from the local imports of each entry', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-registry-entries-'));

    mkdirSync(join(root, 'styles/video'), { recursive: true });
    writeFileSync(join(root, 'styles/base.css'), `@import "./tokens.css";\n.base {}`);
    writeFileSync(join(root, 'styles/tokens.css'), `:root {}`);
    writeFileSync(join(root, 'styles/video/base.css'), `@import "../base.css";\n@import "./captions.css";\n.video {}`);
    writeFileSync(join(root, 'styles/video/captions.css'), `.captions {}`);

    const files = await createShadcnRegistryFiles(
      { root, modules: new Map(), assets: new Map() },
      {
        ...shared,
        items: {},
        styles: {
          theme: { ...theme, target: 'styles/base.css', entry: './styles/base.css' },
          themes: [
            {
              name: '_style-video',
              title: 'Video',
              description: 'Video.',
              target: 'styles/video/base.css',
              entry: './styles/video/base.css',
            },
          ],
        },
      }
    );
    const base = registryItem(files, 'support/registry.json', '_style-theme');
    const video = registryItem(files, 'support/registry.json', '_style-video');

    expect(base.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/styles/base.css',
      'components/example/styles/tokens.css',
    ]);
    expect(video.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/styles/video/base.css',
      'components/example/styles/video/captions.css',
    ]);
    expect(video.registryDependencies).toEqual(['@example/_style-theme']);
  });

  it('follows qualified and url() imports of a theme entry', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-registry-entries-'));

    mkdirSync(join(root, 'styles'), { recursive: true });
    writeFileSync(
      join(root, 'styles/base.css'),
      `@import "./tokens.css" layer(tokens);\n@import url(./print.css) print;\n.base {}`
    );
    writeFileSync(join(root, 'styles/tokens.css'), `:root {}`);
    writeFileSync(join(root, 'styles/print.css'), `.print {}`);

    const files = await createShadcnRegistryFiles(
      { root, modules: new Map(), assets: new Map() },
      { ...shared, items: {}, styles: { theme: { ...theme, target: 'styles/base.css', entry: './styles/base.css' } } }
    );

    expect(
      registryItem(files, 'support/registry.json', '_style-theme').files.map((file: { target: string }) => file.target)
    ).toEqual([
      'components/example/styles/base.css',
      'components/example/styles/print.css',
      'components/example/styles/tokens.css',
    ]);
  });

  it('rejects a theme entry that imports a stylesheet outside the graph root', async () => {
    const parent = mkdtempSync(join(tmpdir(), 'vjsc-registry-entries-'));
    const root = join(parent, 'root');

    mkdirSync(join(root, 'styles'), { recursive: true });
    writeFileSync(join(root, 'styles/base.css'), `@import "../../outside.css";\n.base {}`);
    writeFileSync(join(parent, 'outside.css'), `.outside {}`);

    await expect(
      createShadcnRegistryFiles(
        { root, modules: new Map(), assets: new Map() },
        { ...shared, items: {}, styles: { theme: { ...theme, target: 'styles/base.css', entry: './styles/base.css' } } }
      )
    ).rejects.toThrow('VJSC graph style is outside its root: `../../outside.css`.');
  });

  it('rejects an unpinned dependency on a pinned package', async () => {
    const graph = fixtureGraph();
    const component = [...graph.modules.values()].find((module) => module.id.endsWith('button.tsx?theme=default'))!;
    const source = `import { helper } from '@example/core';\nexport function Button() { return <button />; }`;

    (graph.modules as Map<string, GraphModule<FixtureMeta>>).set(component.id, {
      ...component,
      source,
      imports: [importReference(source, '@example/core')],
    });

    await expect(
      createShadcnRegistryFiles(graph, {
        ...shared,
        items: button(false),
        pinned: (name) => name.startsWith('@example/'),
      })
    ).rejects.toThrow('Shadcn item `button` depends on `@example/core` without a pinned requirement.');
    await expect(
      createShadcnRegistryFiles(graph, {
        ...shared,
        items: button(false),
        packages: { '@example/core': '@example/core@1.0.0' },
        pinned: (name) => name.startsWith('@example/'),
      })
    ).resolves.toBeDefined();
  });

  it('describes generated style items with the configured style metadata', async () => {
    const files = await createShadcnRegistryFiles(fixtureGraph(), {
      ...shared,
      items: button(false),
      styles: { files: 'styles', meta: { role: 'support' } },
    });

    expect(registryItem(files, 'support/registry.json', '_style-buttons').meta).toEqual({ role: 'support' });
  });

  it('builds a catalog from created items alone', async () => {
    const files = await createShadcnRegistryFiles(fixtureGraph(), {
      ...shared,
      items: {
        create: () => [
          {
            name: 'template',
            type: 'registry:block',
            title: 'Template',
            description: 'Template.',
            group: 'blocks',
            files: [
              { path: 'template.html', type: 'registry:file', target: 'template.html', content: '<main></main>' },
            ],
          },
        ],
      },
    });

    expect(sourceFile(files, 'blocks/files/template/template.html')).toBe('<main></main>');
    expect(registryItem(files, 'blocks/registry.json', 'template').files).toEqual([
      { path: 'files/template/template.html', type: 'registry:file', target: 'template.html' },
    ]);
  });
});

function fixtureGraph(): Graph<FixtureMeta> {
  const root = '/fixture';
  const modules = new Map<string, GraphModule<FixtureMeta>>();
  const assets = new Map<string, string>();

  for (const theme of ['default', 'minimal'] as const) {
    const rootId = `${root}/skins/${theme}.tsx?theme=${theme}`;
    const componentId = `${root}/components/button.tsx?theme=${theme}`;
    const source = `import { Button } from '../components/button';\nexport function Skin() { return <Button />; }`;
    const styleId = `virtual:vjsc/css/asset/${theme}/buttons.css`;

    assets.set(styleId, `.media-button { color: ${theme === 'default' ? 'black' : 'white'}; }`);
    modules.set(rootId, {
      id: rootId,
      filename: `${root}/skins/${theme}.tsx`,
      sourcePath: `skins/${theme}.tsx`,
      params: { theme },
      source,
      imports: [{ ...importReference(source, '../components/button'), resolvedId: componentId }],
      styles: { files: [], assets: [] },
      exports: [],
      annotations: {},
      meta: { name: theme, type: 'block', title: theme, description: `${theme}.` },
    });
    modules.set(componentId, {
      id: componentId,
      filename: `${root}/components/button.tsx`,
      sourcePath: 'components/button.tsx',
      params: { theme },
      source: 'export function Button() { return <button />; }',
      imports: [],
      styles: { files: ['buttons.css'], assets: [styleId] },
      exports: [],
      annotations: {},
      meta: { name: 'button', type: 'component', title: 'Button', description: 'Button.' },
    });
  }

  return { root, modules, assets };
}

/** A skin rendering a rate button whose source never changes, over a button whose styles change per theme. */
function chainFixtureGraph(): Graph<FixtureMeta> {
  const root = '/fixture';
  const modules = new Map<string, GraphModule<FixtureMeta>>();
  const assets = new Map<string, string>();

  for (const theme of ['default', 'minimal'] as const) {
    const rootId = `${root}/skins/${theme}.tsx?theme=${theme}`;
    const rateButtonId = `${root}/components/rate-button.tsx?theme=${theme}`;
    const buttonId = `${root}/components/button.tsx?theme=${theme}`;
    const skinSource = `import { RateButton } from '../components/rate-button';\nexport function Skin() { return <RateButton />; }`;
    const rateButtonSource = `import { Button } from './button';\nexport function RateButton() { return <Button />; }`;
    const styleId = `virtual:vjsc/css/asset/${theme}/buttons.css`;

    assets.set(styleId, `.media-button { border-radius: ${theme === 'default' ? '8px' : '16px'}; }`);
    modules.set(rootId, {
      id: rootId,
      filename: `${root}/skins/${theme}.tsx`,
      sourcePath: `skins/${theme}.tsx`,
      params: { theme },
      source: skinSource,
      imports: [{ ...importReference(skinSource, '../components/rate-button'), resolvedId: rateButtonId }],
      styles: { files: [], assets: [] },
      exports: [],
      annotations: {},
      meta: { name: theme, type: 'block', title: theme, description: `${theme}.` },
    });
    modules.set(rateButtonId, {
      id: rateButtonId,
      filename: `${root}/components/rate-button.tsx`,
      sourcePath: 'components/rate-button.tsx',
      params: { theme },
      source: rateButtonSource,
      imports: [{ ...importReference(rateButtonSource, './button'), resolvedId: buttonId }],
      styles: { files: [], assets: [] },
      exports: [],
      annotations: {},
      meta: { name: 'rate-button', type: 'component', title: 'Rate Button', description: 'Rate button.' },
    });
    modules.set(buttonId, {
      id: buttonId,
      filename: `${root}/components/button.tsx`,
      sourcePath: 'components/button.tsx',
      params: { theme },
      source: 'export function Button() { return <button />; }',
      imports: [],
      styles: { files: ['buttons.css'], assets: [styleId] },
      exports: [],
      annotations: {},
      meta: { name: 'button', type: 'component', title: 'Button', description: 'Button.' },
    });
  }

  return { root, modules, assets };
}

function importReference(source: string, specifier: string) {
  const start = source.indexOf(`'${specifier}'`);

  return { specifier, kind: 'static' as const, start, end: start + specifier.length + 2, quote: "'", bindings: [] };
}

function registryItem(files: Awaited<ReturnType<typeof createShadcnRegistryFiles>>, path: string, name: string): any {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) throw new Error(`Missing registry: ${path}`);

  const registry = JSON.parse(file.content);
  const item = registry.items.find((candidate: { name: string }) => candidate.name === name);
  if (!item) throw new Error(`Missing registry item: ${name}`);

  return item;
}

function sourceFile(files: Awaited<ReturnType<typeof createShadcnRegistryFiles>>, path: string): string {
  const file = files.find((candidate) => candidate.path === path);
  if (!file) throw new Error(`Missing source file: ${path}`);

  return file.content;
}
