import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPlaylistSegmentFormat } from '../utils';

function stubPlaylists(playlists: Record<string, string>) {
  const fetch = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const body = playlists[url];
    if (body === undefined) throw new Error(`Unexpected fetch: ${url}`);

    return new Response(body);
  });

  vi.stubGlobal('fetch', fetch);

  return fetch;
}

const MULTIVARIANT_WITH_AUDIO = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",DEFAULT=YES,URI="audio/en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1280000,AUDIO="audio"
video/720p.m3u8
`;

describe('getPlaylistSegmentFormat', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads the audio rendition format separately from the video variant', async () => {
    stubPlaylists({
      'https://example.com/main.m3u8': MULTIVARIANT_WITH_AUDIO,
      'https://example.com/video/720p.m3u8': '#EXTM3U\n#EXTINF:6,\nseg0.ts\n',
      'https://example.com/audio/en.m3u8': '#EXTM3U\n#EXTINF:6,\nseg0.aac?token=1\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/main.m3u8')).resolves.toEqual({
      videoFormat: 'ts',
      audioFormat: 'aac',
    });
  });

  it('uses the video format for audio when there is no separate audio rendition', async () => {
    stubPlaylists({
      'https://example.com/main.m3u8': '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\n720p.m3u8\n',
      'https://example.com/720p.m3u8': '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:6,\nseg0.m4s\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/main.m3u8')).resolves.toEqual({
      videoFormat: 'm4s',
      audioFormat: 'm4s',
    });
  });

  it('falls back to the video format when the audio playlist fails to load', async () => {
    stubPlaylists({
      'https://example.com/main.m3u8': MULTIVARIANT_WITH_AUDIO,
      'https://example.com/video/720p.m3u8': '#EXTM3U\n#EXTINF:6,\nseg0.ts\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/main.m3u8')).resolves.toEqual({
      videoFormat: 'ts',
      audioFormat: 'ts',
    });
  });

  it('skips subtitle renditions and reads the first variant of a multivariant playlist', async () => {
    stubPlaylists({
      'https://example.com/main.m3u8': [
        '#EXTM3U',
        '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",URI="subs/en.m3u8"',
        '#EXT-X-STREAM-INF:BANDWIDTH=800000,SUBTITLES="subs"',
        'video/low.m3u8',
        '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
        'video/high.m3u8',
      ].join('\n'),
      'https://example.com/video/low.m3u8': '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:4,\nseg0.m4s\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/main.m3u8')).resolves.toEqual({
      videoFormat: 'm4s',
      audioFormat: 'm4s',
    });
  });

  it('reads a media playlist, ignoring query strings and CRLF line endings', async () => {
    stubPlaylists({
      'https://example.com/media.m3u8': ['#EXTM3U', '#EXTINF:4,', 'seg0.ts?token=abc', ''].join('\r\n'),
    });

    await expect(getPlaylistSegmentFormat('https://example.com/media.m3u8')).resolves.toEqual({
      videoFormat: 'ts',
      audioFormat: 'ts',
    });
  });

  it('reads the format from the segment path when the URI has a fragment', async () => {
    stubPlaylists({
      'https://example.com/media.m3u8': '#EXTM3U\n#EXTINF:4,\nhttps://cdn.example.com/v1.2/seg0.ts#t=0\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/media.m3u8')).resolves.toEqual({
      videoFormat: 'ts',
      audioFormat: 'ts',
    });
  });

  it('reads no format from a query when the segment path has no extension', async () => {
    stubPlaylists({
      'https://example.com/media.m3u8': '#EXTM3U\n#EXTINF:4,\nsegments/0?file=clip.ts\n',
    });

    await expect(getPlaylistSegmentFormat('https://example.com/media.m3u8')).resolves.toEqual({
      videoFormat: undefined,
      audioFormat: undefined,
    });
  });

  it('does not fetch blob: URLs', async () => {
    const fetch = stubPlaylists({});

    await expect(getPlaylistSegmentFormat('blob:https://example.com/1')).resolves.toEqual({
      videoFormat: undefined,
      audioFormat: undefined,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
