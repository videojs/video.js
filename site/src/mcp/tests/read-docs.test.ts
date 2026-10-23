// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { docsMarkdownUrl, extractSection, readDocs, renderReadDocs, resolveDocsPath } from '../read-docs';

const ORIGIN = 'https://videojs.org';

const PAGE = `# Captions

Intro.

## Add a track

Use a track element.

\`\`\`html
## not a heading
\`\`\`

### Track kinds

Subtitles and captions.

## Style captions

Use CSS.
`;

function fetchReturning(pages: Record<string, string>) {
  return vi.fn(async (url: string | URL | Request) => {
    const body = pages[String(url)];

    return body === undefined ? new Response('Not found', { status: 404 }) : new Response(body);
  });
}

describe('resolveDocsPath', () => {
  it('accepts site URLs, paths, and Markdown twins', () => {
    expect(resolveDocsPath('https://videojs.org/docs/framework/react/guides/captions#add-a-track', undefined)).toEqual({
      path: '/docs/framework/react/guides/captions',
      anchor: 'add-a-track',
    });
    expect(resolveDocsPath('/docs/framework/html/guides/captions.md', undefined)).toEqual({
      path: '/docs/framework/html/guides/captions',
    });
    expect(resolveDocsPath('docs/guides/installation/react', undefined)).toEqual({
      path: '/docs/guides/installation/react',
    });
  });

  it('resolves a framework-relative slug only when a framework is given', () => {
    expect(resolveDocsPath('reference/components/time-slider', 'react')).toEqual({
      path: '/docs/framework/react/reference/components/time-slider',
    });
    expect(resolveDocsPath('reference/components/time-slider', undefined)).toBeUndefined();
  });

  it('rejects paths outside the docs, blog, and changelog', () => {
    expect(resolveDocsPath('/api/health/mux', 'react')).toBeUndefined();
    expect(resolveDocsPath('/docs/../api/health/mux', 'react')).toBeUndefined();
  });

  it("keeps only a URL's path, so pages always load from the docs origin", () => {
    expect(resolveDocsPath('https://example.com/docs/x', 'react')).toEqual({ path: '/docs/x' });
  });
});

describe('docsMarkdownUrl', () => {
  it('points at the site twin by default', () => {
    expect(docsMarkdownUrl('/docs/framework/react/guides/captions', ORIGIN)).toBe(
      'https://videojs.org/docs/framework/react/guides/captions.md'
    );
  });

  it('points a versioned framework page at the docs shipped in its package', () => {
    expect(docsMarkdownUrl('/docs/framework/html/guides/captions', ORIGIN, '10.1.0')).toBe(
      'https://cdn.jsdelivr.net/npm/@videojs/html@10.1.0/docs/guides/captions.md'
    );
  });

  it('refuses versions that are not releases and pages packages do not ship', () => {
    expect(docsMarkdownUrl('/docs/framework/html/guides/captions', ORIGIN, '../../evil')).toBeUndefined();
    expect(docsMarkdownUrl('/docs/guides/installation/react', ORIGIN, '10.1.0')).toBeUndefined();
  });
});

describe('extractSection', () => {
  it('returns a heading through the next heading at the same level', () => {
    expect(extractSection(PAGE, 'add-a-track')).toEqual({
      markdown:
        '## Add a track\n\nUse a track element.\n\n```html\n## not a heading\n```\n\n### Track kinds\n\nSubtitles and captions.',
    });
  });

  it('matches heading text case-insensitively', () => {
    expect(extractSection(PAGE, 'style CAPTIONS')).toEqual({ markdown: '## Style captions\n\nUse CSS.' });
  });

  it('returns every match of a repeated heading under its parent headings', () => {
    const page = '# Slider\n\n## Root\n\n### Data attributes\n\nroot\n\n## Track\n\n### Data attributes\n\ntrack\n';

    expect(extractSection(page, 'data-attributes')).toEqual({
      markdown:
        '<!-- Under: Root -->\n\n### Data attributes\n\nroot\n\n<!-- Under: Track -->\n\n### Data attributes\n\ntrack',
    });
  });

  it('lists the page headings when nothing matches', () => {
    expect(extractSection(PAGE, 'missing')).toEqual({
      error: 'No heading matches "missing".',
      headings: ['Add a track', 'Track kinds', 'Style captions'],
    });
  });
});

describe('readDocs', () => {
  it('reads pages in order with their size', async () => {
    const fetch = fetchReturning({ [`${ORIGIN}/docs/framework/react/guides/captions.md`]: PAGE });
    const pages = await readDocs({ pages: ['guides/captions'], framework: 'react' }, { fetch, origin: ORIGIN });

    expect(pages).toEqual([
      {
        url: `${ORIGIN}/docs/framework/react/guides/captions.md`,
        status: 200,
        tokens: Math.ceil(PAGE.length / 4),
        markdown: PAGE,
      },
    ]);
  });

  it('reads the section named by a URL anchor', async () => {
    const fetch = fetchReturning({ [`${ORIGIN}/docs/framework/react/guides/captions.md`]: PAGE });
    const [page] = await readDocs(
      { pages: [`${ORIGIN}/docs/framework/react/guides/captions#style-captions`] },
      { fetch, origin: ORIGIN }
    );

    expect(page).toMatchObject({ status: 200, markdown: '## Style captions\n\nUse CSS.' });
  });

  it('points a missing page at search and reports unresolvable input', async () => {
    const pages = await readDocs(
      { pages: ['/docs/framework/react/guides/nope', 'guides/x'] },
      {
        fetch: fetchReturning({}),
        origin: ORIGIN,
      }
    );

    expect(pages[0]).toMatchObject({ status: 404, error: expect.stringContaining('search_docs') });
    expect(pages[1]).toMatchObject({ status: 400, error: expect.stringContaining('framework') });
  });

  it('reads at most five pages per call', async () => {
    const fetch = fetchReturning({});

    await readDocs(
      { pages: Array.from({ length: 8 }, (_, index) => `guides/p${index}`), framework: 'html' },
      {
        fetch,
        origin: ORIGIN,
      }
    );

    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('cuts later pages once the response budget runs out', async () => {
    const long = 'x'.repeat(70_000);
    const fetch = fetchReturning({
      [`${ORIGIN}/docs/framework/html/guides/a.md`]: long,
      [`${ORIGIN}/docs/framework/html/guides/b.md`]: long,
    });
    const [first, second] = await readDocs(
      { pages: ['guides/a', 'guides/b'], framework: 'html' },
      {
        fetch,
        origin: ORIGIN,
      }
    );

    expect(first).toMatchObject({ markdown: long });
    expect(second).toMatchObject({ truncated: true, markdown: 'x'.repeat(30_000) });
  });
});

describe('renderReadDocs', () => {
  it('separates pages and explains truncation and skipped pages', () => {
    const text = renderReadDocs(
      [
        { url: 'https://videojs.org/a.md', status: 200, tokens: 2, markdown: '# A', truncated: true },
        { url: 'https://videojs.org/b.md', status: 404, error: 'Page not found.' },
      ],
      3
    );

    expect(text).toContain('<!-- Source: https://videojs.org/a.md (about 2 tokens) -->\n\n# A');
    expect(text).toContain('Read this page again with `section`');
    expect(text).toContain('Error (404): Page not found.');
    expect(text).toContain('3 more pages skipped');
  });
});
