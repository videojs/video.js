import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { type Plugin, type RolldownOutput, rolldown } from 'rolldown';
import { registryItemSchema, registrySchema } from 'shadcn/schema';
import { describe, expect, it } from 'vite-plus/test';

import { defineVariants, vjscPlugin, vjscRegistryPlugin } from '..';
import type { ComponentMeta } from '../../components';
import type { GraphModule } from '../../graph';
import type { RegistryCatalogOptions, RegistryModuleItem, VjscRegistryOptions } from '../../shadcn';

interface FixtureMeta extends ComponentMeta {
  readonly type: 'block' | 'component' | 'support';
  readonly title: string;
  readonly description: string;
}

describe('vjscRegistryPlugin', () => {
  it('emits schema-valid items from the shared module graph', async () => {
    const root = setup({
      'components/root.tsx': `import { Public } from './public'; import { Helper } from './helper'; import value from 'private-package/subpath'; export function Root() { return <main>{Public}{Helper}{value}</main>; } ${meta('root', 'block')}`,
      'components/public.tsx': `export function Public() { return <span/>; } ${meta('public')}`,
      'components/helper.tsx': `export function Helper() { return <aside/>; } ${meta('helper', 'support')}`,
    });
    const output = await build(root);
    const registry = assetJson(output, 'registry.json');
    const rootItem = registryItem(output, 'items', 'root');

    registrySchema.parse(registry);
    registryItemSchema.parse(rootItem);

    expect(rootItem).not.toHaveProperty('$vjsc');
    expect(rootItem).toMatchObject({
      dependencies: ['private-package', 'react'],
      registryDependencies: ['@example/helper', '@example/public'],
    });
    expect(rootItem.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/skins/root.tsx',
    ]);
    expect(registryFile(output, 'items', rootItem, '/root.tsx')).toContain(`from '@/components/example/ui/public'`);
    expect(output.output.some((item) => item.type === 'chunk')).toBe(false);
  });

  it('emits every catalog from one graph analysis', async () => {
    const root = setup({
      'components/public.tsx': `export function Public() { return <span/>; } ${meta('public')}`,
    });
    const transform = fixtureTransform(root);
    const registry = vjscRegistryPlugin<FixtureMeta>({
      ...baseOptions(),
      catalogs: [
        { output: 'r/default', items: { resolve: ({ module }) => describeItem(module) } },
        { output: 'r/other', items: { resolve: ({ module }) => describeItem(module) }, meta: { catalog: 'other' } },
      ],
    });
    const bundle = await rolldown({
      input: [],
      external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
      plugins: [...transform, registry],
    });
    const output = await bundle.generate({ format: 'es' });

    expect(assetJson(output, 'r/default/registry.json').name).toBe('example');
    expect(registryItem(output, 'r/other/items', 'public').meta).toMatchObject({ catalog: 'other' });
  });

  it('rejects catalogs that share an output directory', () => {
    expect(() =>
      vjscRegistryPlugin({
        ...baseOptions(),
        catalogs: [
          { output: 'r', items: {} },
          { output: './r', items: {} },
        ],
      })
    ).toThrow('Shadcn registry catalogs must use distinct outputs.');
  });

  it('supports item-specific installation and import roots', async () => {
    const root = setup({
      'components/root.tsx': `import { Helper } from './helper'; export function Root() { return <main>{Helper}</main>; } ${meta('root', 'block')}`,
      'components/helper.tsx': `export const Helper = <aside/>; ${meta('helper', 'support')}`,
    });
    const output = await build(root, {
      items: {
        resolve({ module }) {
          const item = describeItem(module);
          if (item?.name !== 'helper') return item;

          return {
            ...item,
            target: 'helper.tsx',
            paths: { install: '@lib', import: '@/lib' },
          };
        },
      },
    });
    const rootItem = registryItem(output, 'items', 'root');
    const helperItem = registryItem(output, 'items', 'helper');

    expect(helperItem.files.map((file: { target: string }) => file.target)).toEqual(['@lib/helper.tsx']);
    expect(registryFile(output, 'items', rootItem, '/root.tsx')).toContain(`from '@/lib/helper'`);
  });

  it('keeps transformed identities and dependencies selection-specific', async () => {
    const root = setup({
      'components/root.tsx': `import { Child } from './child'; export function Root() { return <main>{Child}</main>; } ${meta('root', 'block')}`,
      'components/child.tsx': `export const Child = <aside/>; ${meta('child')}`,
    });
    const transformations = () => [{ theme: 'default' }, { theme: 'minimal' }];
    const output = await build(root, { transformations }, [
      {
        name: 'test:theme-source',
        transform(code, id) {
          const theme = new URLSearchParams(id.split('?')[1]).get('theme');

          return theme ? code.replace('<main>', `<main data-theme="${theme}">`) : null;
        },
      },
    ]);
    const defaultItem = registryItem(output, 'items', 'root');
    const minimalItem = registryItem(output, 'items', 'root-minimal');

    expect(defaultItem.registryDependencies).toContain('@example/child');
    expect(minimalItem.registryDependencies).toContain('@example/child-minimal');
    expect(registryFile(output, 'items', minimalItem, '/root-minimal.tsx')).toContain('data-theme="minimal"');
  });

  it('rejects reachable modules without semantic ownership', async () => {
    const root = setup({
      'components/root.tsx': `import { Helper } from '../helper'; export function Root() { return <main>{Helper}</main>; } ${meta('root', 'block')}`,
      'helper.tsx': `export const Helper = <aside/>;`,
    });

    await expect(build(root)).rejects.toThrow(/cannot hide shared modules under compiler-shaped internal paths/);
  });

  it('captures finalized virtual style assets', async () => {
    const virtualStyle = 'virtual:vjsc/css/asset/root/root.css';
    const root = setup({
      'components/root.tsx': `import ${JSON.stringify(virtualStyle)}; export const Root = <main />; ${meta('root', 'block')}`,
    });
    const output = await build(
      root,
      {
        styles: { files: 'styles' },
        items: {
          resolve({ module }) {
            const item = describeItem(module);

            return item?.name === 'root' ? { ...item, stylesheet: { target: 'styles/root.css' } } : item;
          },
        },
      },
      [
        {
          name: 'test:late-style',
          buildStart() {
            this.emitFile({ type: 'chunk', id: virtualStyle });
          },
          resolveId(id) {
            return id === virtualStyle ? `\0${virtualStyle}` : null;
          },
          load(id) {
            return id === `\0${virtualStyle}` ? { code: '.root { color: red; }', moduleType: 'js' } : null;
          },
          transform(_code, id) {
            return id === `\0${virtualStyle}` ? { code: 'export {};', moduleType: 'js' } : null;
          },
        },
      ]
    );
    const item = registryItem(output, 'items', 'root');

    expect(registryFile(output, 'items', item, '/root.css')).toMatch(/\.root\s*\{\s*color:\s*red;/);
    expect(registryFile(output, 'items', item, '/root.tsx')).toContain(`import '../styles/root.css';`);
    expect(registryFile(output, 'items', item, '/root.tsx')).not.toContain('virtual:vjsc/css');
    expect(output.output.some((asset) => asset.fileName === 'support/registry.json')).toBe(false);
  });

  it('derives shared style items, dependencies, and imports from graph ownership', async () => {
    const virtualStyle = 'virtual:vjsc/css/asset/current/audio%2Fbuttons.css';
    const root = setup({
      'components/root.tsx': `import ${JSON.stringify(virtualStyle)}; export const Root = <main />; ${meta('root', 'block')}`,
      'styles/base.css': ':root { --accent: red; }',
      'styles/tailwind.css': `
        @theme inline {
          --color-accent: var(--accent);
          --radius-control: 0.5rem;
        }

        @utility shadow-control {
          box-shadow: var(--shadow-control);
        }

        @utility tab-* {
          tab-size: --value(integer);
        }

        @custom-variant opaque {
          @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
            @slot;
          }
        }
      `,
    });
    const output = await build(
      root,
      {
        styles: {
          theme: {
            target: 'styles/theme.css',
            include: ['./styles/base.css'],
            tailwind: './styles/tailwind.css',
            title: 'Theme',
            description: 'Shared theme.',
          },
          files: 'styles',
        },
      },
      [
        {
          name: 'test:shared-style',
          buildStart() {
            this.emitFile({ type: 'chunk', id: virtualStyle });
          },
          resolveId(id) {
            return id === virtualStyle ? `\0${virtualStyle}` : null;
          },
          load(id) {
            return id === `\0${virtualStyle}` ? { code: '.button { color: var(--accent); }', moduleType: 'js' } : null;
          },
          transform(_code, id) {
            return id === `\0${virtualStyle}` ? { code: 'export {};' } : null;
          },
        },
      ]
    );
    const item = registryItem(output, 'items', 'root');
    const style = registryItem(output, 'support', '_style-audio-buttons');
    const theme = registryItem(output, 'support', '_style-theme');
    const source = registryFile(output, 'items', item, '/root.tsx');

    expect(item.registryDependencies).toEqual(['@example/_style-audio-buttons', '@example/_style-theme']);
    expect(source).toContain(`import '../styles/audio/buttons.css';`);
    expect(source).toContain(`import '../styles/theme.css';`);
    expect(registryFile(output, 'support', style, '/audio/buttons.css')).toContain('color: var(--accent)');
    expect(registryFile(output, 'support', theme, '/theme.css')).toContain('--accent: red');
    expect(theme.cssVars.theme).toEqual({
      'color-accent': 'var(--accent)',
      'radius-control': '.5rem',
    });
    expect(theme.css).toEqual({
      '@utility shadow-control': { 'box-shadow': 'var(--shadow-control)' },
      '@utility tab-*': { 'tab-size': '--value(integer)' },
      '@custom-variant opaque': {
        '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': { '@slot': {} },
      },
    });
  });

  it('imports an explicitly requested theme without captured style assets', async () => {
    const root = setup({
      'components/root.tsx': `export const Root = <main />; ${meta('root', 'block')}`,
      'styles/base.css': ':root { --accent: red; }',
    });
    const output = await build(root, {
      styles: {
        theme: {
          target: 'styles/theme.css',
          include: ['./styles/base.css'],
          title: 'Theme',
          description: 'Shared theme.',
        },
      },
      items: {
        resolve({ module }) {
          const item = describeItem(module);

          return item ? { ...item, theme: true } : null;
        },
      },
    });
    const item = registryItem(output, 'items', 'root');

    expect(item.registryDependencies).toContain('@example/_style-theme');
    expect(registryFile(output, 'items', item, '/root.tsx')).toContain(`import '../styles/theme.css';`);
  });

  it('preserves an editable theme tree and imports its requested entry', async () => {
    const root = setup({
      'components/root.tsx': `export const Root = <main />; ${meta('root', 'block')}`,
      'styles/base.css': '@import "./themes/theme.css";',
      'styles/base.video.css': '@import "./base.css";\n.player { color: var(--accent); }',
      'styles/themes/theme.css': ':root { --accent: red; }',
    });
    const output = await build(root, {
      styles: {
        theme: {
          name: '_style-theme',
          target: 'styles/base.css',
          files: {
            './styles/base.css': 'styles/base.css',
            './styles/base.video.css': 'styles/base.video.css',
            './styles/themes/theme.css': 'styles/themes/theme.css',
          },
          title: 'Theme',
          description: 'Shared theme.',
        },
      },
      items: {
        resolve({ module }) {
          const item = describeItem(module);

          return item ? { ...item, theme: 'styles/base.video.css' } : null;
        },
      },
    });
    const item = registryItem(output, 'items', 'root');
    const theme = registryItem(output, 'support', '_style-theme');

    expect(item.registryDependencies).toContain('@example/_style-theme');
    expect(registryFile(output, 'items', item, '/root.tsx')).toContain(`import '../styles/base.video.css';`);
    expect(theme.files.map((file: { target: string }) => file.target)).toEqual([
      'components/example/styles/base.css',
      'components/example/styles/base.video.css',
      'components/example/styles/themes/theme.css',
    ]);
    expect(registryFile(output, 'support', theme, '/base.css')).toBe('@import "./themes/theme.css";');
    expect(registryFile(output, 'support', theme, '/themes/theme.css')).toContain('--accent: red');
  });

  it('emits asynchronously prepared source-owned files', async () => {
    const root = setup({
      'components/root.tsx': `export const Root = <main />; ${meta('root', 'block')}`,
    });
    const output = await build(root, {
      items: {
        resolve() {
          return null;
        },
        async create() {
          return [
            {
              name: 'template',
              type: 'registry:block',
              title: 'Template',
              description: 'Template.',
              files: [
                {
                  path: 'skin.html',
                  target: 'components/example/skins/template/skin.html',
                  type: 'registry:file',
                  content: '<main></main>',
                },
              ],
              group: 'items',
            },
          ];
        },
      },
    });
    const item = registryItem(output, 'items', 'template');

    expect(item.files[0].content).toBeUndefined();
    expect(registryFile(output, 'items', item, '/skin.html')).toBe('<main></main>');
  });

  it('formats editable sources without passing manifests to the formatter', async () => {
    const root = setup({
      'components/root.tsx': `export const Root = <main />; ${meta('root', 'block')}`,
    });
    const formatted: string[] = [];
    const output = await build(root, {
      format(source) {
        formatted.push(source.path);

        return source.content.replace('<main />', '<main data-formatted />');
      },
    });
    const item = registryItem(output, 'items', 'root');

    expect(formatted).toEqual(['items/files/root/root.tsx']);
    expect(registryFile(output, 'items', item, '/root.tsx')).toContain('<main data-formatted />');
  });

  it('reuses one graph plugin safely across rebuilds', async () => {
    const root = setup({
      'components/root.tsx': `export const Root = <main>first</main>; ${meta('root', 'block')}`,
    });
    const transform = fixtureTransform(root);
    const first = await build(root, {}, [], transform);

    writeFileSync(
      join(root, 'components/root.tsx'),
      `export const Root = <main>second</main>; ${meta('root', 'block')}`
    );
    const second = await build(root, {}, [], transform);
    const firstItem = registryItem(first, 'items', 'root');
    const secondItem = registryItem(second, 'items', 'root');

    expect(registryFile(first, 'items', firstItem, '/root.tsx')).toContain('first');
    expect(registryFile(second, 'items', secondItem, '/root.tsx')).toContain('second');
  });
});

