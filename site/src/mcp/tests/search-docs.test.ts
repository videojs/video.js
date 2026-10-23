// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderSearchHits, searchCorpus, searchDocs, splitCorpus } from '../search-docs';

const CORPUS = `# Video.js v10 — React Documentation (complete)

---

<!-- Source: https://videojs.org/docs/framework/react/guides/customize-skins -->

# Customize skins

## Change the accent color

Set \`--media-accent-color\` on the player.

---

<!-- Source: https://videojs.org/docs/framework/react/reference/components/time-slider -->

# Time Slider

## CSS custom properties

\`--media-slider-fill\` sets the fill.
`;

function algoliaHit() {
  return {
    url: 'https://videojs.org/docs/framework/react/guides/captions#add-a-track',
    url_without_anchor: 'https://videojs.org/docs/framework/react/guides/captions',
    anchor: 'add-a-track',
    content: 'Use a track element.',
    framework: ['react'],
    hierarchy: { lvl0: 'Guides', lvl1: 'Captions', lvl2: 'Add a track' },
    _snippetResult: { content: { value: 'Use a track element…' } },
  };
}

describe('splitCorpus', () => {
  it('splits an llms-full corpus into pages at its source markers', () => {
    const pages = splitCorpus(CORPUS);

    expect(pages.map(({ url }) => url)).toEqual([
      'https://videojs.org/docs/framework/react/guides/customize-skins',
      'https://videojs.org/docs/framework/react/reference/components/time-slider',
    ]);
    expect(pages[1]!.lines).toContain('# Time Slider');
  });
});

describe('searchCorpus', () => {
  it('finds an exact identifier with its page title and nearest heading', () => {
    expect(searchCorpus(splitCorpus(CORPUS), '--media-slider-fill', 5, 'react')).toEqual([
      {
        title: 'Time Slider › CSS custom properties',
        url: 'https://videojs.org/docs/framework/react/reference/components/time-slider',
        section: 'css-custom-properties',
        snippet: '`--media-slider-fill` sets the fill.',
        framework: 'react',
      },
    ]);
  });

  it('matches case-sensitively and stops at the limit', () => {
    expect(searchCorpus(splitCorpus(CORPUS), '--MEDIA', 5)).toEqual([]);
    expect(searchCorpus(splitCorpus(CORPUS), '--media-', 1)).toHaveLength(1);
  });
});

describe('searchDocs', () => {
  it('queries Algolia with the framework filter and keeps one hit per section', async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      Response.json({ hits: [algoliaHit(), algoliaHit()] })
    );
    const result = await searchDocs(
      { query: 'captions', framework: 'react' },
      { fetch, origin: 'https://videojs.org' }
    );

    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toMatchObject({
      query: 'captions',
      facetFilters: ['framework:react'],
    });
    expect(result).toEqual({
      hits: [
        {
          title: 'Captions › Add a track',
          url: 'https://videojs.org/docs/framework/react/guides/captions',
          section: 'add-a-track',
          snippet: 'Use a track element…',
          framework: 'react',
        },
      ],
    });
  });

  it('greps the framework corpus for exact matches', async () => {
    const fetch = vi.fn(async () => new Response(CORPUS));
    const result = await searchDocs(
      { query: '--media-accent-color', match: 'exact', framework: 'react' },
      { fetch, origin: 'https://exact-corpus.test' }
    );

    expect(fetch).toHaveBeenCalledWith('https://exact-corpus.test/docs/framework/react/llms-full.txt');
    expect(result).toMatchObject({ hits: [{ section: 'change-the-accent-color' }] });
  });

  it('reports an unavailable search instead of an empty result', async () => {
    const fetch = vi.fn(async () => new Response('', { status: 503 }));

    expect(await searchDocs({ query: 'x' }, { fetch, origin: 'https://down.test' })).toEqual({
      error: 'Search is unavailable right now (503). Try again.',
    });
    expect(await searchDocs({ query: 'x', match: 'exact' }, { fetch, origin: 'https://down.test' })).toEqual({
      error: 'Exact search is unavailable right now. Use `match: "fuzzy"` instead.',
    });
  });

  it('rejects an empty query', async () => {
    expect(await searchDocs({ query: '  ' }, { fetch: vi.fn(), origin: 'https://videojs.org' })).toEqual({
      error: 'Pass a non-empty `query`.',
    });
  });
});

describe('renderSearchHits', () => {
  it('suggests a next step and feedback when nothing matched', () => {
    const text = renderSearchHits({ hits: [] }, { query: 'drm' });

    expect(text).toContain('No results for "drm"');
    expect(text).toContain('match: "exact"');
    expect(text).toContain('send_feedback');
  });

  it('lists each hit with the section to read', () => {
    expect(
      renderSearchHits(
        { hits: [{ title: 'Captions', url: 'https://videojs.org/c', section: 'add', snippet: 'Use…' }] },
        { query: 'captions' }
      )
    ).toBe('- **Captions**\n  https://videojs.org/c (section: `add`)\n  Use…');
  });
});
