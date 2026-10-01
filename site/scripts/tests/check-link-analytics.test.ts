import { describe, expect, it } from 'vite-plus/test';

import { findUntaggedLinks } from '../check-link-analytics.ts';

describe('findUntaggedLinks', () => {
  it('accepts tagged off-site links and a Mux link with a placement', () => {
    const html = [
      '<a href="https://github.com/videojs/v10" data-ph-capture-attribute-destination="github">GitHub</a>',
      '<a data-ph-capture-attribute-destination="mux" href="https://www.mux.com/?utm_source=videojs&amp;utm_content=footer">Mux</a>',
    ].join('');

    expect(findUntaggedLinks(html)).toEqual([]);
  });

  it('ignores on-site, relative, fragment, and non-web links', () => {
    const html = [
      '<a href="/docs">Docs</a>',
      '<a href="#install">Install</a>',
      '<a href="https://videojs.org/blog">Blog</a>',
      '<a href="https://main.videojs.org/docs">Pre-release</a>',
      '<a href="mailto:hello@example.com">Email</a>',
    ].join('');

    expect(findUntaggedLinks(html)).toEqual([]);
  });

  it('reports an off-site link without a destination', () => {
    expect(findUntaggedLinks('<a\n  href="https://news.ycombinator.com/item?id=1"\n  target="_blank">HN</a>')).toEqual([
      { href: 'https://news.ycombinator.com/item?id=1', reason: 'missing-destination' },
    ]);
  });

  it('reports a Mux link without a placement', () => {
    const html =
      '<a href="https://www.mux.com/pricing?utm_source=videojs" data-ph-capture-attribute-destination="mux">';

    expect(findUntaggedLinks(html)).toEqual([
      { href: 'https://www.mux.com/pricing?utm_source=videojs', reason: 'missing-utm-content' },
    ]);
  });

  it('treats Mux media URLs as external, not Mux pages', () => {
    const html = '<a href="https://stream.mux.com/abc.m3u8" data-ph-capture-attribute-destination="external">';

    expect(findUntaggedLinks(html)).toEqual([]);
  });
});
