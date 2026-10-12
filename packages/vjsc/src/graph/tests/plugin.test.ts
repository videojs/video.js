import { type Plugin, rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { defineGraphPlugin, findGraph } from '../plugin';
import type { Graph } from '../types';

describe('findGraph', () => {
  it('locates the VJSC graph through a host plugin list', () => {
    const graph = {
      root: '/project',
      modules: new Map(),
      assets: new Map(),
    } satisfies Graph;

    expect(findGraph([null, 'plugin', { name: 'other' }, { name: 'vjsc', api: graph }])).toBe(graph);
  });
});

describe('defineGraphPlugin', () => {
  const graph = { root: '/project', modules: new Map(), assets: new Map() } satisfies Graph;
  const vjsc: Plugin & { readonly api: Graph } = { name: 'vjsc', api: graph };
  const entry: Plugin = {
    name: 'fixture:entry',
    resolveId: (id) => (id === 'entry' ? '\0entry' : null),
    load: (id) => (id === '\0entry' ? 'export {};' : null),
  };

  it('hands the finalized graph to its generator while the bundle is written', async () => {
    let received: Graph | undefined;
    const bundle = await rolldown({
      input: 'entry',
      plugins: [
        entry,
        vjsc,
        defineGraphPlugin({
          name: 'fixture:consumer',
          generate(current) {
            received = current;
            this.emitFile({ type: 'asset', fileName: 'report.txt', source: String(current.modules.size) });
          },
        }),
      ],
    });
    const output = await bundle.generate({});

    expect(received).toBe(graph);
    expect(output.output.some((file) => file.fileName === 'report.txt')).toBe(true);
  });

  it('fails the build without a vjscPlugin', async () => {
    const bundle = await rolldown({
      input: 'entry',
      plugins: [entry, defineGraphPlugin({ name: 'fixture:consumer', generate() {} })],
    });

    await expect(bundle.generate({})).rejects.toThrow('`fixture:consumer` requires vjscPlugin in the same build.');
  });
});