type FixtureOptions = RegistryCatalogOptions<FixtureMeta>;

async function build(
  root: string,
  overrides: Partial<FixtureOptions & { transformations: () => readonly Readonly<Record<string, string>>[] }> = {},
  additions: readonly Plugin[] = [],
  existingTransform?: Plugin[]
): Promise<RolldownOutput> {
  const { transformations, ...registryOverrides } = overrides;
  const transform = existingTransform ?? fixtureTransform(root, transformations);
  const registry = vjscRegistryPlugin(baseOptions(registryOverrides));
  const bundle = await rolldown({
    input: [],
    experimental: { nativeMagicString: true },
    external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
    plugins: [...transform, ...additions, registry],
  });

  return bundle.generate({ format: 'es', entryFileNames: '[name].js' });
}

type FixtureVariant = Readonly<Record<string, string>>;

const fixtureVariants = defineVariants<FixtureVariant>({
  encode: (variant) => variant,
  decode: (params) => Object.fromEntries(params),
});

function fixtureTransform(root: string, transformations?: () => readonly FixtureVariant[]): Plugin[] {
  return vjscPlugin<FixtureMeta, FixtureVariant>({
    entries: {
      root,
      include: './components/**/*.{ts,tsx}',
      ...(transformations ? { variants: transformations } : {}),
    },
    variants: fixtureVariants,
    transform: {
      components: () => [],
      styles: () => null,
    },
  });
}

