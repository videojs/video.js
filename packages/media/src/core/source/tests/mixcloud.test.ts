import { describe, expect, it } from 'vite-plus/test';

import { parseMixcloudSource } from '../mixcloud';

const SHOW = 'https://www.mixcloud.com/spartacus/lambiance/';
const KEY = '/spartacus/lambiance/';

describe('parseMixcloudSource', () => {
  it('parses a show URL into its key', () => {
    expect(parseMixcloudSource(SHOW)).toEqual({ key: KEY, params: {} });
  });

  it('drops the query, the fragment, and a missing trailing slash', () => {
    expect(parseMixcloudSource('https://www.mixcloud.com/spartacus/lambiance?utm_source=widget#comments')?.key).toBe(
      KEY
    );
  });

  it('reads the bare and m. hosts, http, and a URL without a scheme as mixcloud.com', () => {
    expect(parseMixcloudSource('https://mixcloud.com/spartacus/lambiance/')?.key).toBe(KEY);
    expect(parseMixcloudSource('https://m.mixcloud.com/spartacus/lambiance/')?.key).toBe(KEY);
    expect(parseMixcloudSource('http://www.mixcloud.com/spartacus/lambiance/')?.key).toBe(KEY);
    expect(parseMixcloudSource('mixcloud.com/spartacus/lambiance')?.key).toBe(KEY);
  });

  it('keeps the case and percent-encoding of the key', () => {
    expect(parseMixcloudSource('https://www.mixcloud.com/Defectedrecords/defected-radio-show/')?.key).toBe(
      '/Defectedrecords/defected-radio-show/'
    );
    expect(parseMixcloudSource('https://www.mixcloud.com/haukai/%E5%85%A8-mix/')?.key).toBe('/haukai/%E5%85%A8-mix/');
  });

  it("parses Mixcloud's embed URL, whose feed is a key or a show URL, keeping its parameters", () => {
    expect(
      parseMixcloudSource(`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(SHOW)}&hide_cover=1`)
    ).toEqual({ key: KEY, params: { hide_cover: '1' } });
    expect(
      parseMixcloudSource(`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(KEY)}&mini=1&light=1`)
    ).toEqual({ key: KEY, params: { mini: '1', light: '1' } });
  });

  it('parses an embed URL on the widget host', () => {
    expect(parseMixcloudSource(`https://player-widget.mixcloud.com/?feed=${encodeURIComponent(KEY)}`)?.key).toBe(KEY);
    expect(parseMixcloudSource(`https://player-widget.mixcloud.com/widget/iframe/?feed=${KEY}`)?.key).toBe(KEY);
  });

  it.each([
    ['an empty string', ''],
    ['a profile', 'https://www.mixcloud.com/spartacus/'],
    ['a profile page', 'https://www.mixcloud.com/spartacus/favorites/'],
    ['a playlist', 'https://www.mixcloud.com/spartacus/playlists/cinematic/'],
    ['a site page with a show shape', 'https://www.mixcloud.com/discover/trending/'],
    ['an extra path segment', 'https://www.mixcloud.com/spartacus/lambiance/comments/'],
    ['an embed URL without a feed', 'https://www.mixcloud.com/widget/iframe/?hide_cover=1'],
    ['an embed URL whose feed is a profile', 'https://www.mixcloud.com/widget/iframe/?feed=%2Fspartacus%2F'],
    [
      'an embed URL whose feed is elsewhere',
      `https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fexample.com${KEY}`,
    ],
    ['a page on the widget host', `https://player-widget.mixcloud.com${KEY}`],
    ['the API host', `https://api.mixcloud.com${KEY}`],
    ['another domain', `https://example.com${KEY}`],
    ['a lookalike domain', `https://mixcloud.com.example.com${KEY}`],
    ['a non-http URL', `ftp://www.mixcloud.com${KEY}`],
  ])('returns null for %s', (_, src) => {
    expect(parseMixcloudSource(src)).toBe(null);
  });
});
