import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rolldown } from 'rolldown';
import { build } from 'vite-plus/pack';
import { describe, expect, it } from 'vite-plus/test';

import { vjscComponentSchemaPlugin } from '..';

describe('vjscComponentSchemaPlugin', () => {
  it('creates a schema entry directly from inline bundler configuration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-component-schema-plugin-'));
    const sourceDir = join(root, 'play-button');
    const source = join(sourceDir, 'play-button-component.ts');
    const existing = join(root, 'existing.ts');

    mkdirSync(sourceDir);
    writeFileSync(existing, 'export const existing = true;');
    writeFileSync(
      source,
      `const defineComponent: any = (value: any) => value; export default defineComponent({ name: 'PlayButton' });`
    );
    const plugin = vjscComponentSchemaPlugin({
      source: '@fixture/components',
      include: ['./*/*-component.ts'],
    });

    const bundle = await rolldown({
      cwd: root,
      input: { existing },
      experimental: { nativeMagicString: true },
      plugins: [plugin],
    });
    const output = await bundle.generate({ format: 'es' });
    const chunks = output.output.filter((item) => item.type === 'chunk');
    const schema = chunks.find((chunk) => chunk.fileName === 'component-schema.js');

    expect(chunks.map((chunk) => chunk.fileName).sort()).toEqual(['component-schema.js', 'existing.js']);
    expect(schema?.code).toContain('PlayButton');
  });

  it('provides its companion declaration to the host build', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-component-schema-plugin-'));
    const sourceDir = join(root, 'play-button');

    mkdirSync(sourceDir);
    writeFileSync(
      join(sourceDir, 'play-button-component.ts'),
      `const defineComponent: any = (value: any) => value; export default defineComponent({ name: 'PlayButton' });`
    );
    writeFileSync(
      join(sourceDir, 'play-button-component.d.ts'),
      `declare const manifest: { name: 'PlayButton' }; export default manifest;`
    );
    const plugin = vjscComponentSchemaPlugin({
      file: 'schema',
      declaration: true,
      source: '@fixture/components',
      include: ['./*/*-component.ts'],
    });
    const results = await build({
      cwd: root,
      entry: { fixture: join(sourceDir, 'play-button-component.ts') },
      format: 'es',
      platform: 'neutral',
      dts: {
        generator: 'tsgo',
        tsconfig: join(process.cwd(), 'tsconfig.json'),
        entry: ['does-not-match.ts'],
      },
      deps: { neverBundle: ['vjsc/components'] },
      // Vite+ pack owns a newer compatible Rolldown type instance than this package.
      plugins: [plugin],
      unbundle: true,
      write: false,
      clean: false,
      report: false,
    });
    const declaration = results.bundles
      .flatMap((bundle) => bundle.chunks)
      .find((chunk) => /\.d\.[cm]?ts$/.test(chunk.fileName));
    if (declaration?.type !== 'chunk') throw new Error('The host build did not emit the schema declaration');

    expect(declaration.code).toContain('declare const PlayButton');
  });
});
