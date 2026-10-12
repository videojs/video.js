import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { defineVariants, vjscPlugin } from '..';
import { defineSchema } from '../../components/definition';
import type { Graph } from '../../graph';
import { defineComponentTarget } from '../../target/definition';

const schema = defineSchema('@fixture/components', {});
const target = defineComponentTarget<typeof schema>()(() => ({
  source: '@fixture/components',
  components: { resolve: () => undefined },
  transforms: [
    {
      name: 'fixture:target-transform',
      transform({ code, magicString }) {
        const start = code.indexOf(`'before'`);
        if (start < 0) return false;

        magicString.overwrite(start, start + 8, `'after'`);
        return true;
      },
    },
  ],
  jsx: { importSource: 'react', attributes: 'react' },
}));

describe('vjscPlugin', () => {
  it('configures each module once and runs transforms owned by its selected targets', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-plugin-'));
    const filename = join(root, 'fixture.ts');
    const id = `${filename}?target=react`;
    const configurations = new Map<string, number>();

    writeFileSync(filename, `export const value = 'before';`);

    const plugins = vjscPlugin({
      transform: {
        components(module) {
          configurations.set(module.id, (configurations.get(module.id) ?? 0) + 1);
          return module.params.get('target') === 'react' ? [target] : null;
        },
        styles() {
          return null;
        },
      },
    });
    const bundle = await rolldown({
      cwd: root,
      input: id,
      experimental: { nativeMagicString: true },
      plugins,
    });
    const output = await bundle.generate({ format: 'es' });
    const chunk = output.output.find((item) => item.type === 'chunk');

    expect([...new Set(configurations.values())]).toEqual([1]);
    expect([...configurations.keys()].some((moduleId) => moduleId.endsWith('?target=react'))).toBe(true);
    expect(chunk?.code).toContain('after');
    expect([...(plugins[0]!.api as Graph).modules.values()].map((module) => module.source)).toEqual([
      expect.stringContaining('after'),
    ]);
  });

  it('compiles entries for each declared variant and hands every callback the decoded variant', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-plugin-'));
    const filename = join(root, 'player.tsx');
    const plain = join(root, 'helper.ts');
    const seen: Array<{ readonly id: string; readonly variant: unknown }> = [];

    writeFileSync(filename, `import { helper } from './helper';\nexport const Player = () => helper;`);
    writeFileSync(plain, `export const helper = 'helper';\nexport const meta = { name: 'helper', title: 'Helper' };`);

    const plugins = vjscPlugin<{ readonly name: string }, { readonly theme: 'default' | 'minimal' }>({
      entries: {
        root,
        include: ['./player.tsx', './helper.ts'],
        // Discovery reports real paths, which differ from the temporary directory on some platforms.
        variants: ({ filename: entry }) =>
          entry.endsWith('helper.ts') ? [null] : [{ theme: 'default' }, { theme: 'minimal' }],
      },
      variants: defineVariants({
        encode: (variant) => ({ theme: variant.theme }),
        decode(params) {
          const theme = params.get('theme');

          return theme === 'default' || theme === 'minimal' ? { theme } : null;
        },
      }),
      meta: {
        defaults: (module) => ({ name: module.filename.endsWith('player.tsx') ? 'player' : 'unused' }),
        validate(meta, module) {
          if (typeof meta.name !== 'string') throw new Error(`No name in ${module.id}.`);

          return { name: `${meta.name}${module.variant ? `-${module.variant.theme}` : ''}` };
        },
      },
      transform: {
        components(module) {
          seen.push({ id: module.id, variant: module.variant });
          return module.variant ? [target] : null;
        },
        styles: () => null,
      },
    });
    const bundle = await rolldown({ cwd: root, input: [], experimental: { nativeMagicString: true }, plugins });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    const modules = [...(plugins[0]!.api as Graph<{ readonly name: string }>).modules.values()];

    expect(modules.map((module) => [module.sourcePath, module.variant, module.meta?.name]).sort()).toEqual([
      ['helper.ts', undefined, 'helper'],
      ['helper.ts', { theme: 'default' }, 'helper-default'],
      ['helper.ts', { theme: 'minimal' }, 'helper-minimal'],
      ['player.tsx', { theme: 'default' }, 'player-default'],
      ['player.tsx', { theme: 'minimal' }, 'player-minimal'],
    ]);
    expect(seen.find((entry) => entry.id.endsWith('player.tsx?theme=minimal'))?.variant).toEqual({ theme: 'minimal' });
  });

  it('compiles a dependency once for the variant its codec lets it inherit', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-plugin-'));

    writeFileSync(join(root, 'player.tsx'), `import { helper } from './helper';\nexport const Player = () => helper;`);
    writeFileSync(join(root, 'helper.ts'), `export const helper = 'helper';`);

    interface FixtureVariant {
      readonly theme: string;
      readonly skin?: string | undefined;
    }

    const plugins = vjscPlugin<{ readonly name: string }, FixtureVariant>({
      entries: {
        root,
        include: ['./player.tsx'],
        variants: () => [
          { theme: 'default', skin: 'a' },
          { theme: 'default', skin: 'b' },
        ],
      },
      variants: defineVariants<FixtureVariant>({
        encode: (variant) => ({ theme: variant.theme, ...(variant.skin ? { skin: variant.skin } : {}) }),
        decode: (params) =>
          params.has('theme') ? { theme: params.get('theme')!, skin: params.get('skin') ?? undefined } : null,
        inherit: (variant, dependency) =>
          dependency.filename.endsWith('helper.ts') ? { theme: variant.theme } : variant,
      }),
      transform: { components: (module) => (module.variant ? [target] : null), styles: () => null },
    });
    const bundle = await rolldown({ cwd: root, input: [], experimental: { nativeMagicString: true }, plugins });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    const modules = [...(plugins[0]!.api as Graph<{ readonly name: string }, FixtureVariant>).modules.values()];

    expect(modules.map((module) => module.id.slice(root.length)).sort()).toEqual([
      expect.stringMatching(/helper\.ts\?theme=default$/),
      expect.stringMatching(/player\.tsx\?skin=a&theme=default$/),
      expect.stringMatching(/player\.tsx\?skin=b&theme=default$/),
    ]);
  });

  it("narrows only the variant parameters a dependency inherits, passing other tools' parameters through", async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-plugin-'));

    writeFileSync(join(root, 'player.tsx'), `import { helper } from './helper';\nexport const Player = () => helper;`);
    writeFileSync(join(root, 'helper.ts'), `export const helper = 'helper';`);

    interface FixtureVariant {
      readonly theme: string;
      readonly skin?: string | undefined;
    }

    const plugins = vjscPlugin<{ readonly name: string }, FixtureVariant>({
      variants: defineVariants<FixtureVariant>({
        encode: (variant) => ({
          theme: variant.theme,
          ...(variant.skin ? { skin: variant.skin } : {}),
        }),
        decode: (params) =>
          params.has('theme') ? { theme: params.get('theme')!, skin: params.get('skin') ?? undefined } : null,
        inherit: (variant) => ({ theme: variant.theme }),
      }),
      transform: { components: (module) => (module.variant ? [target] : null), styles: () => null },
    });
    const bundle = await rolldown({
      cwd: root,
      input: `${join(root, 'player.tsx')}?foo=bar&skin=a&theme=default`,
      experimental: { nativeMagicString: true },
      plugins,
    });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    const helper = [...(plugins[0]!.api as Graph).modules.values()].find((module) => module.id.includes('helper.ts'));

    expect(helper?.id.split('?')[1]).toBe('foo=bar&theme=default');
  });

  it('captures generated stylesheets without bundling them in assets-only builds', async () => {
    const fixtures = resolve(import.meta.dirname, 'fixtures');
    const plugins = vjscPlugin({
      entries: { root: fixtures, include: ['./conditional-component.tsx'], variants: () => [{ target: 'react' }] },
      variants: defineVariants({
        encode: (variant: { readonly target: string }) => variant,
        decode: (params) => (params.has('target') ? { target: params.get('target')! } : null),
      }),
      transform: {
        components: () => [],
        styles: () => ({ mode: 'css', stylesheet: { input: resolve(fixtures, 'design.css') } }),
      },
      assetsOnly: true,
    });
    const bundle = await rolldown({ cwd: fixtures, input: [], experimental: { nativeMagicString: true }, plugins });
    const output = await bundle.generate({ format: 'es' });
    const graph = plugins[0]!.api as Graph;

    await bundle.close();

    expect(output.output).toEqual([]);
    expect([...graph.assets.values()].join('\n')).toContain('.fixture-button');
  });
});
