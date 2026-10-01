import { basename } from 'node:path';

import { type OutputChunk, type Plugin, rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { type ComponentMetaPluginOptions, componentMetaPlugin, readModuleBuildMeta } from '../component-meta';

const MODULE_ID = '\0fixture.tsx?target=react';

describe('componentMetaPlugin', () => {
  it('uses the Rolldown AST and MagicString while preserving editable source', async () => {
    const result = await build(
      `export const meta = { name: 'poster', type: 'component', flags: ['visual'], priority: -1 } as const satisfies { name: string }, retained = 42;\nexport const value = retained;`
    );

    expect(readModuleBuildMeta(result.meta)?.moduleMeta).toEqual({
      name: 'poster',
      type: 'component',
      flags: ['visual'],
      priority: -1,
    });
    expect(result.source).not.toContain('const meta');
    expect(result.source).toContain('export const retained = 42;');
    expect(result.code).not.toContain('meta');
    expect(result.code).toContain('retained');
  });

  it('starts from path-derived defaults that the authored export may override', async () => {
    const options: ComponentMetaPluginOptions = {
      defaults: (module) => ({ name: basename(module.filename, '.tsx').replace(/^\0/, ''), type: 'component' }),
    };
    const defaults = await build(`export const meta = { title: 'Poster' } as const;`, options);
    const override = await build(`export const meta = { name: 'poster', title: 'Poster' } as const;`, options);

    expect(readModuleBuildMeta(defaults.meta)?.moduleMeta).toEqual({
      name: 'fixture',
      type: 'component',
      title: 'Poster',
    });
    expect(readModuleBuildMeta(override.meta)?.moduleMeta).toEqual({
      name: 'poster',
      type: 'component',
      title: 'Poster',
    });
  });

  it('rejects metadata that requires evaluation', async () => {
    await expect(build(`const name = 'poster'; export const meta = { name };`)).rejects.toThrow(
      'must contain only static literal values'
    );
  });
});

async function build(
  source: string,
  options: ComponentMetaPluginOptions = {}
): Promise<{ code: string; meta: unknown; source: string | undefined }> {
  let meta: unknown;
  let transformedSource: string | undefined;
  const inspect: Plugin = {
    name: 'fixture:inspect',
    buildEnd() {
      const info = this.getModuleInfo(MODULE_ID);

      meta = info?.meta;
      transformedSource = info?.code ?? undefined;
    },
  };
  const bundle = await rolldown({
    input: 'fixture',
    experimental: { nativeMagicString: true },
    plugins: [fixturePlugin(source), componentMetaPlugin(options), inspect],
  });
  const output = await bundle.generate({ format: 'es' });
  const chunk = output.output.find((item): item is OutputChunk => item.type === 'chunk');
  if (!chunk) throw new Error('Fixture build did not emit a chunk.');

  return { code: chunk.code, meta, source: transformedSource };
}

function fixturePlugin(source: string): Plugin {
  return {
    name: 'fixture:module',
    resolveId(id) {
      return id === 'fixture' ? MODULE_ID : null;
    },
    load(id) {
      return id === MODULE_ID ? { code: source, moduleType: 'tsx' } : null;
    },
  };
}
