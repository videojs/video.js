// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import * as fs from 'node:fs';

import { mdxToJs } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { satteriConditionalHeadings } from '../satteriConditionalHeadings';

interface Heading {
  depth: number;
  text: string;
  slug: string;
  frameworks?: string[];
  styles?: string[];
}

function collect(source: string): Heading[] {
  const data = {
    astro: {
      frontmatter: {} as Record<string, unknown>,
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };

  mdxToJs(source, { mdastPlugins: [satteriConditionalHeadings()], data });
  return (data.astro.frontmatter.conditionalHeadings ?? []) as Heading[];
}

describe('satteriConditionalHeadings', () => {
  it('collects headings with github-style slugs in document order', () => {
    const headings = collect('## Hello World\n\n### Nested Heading');

    expect(headings).toEqual([
      { depth: 2, text: 'Hello World', slug: 'hello-world' },
      { depth: 3, text: 'Nested Heading', slug: 'nested-heading' },
    ]);
  });

  it('attaches framework context from an enclosing FrameworkCase', () => {
    const headings = collect(
      '## Shared\n\n<FrameworkCase frameworks={["react"]}>\n\n## React Only\n\n</FrameworkCase>'
    );

    expect(headings).toEqual([
      { depth: 2, text: 'Shared', slug: 'shared' },
      { depth: 2, text: 'React Only', slug: 'react-only', frameworks: ['react'] },
    ]);
  });

  it('attaches style context from an enclosing StyleCase', () => {
    const headings = collect('<StyleCase styles={["css"]}>\n\n## CSS Only\n\n</StyleCase>');

    expect(headings.find((h) => h.text === 'CSS Only')?.styles).toEqual(['css']);
  });

  it('injects i18n utility headings without an explicit slug', () => {
    const dir = new URL('../../content/generated-util-reference/', import.meta.url);
    const file = new URL('register-i18n.json', dir);
    const dirExisted = fs.existsSync(dir);
    const previous = fs.existsSync(file) ? fs.readFileSync(file) : undefined;

    fs.mkdirSync(dir, { recursive: true });

    try {
      fs.writeFileSync(
        file,
        JSON.stringify({
          name: 'registerI18n',
          overloads: [
            {
              parameters: { locale: { type: 'string', required: true } },
              returnValue: { type: 'void' },
            },
          ],
        })
      );

      const headings = collect('<UtilReference util="registerI18n" />');

      expect(headings).toEqual([
        { depth: 2, text: 'API Reference', slug: 'api-reference' },
        { depth: 3, text: 'Parameters', slug: 'parameters' },
        { depth: 3, text: 'Return Value', slug: 'return-value' },
      ]);
    } finally {
      if (previous) {
        fs.writeFileSync(file, previous);
      } else {
        fs.rmSync(file, { force: true });
      }

      if (!dirExisted) fs.rmdirSync(dir);
    }
  });

  it('injects headings rendered by installation components', () => {
    const headings = collect('<SkinPickerSection />\n\n<SourceMediaInstall client:idle />');

    expect(headings).toEqual([
      { depth: 3, text: 'Choose your skin', slug: 'choose-your-skin' },
      { depth: 3, text: 'Install the media adapter', slug: 'install-the-media-adapter' },
    ]);
  });
});
