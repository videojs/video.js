import { SourceMap, type SourceMapPayload } from 'node:module';

import { type OutputAsset, type OutputChunk, type Plugin, RolldownMagicString, rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { inlineTemplatePlugin } from '../../../../build/plugins/inline-template-plugin';
import { CDN_I18N_REGISTRY, cdnI18nExternalPlugin } from '../cdn-i18n-external-plugin';

const ENTRY_ID = 'native-magic-string-fixture.js';

describe('inlineTemplatePlugin', () => {
  it('returns the host MagicString directly', () => {
    const source = 'export const template = /*html*/ `<div>  </div>`;';
    const magicString = new RolldownMagicString(source);
    const result = inlineTemplatePlugin().transform?.(source, 'fixture.ts', { magicString });

    expect(result?.code).toBe(magicString);
    expect(result?.map).toBeUndefined();
  });

  it('returns native edits with a composed source map', async () => {
    const source = `export const template = /*html*/ \`
        <div>
          <span></span>
        </div>
      \`;
MAP_SENTINEL(template);`;
    const { chunk, map } = await build(source, inlineTemplatePlugin());
    const generated = tokenPosition(chunk.code, 'MAP_SENTINEL');
    const original = tokenPosition(source, 'MAP_SENTINEL');

    expect(chunk.code).toContain('`<div><span></span></div>`');
    expect(chunk.code.indexOf('MAP_SENTINEL')).toBeLessThan(source.indexOf('MAP_SENTINEL'));
    expect(generated.line).toBeLessThan(original.line);
    expect(new SourceMap(map).findEntry(generated.line, generated.column)).toMatchObject({
      originalSource: `../${ENTRY_ID}`,
      originalLine: original.line,
      originalColumn: original.column,
    });
  });

  it('fails clearly when native MagicString is unavailable', () => {
    const source = 'export const template = /*html*/ `<div>  </div>`;';

    expect(() => inlineTemplatePlugin().transform?.(source, 'fixture.ts')).toThrow(
      'inline-template requires experimental.nativeMagicString: true.'
    );
  });
});

describe('cdnI18nExternalPlugin', () => {
  it('returns the host render-chunk MagicString directly', () => {
    const source = `export { getI18n } from "${CDN_I18N_REGISTRY}";`;
    const magicString = new RolldownMagicString(source);
    const result = cdnI18nExternalPlugin({ prod: true }).renderChunk?.(
      source,
      { fileName: 'media/video.js' },
      undefined,
      { magicString }
    );

    expect(result?.code).toBe(magicString);
    expect(result?.map).toBeUndefined();
  });

  it('returns native render-chunk edits with a composed source map', async () => {
    const { chunk, map } = await build(
      `import { getI18n } from '@videojs/core/i18n'; globalThis.getI18n = getI18n;`,
      cdnI18nExternalPlugin({ prod: true })
    );

    expect(chunk.code).toContain('from "./i18n.js"');
    expect(chunk.code).not.toContain(CDN_I18N_REGISTRY);
    expect(map.mappings).not.toBe('');
    expect(map.sources.length).toBeGreaterThan(0);
  });

  it('fails clearly when native render metadata is unavailable', () => {
    const source = `export { getI18n } from "${CDN_I18N_REGISTRY}";`;

    expect(() => cdnI18nExternalPlugin({ prod: true }).renderChunk?.(source, { fileName: 'media/video.js' })).toThrow(
      'cdn-i18n-external requires experimental.nativeMagicString: true.'
    );
  });
});

function tokenPosition(source: string, token: string) {
  const index = source.indexOf(token);

  expect(index).toBeGreaterThanOrEqual(0);

  const lines = source.slice(0, index).split('\n');

  return { line: lines.length - 1, column: lines.at(-1)!.length };
}

async function build(source: string, plugin: Plugin): Promise<{ chunk: OutputChunk; map: SourceMapPayload }> {
  const bundle = await rolldown({
    input: ENTRY_ID,
    experimental: { nativeMagicString: true },
    plugins: [fixturePlugin(source), plugin],
  });
  const output = await bundle.generate({ format: 'es', sourcemap: true });
  const chunk = output.output.find((item): item is OutputChunk => item.type === 'chunk');
  const map = output.output.find(
    (item): item is OutputAsset => item.type === 'asset' && item.fileName.endsWith('.map')
  );

  if (!chunk) throw new Error('Expected fixture build to emit a chunk.');

  if (!map) throw new Error('Expected fixture build to emit a source map.');

  await bundle.close();

  // SAFETY: Rolldown emitted this serialized Source Map v3 asset with sourcemap enabled.
  return { chunk, map: JSON.parse(String(map.source)) as SourceMapPayload };
}

function fixturePlugin(source: string): Plugin {
  return {
    name: 'native-magic-string-fixture',
    resolveId(id) {
      return id === ENTRY_ID ? id : null;
    },
    load(id) {
      return id === ENTRY_ID ? source : null;
    },
  };
}
