import { describe, expect, it } from 'vite-plus/test';

import { parseSoundCloudSource } from '../soundcloud';

const TRACK = 'https://soundcloud.com/forss/flickermood';
const SET = 'https://soundcloud.com/forss/sets/soulhack';

function widgetUrl(url: string, params = '') {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}${params}`;
}

describe('parseSoundCloudSource', () => {
  it('parses a track permalink', () => {
    expect(parseSoundCloudSource(TRACK)).toEqual({ kind: 'track', url: TRACK, startTime: null, params: {} });
  });

  it('parses a set permalink as a playlist', () => {
    expect(parseSoundCloudSource(SET)).toEqual({ kind: 'playlist', url: SET, startTime: null, params: {} });
  });

  it('keeps the secret token segment of a private track or set', () => {
    expect(parseSoundCloudSource(`${TRACK}/s-AbC123`)?.url).toBe(`${TRACK}/s-AbC123`);
    expect(parseSoundCloudSource(`${SET}/s-AbC123`)).toMatchObject({ kind: 'playlist', url: `${SET}/s-AbC123` });
  });

  it('drops tracking parameters, the fragment, and a trailing slash', () => {
    const src = `${TRACK}/?utm_source=clipboard&utm_medium=text&si=abc#t=10`;

    expect(parseSoundCloudSource(src)?.url).toBe(TRACK);
  });

  it('reads the www. and m. hosts and a URL without a scheme as soundcloud.com', () => {
    expect(parseSoundCloudSource('https://www.soundcloud.com/forss/flickermood')?.url).toBe(TRACK);
    expect(parseSoundCloudSource('https://m.soundcloud.com/forss/flickermood')?.url).toBe(TRACK);
    expect(parseSoundCloudSource('soundcloud.com/forss/flickermood')?.url).toBe(TRACK);
  });

  it('parses api.soundcloud.com tracks and playlists, keeping only the secret token', () => {
    expect(parseSoundCloudSource('https://api.soundcloud.com/tracks/293')).toMatchObject({
      kind: 'track',
      url: 'https://api.soundcloud.com/tracks/293',
    });
    expect(
      parseSoundCloudSource('https://api.soundcloud.com/playlists/1?secret_token=s-xyz&client_id=1')
    ).toMatchObject({ kind: 'playlist', url: 'https://api.soundcloud.com/playlists/1?secret_token=s-xyz' });
  });

  it('reads the URN form of an api.soundcloud.com id, encoded or not', () => {
    expect(parseSoundCloudSource('https://api.soundcloud.com/tracks/soundcloud:tracks:293')?.url).toBe(
      'https://api.soundcloud.com/tracks/293'
    );
    expect(parseSoundCloudSource('https://api.soundcloud.com/playlists/soundcloud%3Aplaylists%3A1')).toMatchObject({
      kind: 'playlist',
      url: 'https://api.soundcloud.com/playlists/1',
    });
    expect(parseSoundCloudSource(widgetUrl('https://api.soundcloud.com/tracks/soundcloud:tracks:293'))?.url).toBe(
      'https://api.soundcloud.com/tracks/293'
    );
  });

  it('parses a short link without resolving it', () => {
    expect(parseSoundCloudSource('https://on.soundcloud.com/9zRpu')).toEqual({
      kind: 'short-link',
      url: 'https://on.soundcloud.com/9zRpu',
      startTime: null,
      params: {},
    });
  });

  it('parses a widget embed URL, keeping its parameters', () => {
    expect(parseSoundCloudSource(widgetUrl(SET, '&color=%23ff5500&visual=true&start_track=2'))).toEqual({
      kind: 'playlist',
      url: SET,
      startTime: null,
      params: { color: '#ff5500', visual: 'true', start_track: '2' },
    });
  });

  it.each([
    ['seconds', '#t=90', 90],
    ['seconds with a unit', '#t=90s', 90],
    ['clock time', '#t=1:30', 90],
    ['clock time with hours', '#t=1:02:03', 3723],
    ['minutes and seconds', '#t=1m30s', 90],
    ['hours, minutes, and seconds', '#t=1h2m3s', 3723],
    ['minutes alone', '#t=2m', 120],
    ['percent-encoded clock time', '#t=1%3A30', 90],
  ])('reads a start time given as %s', (_, hash, expected) => {
    expect(parseSoundCloudSource(`${TRACK}${hash}`)?.startTime).toBe(expected);
  });

  it('reads the start time of a URL nested in a widget embed URL', () => {
    expect(parseSoundCloudSource(widgetUrl(`${TRACK}#t=1m30s`))?.startTime).toBe(90);
  });

  it('ignores a start time it cannot read', () => {
    expect(parseSoundCloudSource(`${TRACK}#t=soon`)?.startTime).toBe(null);
    expect(parseSoundCloudSource(`${TRACK}#t=1%3`)?.startTime).toBe(null);
  });

  it.each([
    ['an empty string', ''],
    ['a profile', 'https://soundcloud.com/forss'],
    ['a profile page', 'https://soundcloud.com/forss/likes'],
    ['a site page with a track shape', 'https://soundcloud.com/discover/sets'],
    ['a set without a name', 'https://soundcloud.com/forss/sets'],
    ['an extra path segment', 'https://soundcloud.com/forss/flickermood/comments'],
    ['an api user', 'https://api.soundcloud.com/users/183'],
    ['an api track without a numeric id', 'https://api.soundcloud.com/tracks/flickermood'],
    ['an api URN for another collection', 'https://api.soundcloud.com/tracks/soundcloud:playlists:1'],
    ['a widget embed URL without a url', 'https://w.soundcloud.com/player/?color=ff5500'],
    ['a widget embed URL nested in another', widgetUrl(widgetUrl(TRACK))],
    ['a short link with a path', 'https://on.soundcloud.com/9zRpu/extra'],
    ['another domain', 'https://example.com/forss/flickermood'],
    ['a lookalike domain', 'https://soundcloud.com.example.com/forss/flickermood'],
    ['a non-http URL', 'ftp://soundcloud.com/forss/flickermood'],
  ])('returns null for %s', (_, src) => {
    expect(parseSoundCloudSource(src)).toBe(null);
  });
});
