// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import { mdxToJs } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { satteriRelatedLinks } from '../satteriRelatedLinks';

function compile(source: string): string {
  const data = {
    astro: {
      frontmatter: {},
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };
  const { code } = mdxToJs(source, { mdastPlugins: [satteriRelatedLinks()], data });

  return code;
}

const related = `## Related components

- <DocsLink slug="reference/components/play-button">Play button</DocsLink>

## Related guides

- <DocsLink slug="guides/features">Features</DocsLink>
- <DocsLink slug="guides/autoplay" anchor="how-it-works">Autoplay</DocsLink>
`;

describe('satteriRelatedLinks', () => {
  it('folds the related sections into one heading with a labelled grid per group', () => {
    const code = compile(related);

    expect(code.match(/_jsx\(RelatedLinks/g)?.length).toBe(2);
    expect(code).toContain('Related pages');
    expect(code).not.toContain('Related components');
    expect(code).not.toContain('Related guides');
    expect(code).toContain('label: "Components"');
    expect(code).toContain('label: "Guides"');
    expect(code).toContain('guides/features');
    expect(code).toContain('how-it-works');
    expect(code).not.toContain('DocsLink');
  });

  it('finds the related sections after the rest of the guide', () => {
    const code = compile(`## Overview\n\nIntro with an é.\n\n## Usage\n\n- Step one\n\n${related}`);

    expect(code.match(/_jsx\(RelatedLinks/g)?.length).toBe(2);
    expect(code).toContain('Related pages');
    expect(code).not.toContain('Related components');
    expect(code).not.toContain('DocsLink');
  });

  it('records the frameworks an item is limited to', () => {
    const code = compile(
      '## Related API\n\n- <DocsLink slug="reference/api/use-player" frameworks="react">usePlayer</DocsLink>\n- <DocsLink slug="reference/api/player-controller" frameworks="html">PlayerController</DocsLink>\n'
    );

    expect(code).toContain('\\"frameworks\\":[\\"react\\"]');
    expect(code).toContain('\\"frameworks\\":[\\"html\\"]');
  });

  it('gives a bare Related heading no group label', () => {
    const code = compile('## Related\n\n- <DocsLink slug="guides/features">Features</DocsLink>\n');

    expect(code).toContain('Related pages');
    expect(code).not.toContain('label:');
  });

  it('leaves lists under other headings alone', () => {
    const code = compile('## Steps\n\n- <DocsLink slug="guides/features">Features</DocsLink>\n');

    expect(code).not.toContain('RelatedLinks');
    expect(code).toContain('DocsLink');
  });

  it('leaves a related section alone when an item is not a lone DocsLink', () => {
    const code = compile('## Related guides\n\n- <DocsLink slug="guides/features">Features</DocsLink> and more\n');

    expect(code).not.toContain('RelatedLinks');
    expect(code).toContain('Related guides');
    expect(code).toMatch(/_jsxs\(_components\.li,/);
    expect(code).toMatch(/_jsx\(DocsLink,\s*\{\s*slug: "guides\/features",\s*children: "Features"\s*\}\)/);
    expect(code).toContain(' and more');
  });
});
