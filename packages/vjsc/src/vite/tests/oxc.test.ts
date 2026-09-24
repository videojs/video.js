import MagicString from 'magic-string';
import type { OutputAsset, OutputChunk, Plugin, RolldownOutput } from 'rolldown';
import { build } from 'vite';
import { describe, expect, it } from 'vite-plus/test';

import { viteOxcPlugin } from '../oxc';

const ENTRY_ID = 'vite-oxc-fixture.js';
const STYLE_ENTRY_ID = 'vite-oxc-style-fixture.js';
const STYLE_ID = 'vite-oxc-fixture.css';

describe('viteOxcPlugin', () => {
  it('supplies the AST and MagicString metadata omitted by Vite', async () => {
    let topLevelHasOxcMetadata = true;
    let rolldownOptionsHasOxcMetadata = true;
    let usedFallback = false;
    const transform: Plugin = {
      name: 'vite-oxc-transform',
      transform(code, id, meta) {
        if (id !== ENTRY_ID || !meta.magicString) return null;

        usedFallback = meta.magicString instanceof MagicString;
        const start = code.indexOf(`'before'`);

        meta.magicString.overwrite(start, start + 8, `'after'`);
        return { code: meta.magicString };
      },
    };
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        fixturePlugin(),
        metadataProbe((hasMetadata) => {
          topLevelHasOxcMetadata = hasMetadata;
        }),
        viteOxcPlugin(transform),
      ],
      build: {
        write: false,
        sourcemap: true,
        rolldownOptions: {
          input: ENTRY_ID,
          experimental: { nativeMagicString: true },
          plugins: [
            metadataProbe((hasMetadata) => {
              rolldownOptionsHasOxcMetadata = hasMetadata;
            }),
          ],
        },
      },
    });
    const outputs = (Array.isArray(result) ? result : [result]) as RolldownOutput[];
    const output = outputs.flatMap((result) => result.output);
    const chunk = output.find((item): item is OutputChunk => item.type === 'chunk');
    const map = output.find((item): item is OutputAsset => item.type === 'asset' && item.fileName.endsWith('.map'));
    const sourceMap = map ? (JSON.parse(String(map.source)) as { mappings: string; sources: string[] }) : undefined;

    expect(topLevelHasOxcMetadata).toBe(false);
    expect(rolldownOptionsHasOxcMetadata).toBe(false);
    expect(usedFallback).toBe(true);
    expect(chunk?.code).toContain('after');
    expect(sourceMap).toBeDefined();
    expect(sourceMap?.mappings).not.toBe('');
    expect(sourceMap?.sources.length).toBeGreaterThan(0);
  });

  it('reuses the AST across passes that leave the source unchanged and parses edited source', async () => {
    const trees: unknown[] = [];
    const pass = (name: string, edit: boolean): Plugin => ({
      name,
      transform(code, id, meta) {
        if (id !== ENTRY_ID || !meta.magicString) return null;

        trees.push(meta.ast);

        if (!edit) return null;

        const start = code.indexOf(`'before'`);

        meta.magicString.overwrite(start, start + 8, `'after'`);
        return { code: meta.magicString };
      },
    });

    await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        fixturePlugin(),
        viteOxcPlugin(pass('read', false)),
        viteOxcPlugin(pass('edit', true)),
        viteOxcPlugin(pass('after-edit', false)),
      ],
      build: { write: false, rolldownOptions: { input: ENTRY_ID } },
    });

    expect(trees).toHaveLength(3);
    expect(trees[1]).toBe(trees[0]);
    expect(trees[2]).not.toBe(trees[1]);
  });

  it('passes stylesheet modules through without parsing them', async () => {
    let styleAst: unknown = 'unset';
    const transform: Plugin = {
      name: 'vite-oxc-style-transform',
      transform: {
        filter: { id: /\.css$/ },
        handler(_code, id, meta) {
          if (id === STYLE_ID) styleAst = (meta as { ast?: unknown }).ast;

          return null;
        },
      },
    };

    await expect(
      build({
        configFile: false,
        logLevel: 'silent',
        plugins: [fixturePlugin(), viteOxcPlugin(transform)],
        build: {
          write: false,
          rolldownOptions: { input: STYLE_ENTRY_ID },
        },
      })
    ).resolves.toBeDefined();

    expect(styleAst).toBeUndefined();
  });

  it('reports positioned transform errors against the authored source', async () => {
    const transform: Plugin = {
      name: 'vite-oxc-positioned-error',
      transform(code, id) {
        if (id !== ENTRY_ID) return null;

        throw Object.assign(new Error('Failed to transform fixture.'), { pos: code.indexOf(`'before'`) });
      },
    };

    await expect(
      build({
        configFile: false,
        logLevel: 'silent',
        plugins: [fixturePlugin(), viteOxcPlugin(transform)],
        build: {
          write: false,
          rolldownOptions: { input: ENTRY_ID },
        },
      })
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          plugin: 'vite-oxc-positioned-error',
          id: ENTRY_ID,
          loc: expect.objectContaining({ line: 1 }),
          frame: expect.stringContaining(`globalThis.value = 'before';`),
        }),
      ],
    });
  });
});

function metadataProbe(record: (hasMetadata: boolean) => void): Plugin {
  return {
    name: 'vite-oxc-metadata-probe',
    transform(_code, id, options) {
      if (id === ENTRY_ID) {
        record('ast' in (options ?? {}) || 'magicString' in (options ?? {}));
      }

      return null;
    },
  };
}

function fixturePlugin(): Plugin {
  const modules: Record<string, string> = {
    [ENTRY_ID]: `globalThis.value = 'before';`,
    [STYLE_ENTRY_ID]: `import './${STYLE_ID}';`,
    [STYLE_ID]: `@layer components { .fixture { color: red; } }`,
  };

  return {
    name: 'vite-oxc-fixture',
    resolveId(id) {
      const name = id.startsWith('./') ? id.slice(2) : id;

      return name in modules ? name : null;
    },
    load(id) {
      return modules[id] ?? null;
    },
  };
}