function baseOptions(overrides: Partial<FixtureOptions> = {}): VjscRegistryOptions<FixtureMeta> {
  const { output, items, styles, meta, ...shared } = {
    name: 'example',
    homepage: 'https://example.com',
    namespace: '@example',
    paths: { install: 'components/example', import: '@/components/example' },
    meta: { framework: 'react', styling: 'tailwind' },
    items: { resolve: ({ module }) => describeItem(module) },
    ...overrides,
  } satisfies FixtureOptions;

  return { ...shared, catalogs: [{ output, items, styles, meta }] };
}

function describeItem(module: GraphModule<FixtureMeta>): RegistryModuleItem<FixtureMeta> | null {
  const itemMeta = module.meta;
  if (!itemMeta) return null;

  const theme = module.params.theme;
  const name = theme === 'minimal' ? `${itemMeta.name}-minimal` : itemMeta.name;
  const support = itemMeta.type === 'support';

  return {
    name,
    type: support ? 'registry:lib' : itemMeta.type === 'block' ? 'registry:block' : 'registry:ui',
    title: itemMeta.title,
    description: itemMeta.description,
    categories: support ? ['support'] : ['media'],
    meta: { public: !support },
    group: 'items',
    target: `${itemMeta.type === 'block' ? 'skins' : 'ui'}/${name}.tsx`,
  };
}

