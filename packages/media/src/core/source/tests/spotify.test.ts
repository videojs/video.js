import { describe, expect, it } from 'vite-plus/test';

import { parseSpotifyEntityId, parseSpotifySource } from '../spotify';

const TRACK_URL = 'https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M';
const TRACK_ID = '1301WleyT98MSxVHPZCA6M';
const EPISODE_URL = 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5';

describe('parseSpotifyEntityId', () => {
  it('extracts id from a share URL', () => {
    expect(parseSpotifyEntityId(TRACK_URL)).toBe(TRACK_ID);
  });

  it('extracts id from a spotify URI', () => {
    expect(parseSpotifyEntityId(`spotify:track:${TRACK_ID}`)).toBe(TRACK_ID);
  });

  it('returns null for empty input', () => {
    expect(parseSpotifyEntityId('')).toBe(null);
  });

  it('returns null for non-Spotify URLs', () => {
    expect(parseSpotifyEntityId('https://example.com/track/1301WleyT98MSxVHPZCA6M')).toBe(null);
  });
});

describe('parseSpotifySource', () => {
  it('parses every embeddable entity type', () => {
    for (const type of ['track', 'episode', 'album', 'playlist', 'show', 'artist'] as const) {
      expect(parseSpotifySource(`https://open.spotify.com/${type}/${TRACK_ID}`)).toEqual({
        type,
        id: TRACK_ID,
        startTime: null,
      });
      expect(parseSpotifySource(`spotify:${type}:${TRACK_ID}`)).toEqual({ type, id: TRACK_ID, startTime: null });
    }
  });

  it('parses localized and already-embedded URLs', () => {
    expect(parseSpotifySource(`https://open.spotify.com/intl-de/track/${TRACK_ID}`)?.id).toBe(TRACK_ID);
    expect(parseSpotifySource(`https://open.spotify.com/embed/episode/${TRACK_ID}`)).toEqual({
      type: 'episode',
      id: TRACK_ID,
      startTime: null,
    });
  });

  it('parses the start position from the t param', () => {
    expect(parseSpotifySource(`${EPISODE_URL}?t=1200`)?.startTime).toBe(1200);
    expect(parseSpotifySource(`${EPISODE_URL}?si=abc&t=90`)?.startTime).toBe(90);
  });

  it('ignores query strings that are not a source', () => {
    expect(parseSpotifySource(`${TRACK_URL}?si=8f0f1b3a`)).toEqual({ type: 'track', id: TRACK_ID, startTime: null });
  });

  it('returns null for empty input, unknown entities, and other hosts', () => {
    expect(parseSpotifySource('')).toBe(null);
    expect(parseSpotifySource(`https://open.spotify.com/user/${TRACK_ID}`)).toBe(null);
    expect(parseSpotifySource('https://example.com/not-spotify')).toBe(null);
  });
});
