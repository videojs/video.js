import { basename } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { readModuleBuildMeta } from '../../graph/build-meta';
import { type ComponentMetaPluginOptions, componentMetaPlugin } from '../component-meta';
import { buildFixture } from './helpers/lower';

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

  it('reads an export whose name is spelled with Unicode escapes', async () => {
    const result = await build(`export const m\\u0065ta = { title: 'Poster' } as const;`, {
      defaults: () => ({ name: 'fixture', type: 'component' }),
    });

    expect(readModuleBuildMeta(result.meta)?.moduleMeta).toEqual({
      name: 'fixture',
      type: 'component',
      title: 'Poster',
    });
    expect(result.source).not.toContain('Poster');
  });

  it('rejects metadata that requires evaluation', async () => {
    await expect(build(`const name = 'poster'; export const meta = { name };`)).rejects.toThrow(
      'must contain only static literal values'
    );
  });
});

async function build(
  input: string,
  options: ComponentMetaPluginOptions = {}
): Promise<{ code: string; meta: unknown; source: string | undefined }> {
  return buildFixture(input, { plugins: [componentMetaPlugin(options)] });
}