function meta(name: string, type: FixtureMeta['type'] = 'component'): string {
  return `/** @jsxImportSource react */\nexport const meta = { name: '${name}', type: '${type}', title: '${name}', description: '${name}.' } as const;`;
}

function setup(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), 'vjsc-shadcn-'));

  for (const [filename, source] of Object.entries(files)) {
    const path = join(root, filename);

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source);
  }

  return root;
}

function assetJson(output: RolldownOutput, filename: string): any {
  const asset = output.output.find((item) => item.type === 'asset' && item.fileName === filename);
  if (asset?.type !== 'asset') throw new Error(`Missing asset: ${filename}`);

  return JSON.parse(String(asset.source));
}

function registryItem(output: RolldownOutput, group: string, name: string): any {
  const registry = assetJson(output, `${group}/registry.json`);
  const item = registry.items.find((candidate: { name: string }) => candidate.name === name);
  if (!item) throw new Error(`Missing registry item: ${name}`);

  return item;
}

function registryFile(output: RolldownOutput, group: string, item: any, target: string): string {
  const file = item.files.find((candidate: { target?: string }) => candidate.target?.endsWith(target));
  if (!file) throw new Error(`Missing registry file: ${item.name}${target}`);

  const asset = output.output.find(
    (candidate) => candidate.type === 'asset' && candidate.fileName === `${group}/${file.path}`
  );
  if (asset?.type !== 'asset') throw new Error(`Missing registry source: ${group}/${file.path}`);

  return String(asset.source);
}
