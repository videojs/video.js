import { describe, expect, it } from 'vite-plus/test';

import { parseVidyardSource } from '../vidyard';

const UUID = 'YBvcF2BEfvKdowmfrRwk57';

describe('parseVidyardSource', () => {
  it('parses a bare player UUID', () => {
    expect(parseVidyardSource(UUID)).toEqual({ uuid: UUID, params: {} });
  });

  it('parses the vidyard/<uuid> shorthand', () => {
    expect(parseVidyardSource(`vidyard/${UUID}`)).toEqual({ uuid: UUID, params: {} });
  });

  it.each([
    `https://share.vidyard.com/watch/${UUID}`,
    `https://video.vidyard.com/watch/${UUID}`,
    `https://acme.hubs.vidyard.com/watch/${UUID}`,
    `https://play.vidyard.com/${UUID}`,
    `https://play.vidyard.com/${UUID}.html`,
    `https://embed.vidyard.com/share/${UUID}`,
    `http://share.vidyard.com/watch/${UUID}/`,
    `share.vidyard.com/watch/${UUID}`,
    `//play.vidyard.com/${UUID}`,
    `https://Share.Vidyard.com/watch/${UUID}#comments`,
  ])('parses %s', (src) => {
    expect(parseVidyardSource(src)).toEqual({ uuid: UUID, params: {} });
  });

  it('keeps the query of a URL as player parameters', () => {
    expect(parseVidyardSource(`https://share.vidyard.com/watch/${UUID}?second=30&cc=en`)).toEqual({
      uuid: UUID,
      params: { second: '30', cc: 'en' },
    });
  });

  it.each([
    ['an empty string', ''],
    ['a short word', 'vidyard'],
    ['a UUID with other characters', 'YBvcF2BEfvKd.owmfrRwk57'],
    ['the embed script', 'https://play.vidyard.com/embed/v4.js'],
    ['a thumbnail', `https://play.vidyard.com/${UUID}.jpg`],
    ['the metadata endpoint', `https://play.vidyard.com/player/${UUID}.json`],
    ['a page without a video', 'https://www.vidyard.com/pricing/'],
    ['a sharing page with more path', `https://share.vidyard.com/watch/${UUID}/extra`],
    ['a lookalike host', `https://share.notvidyard.com/watch/${UUID}`],
    ['another host', `https://example.com/watch/${UUID}`],
    ['a non-web scheme', `ftp://play.vidyard.com/${UUID}`],
  ])('returns null for %s', (_, src) => {
    expect(parseVidyardSource(src)).toBe(null);
  });
});
