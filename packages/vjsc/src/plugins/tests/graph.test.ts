import { resolve } from 'node:path';

import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { createGraphCapability, graphPlugin } from '../graph';

describe('graphPlugin', () => {
  it('captures modules in the order of their root-relative identities, whatever order the bundler lists them', async () => {
    const [zeta, alpha, mid] = ['zeta', 'alpha', 'mid'].map(
      (name) => `${resolve(import.meta.dirname, `fixtures/order-${name}.ts`)}?target=react`
    );
    const graph = createGraphCapability();
    const bundle = await rolldown({
      input: [zeta!, alpha!, mid!],
      plugins: [
        {
          name: 'fixture',
          resolveId: (source) => ([zeta, alpha, mid].includes(source) ? source : null),
          load: (source) => ([zeta, alpha, mid].includes(source) ? 'export const value = true;' : null),
        },
        graphPlugin({ capability: graph }),
      ],
    });

    await bundle.generate({ format: 'es' });

    expect([...graph.api.modules.keys()]).toEqual([alpha, mid, zeta]);
  });

  it('reads stylesheet ownership from final transformed imports', async () => {
    const filename = resolve(import.meta.dirname, 'fixtures/graph-entry.ts');
    const id = `${filename}?target=react`;
    const styleId = 'virtual:vjsc/css/asset/current/audio%2Fbuttons.css';
    const graph = createGraphCapability();
    const bundle = await rolldown({
      input: id,
      plugins: [
        {
          name: 'fixture',
          resolveId(source) {
            if (source === id) return source;

            if (source === styleId) return `\0${source}`;

            return null;
          },
          load(source) {
            if (source === id) return `import ${JSON.stringify(styleId)};\nexport const value = true;`;

            if (source === `\0${styleId}`) return { code: 'export default ".current {}";', moduleType: 'js' };

            return null;
          },
        },
        graphPlugin({ capability: graph }),
      ],
    });

    await bundle.generate({ format: 'es' });

    expect(graph.api.modules.get(id)?.styles).toEqual({
      files: ['audio/buttons.css'],
      assets: [styleId],
    });

    await bundle.close();
  });
});
