import { describe, expect, it } from 'vitest';

import { buildChannelCustomData, buildItemCustomData, escapeXml, FEEDS } from '../rssFeed';

describe('escapeXml', () => {
  it('escapes everything that would break out of a text node or attribute', () => {
    expect(escapeXml(`<a href="x?a=1&b=2">it's</a>`)).toBe(
      '&lt;a href=&quot;x?a=1&amp;b=2&quot;&gt;it&apos;s&lt;/a&gt;'
    );
  });
});

describe('FEEDS', () => {
  it('names each feed with enough context to stand out in a reader', () => {
    expect(Object.values(FEEDS).map((feed) => feed.title)).toEqual(['Video.js Blog', 'Video.js Changelog']);
  });
});

describe('buildChannelCustomData', () => {
  const metadata = {
    title: 'Video.js Changelog',
    feedUrl: new URL('https://videojs.org/changelog/rss.xml'),
    pageUrl: new URL('https://videojs.org/changelog'),
    lastBuildDate: new Date('2026-10-01T00:00:00Z'),
  };

  it('links the feed to itself', () => {
    expect(buildChannelCustomData(metadata)).toContain(
      '<atom:link href="https://videojs.org/changelog/rss.xml" rel="self" type="application/rss+xml"/>'
    );
  });

  it('dates the feed by its newest item', () => {
    expect(buildChannelCustomData(metadata)).toContain('<lastBuildDate>Thu, 01 Oct 2026 00:00:00 GMT</lastBuildDate>');
    expect(buildChannelCustomData({ ...metadata, lastBuildDate: undefined })).not.toContain('lastBuildDate');
  });

  it('declares a language and an image', () => {
    const xml = buildChannelCustomData(metadata);

    expect(xml).toContain('<language>en-us</language>');
    expect(xml).toContain(
      '<image><url>https://videojs.org/apple-touch-icon.png</url><title>Video.js Changelog</title><link>https://videojs.org/changelog</link></image>'
    );
  });
});

describe('buildItemCustomData', () => {
  it('credits each author by name', () => {
    expect(buildItemCustomData({ creators: ['Steve Heffernan', "Pat O'Neill"] })).toBe(
      '<dc:creator>Steve Heffernan</dc:creator><dc:creator>Pat O&apos;Neill</dc:creator>'
    );
  });

  it('offers a card image when there is one', () => {
    expect(buildItemCustomData({ imageUrl: 'https://videojs.org/_astro/og.png' })).toBe(
      '<media:content url="https://videojs.org/_astro/og.png" medium="image"/>'
    );
    expect(buildItemCustomData({})).toBe('');
  });
});
