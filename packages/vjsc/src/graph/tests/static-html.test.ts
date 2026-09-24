import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { generateStaticHtml } from '../static-html';
import type { Graph } from '../types';

describe('generateStaticHtml', () => {
  it('renders a component and its captured dependencies, ignoring authoring and style imports', async () => {
    const root = resolve(import.meta.dirname, 'fixture');
    const entryId = `${root}/entry.tsx?target=html`;
    const buttonId = `${root}/button.tsx?target=html`;
    const entrySource = `/** @jsxImportSource vjsc/html-runtime */
import 'virtual:vjsc/css/asset/0123456789ab/buttons.css';
import { Box } from 'vjsc/components';
import { Button } from './button';
export function Example() { return <section><Button /><img src="poster.jpg" /></section>; }`;
    const buttonSource = `/** @jsxImportSource vjsc/html-runtime */
export function Button() { return <button>Play</button>; }`;
    const graph: Graph = {
      root,
      modules: new Map([
        [
          entryId,
          {
            id: entryId,
            filename: `${root}/entry.tsx`,
            sourcePath: 'entry.tsx',
            params: { target: 'html' },
            source: entrySource,
            imports: [{ ...importReference(entrySource, './button'), resolvedId: buttonId }],
            styles: { files: [], assets: [] },
            exports: [],
            annotations: {},
          },
        ],
        [
          buttonId,
          {
            id: buttonId,
            filename: `${root}/button.tsx`,
            sourcePath: 'button.tsx',
            params: { target: 'html' },
            source: buttonSource,
            imports: [],
            styles: { files: [], assets: [] },
            exports: [],
            annotations: {},
          },
        ],
      ]),
      assets: new Map(),
    };

    const output = await generateStaticHtml(graph, [{ name: 'example', moduleId: entryId, exportName: 'Example' }]);

    expect(output.get('example')?.html).toBe('<section>\n<button>Play</button>\n<img src="poster.jpg">\n</section>');
    expect([...(output.get('example')?.elements ?? [])]).toEqual(['section', 'button', 'img']);
  });
});

function importReference(source: string, specifier: string) {
  const start = source.indexOf(`'${specifier}'`);

  return { specifier, kind: 'static' as const, start, end: start + specifier.length + 2, quote: "'", bindings: [] };
}
