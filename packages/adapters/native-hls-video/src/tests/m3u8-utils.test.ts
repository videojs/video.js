import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  getStreamInfoFromSrc,
  isMultivariantPlaylist,
  looksLikeM3u8,
  parseStreamInfo,
  resolveFirstMediaPlaylistUrl,
} from '../m3u8-utils';

function mockFetch(responses: Record<string, string | { status: number; body?: string; url?: string }>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input.toString();
      const entry = responses[url] ?? responses[Object.keys(responses).find((key) => url.endsWith(key)) ?? ''];
      if (entry === undefined) return new Response('not found', { status: 404 });

      if (typeof entry === 'string') {
        return new Response(entry, { status: 200 });
      }

      const response = new Response(entry.body ?? '', { status: entry.status });

      if (entry.url) Object.defineProperty(response, 'url', { value: entry.url });

      return response;
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('looksLikeM3u8', () => {
  it('matches URLs ending in `.m3u8`', () => {
    expect(looksLikeM3u8('https://example.com/stream.m3u8')).toBe(true);
  });

  it('matches URLs with `.m3u8` in the path', () => {
    expect(looksLikeM3u8('https://example.com/stream.m3u8?token=abc')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(looksLikeM3u8('https://example.com/STREAM.M3U8')).toBe(true);
  });

  it('returns `false` for `.mp4`', () => {
    expect(looksLikeM3u8('https://example.com/video.mp4')).toBe(false);
  });

  it('returns `false` for empty strings', () => {
    expect(looksLikeM3u8('')).toBe(false);
  });
});

describe('isMultivariantPlaylist', () => {
  it('returns `true` when `#EXT-X-STREAM-INF` is present', () => {
    const playlist = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', 'media.m3u8'].join('\n');

    expect(isMultivariantPlaylist(playlist)).toBe(true);
  });

  it('returns `false` for a media playlist', () => {
    const playlist = ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join('\n');

    expect(isMultivariantPlaylist(playlist)).toBe(false);
  });
});

describe('resolveFirstMediaPlaylistUrl', () => {
  it('resolves a relative URI against `baseUrl`', () => {
    const playlist = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720', 'media.m3u8'].join('\n');

    const url = resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8');

    expect(url).toBe('https://example.com/media.m3u8');
  });

  it('preserves an absolute URI as-is', () => {
    const playlist = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', 'https://cdn.example.com/path/media.m3u8'].join(
      '\n'
    );

    const url = resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8');

    expect(url).toBe('https://cdn.example.com/path/media.m3u8');
  });

  it('skips blank and comment lines after `#EXT-X-STREAM-INF`', () => {
    const playlist = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', '', '# a comment', 'media.m3u8'].join('\n');

    expect(resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8')).toBe(
      'https://example.com/media.m3u8'
    );
  });

  it('returns the first variant when there are multiple', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=1000000',
      'low.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
      'high.m3u8',
    ].join('\n');

    expect(resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8')).toBe(
      'https://example.com/low.m3u8'
    );
  });

  it('returns `null` when no variant URI is found', () => {
    const playlist = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000'].join('\n');

    expect(resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8')).toBeNull();
  });

  it('returns `null` when no `#EXT-X-STREAM-INF` tag is present', () => {
    const playlist = ['#EXTM3U', '#EXT-X-TARGETDURATION:6'].join('\n');

    expect(resolveFirstMediaPlaylistUrl(playlist, 'https://example.com/master.m3u8')).toBeNull();
  });
});

describe('parseStreamInfo', () => {
  it('returns `targetLiveWindow=0` and `targetduration * 3` for standard live', () => {
    const playlist = ['#EXTM3U', '#EXT-X-VERSION:6', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join(
      '\n'
    );

    expect(parseStreamInfo(playlist)).toEqual({
      targetLiveWindow: 0,
      liveEdgeStartOffset: 18,
    });
  });

  it('returns `targetLiveWindow=Infinity` for `EVENT` playlists', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-PLAYLIST-TYPE:EVENT',
      '#EXT-X-TARGETDURATION:6',
      '#EXTINF:6.0,',
      'segment0.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist)).toEqual({
      targetLiveWindow: Number.POSITIVE_INFINITY,
      liveEdgeStartOffset: 18,
    });
  });

  it('returns `NaN` / `undefined` for `VOD` playlists', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-TARGETDURATION:6',
      '#EXTINF:6.0,',
      'segment0.ts',
      '#EXT-X-ENDLIST',
    ].join('\n');

    const info = parseStreamInfo(playlist);

    expect(info.targetLiveWindow).toBeNaN();
    expect(info.liveEdgeStartOffset).toBeUndefined();
  });

  it('treats `#EXT-X-ENDLIST` (without `VOD`) as on-demand', () => {
    const playlist = ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts', '#EXT-X-ENDLIST'].join('\n');

    const info = parseStreamInfo(playlist);

    expect(info.targetLiveWindow).toBeNaN();
    expect(info.liveEdgeStartOffset).toBeUndefined();
  });

  it('uses `PART-TARGET * 2` for low-latency live', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-VERSION:9',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-PART-INF:PART-TARGET=0.5',
      '#EXTINF:4.0,',
      'segment0.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist)).toEqual({
      targetLiveWindow: 0,
      liveEdgeStartOffset: 1,
    });
  });

  it('prefers `PART-TARGET` over `TARGETDURATION` when both are present', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-PART-INF:PART-TARGET=0.5',
      '#EXTINF:4.0,',
      'segment0.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(1);
  });

  it('leaves `liveEdgeStartOffset` undefined when neither tag is present', () => {
    const playlist = ['#EXTM3U', '#EXTINF:6.0,', 'segment0.ts'].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBeUndefined();
  });

  it('ignores extra whitespace and CRLF line endings', () => {
    const playlist = ['#EXTM3U', '#EXT-X-TARGETDURATION: 6 ', '#EXTINF:6.0,', 'segment0.ts'].join('\r\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(18);
  });

  it('parses `PART-TARGET` case-insensitively', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-PART-INF:part-target=0.25',
      '#EXTINF:4.0,',
      'segment0.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(0.5);
  });
  it('prefers HOLD-BACK over the TARGETDURATION fallback', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-SERVER-CONTROL:HOLD-BACK=12',
      '#EXTINF:2,',
      'a.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(12);
  });

  it('prefers PART-HOLD-BACK over the PART-TARGET fallback', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=2.171',
      '#EXT-X-PART-INF:PART-TARGET=1.034',
      '#EXTINF:2,',
      'a.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(2.171);
  });

  it('ignores PART-HOLD-BACK when the playlist is not low latency', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-SERVER-CONTROL:PART-HOLD-BACK=1.5',
      '#EXTINF:4,',
      'a.ts',
    ].join('\n');

    // No PART-INF, so the regular-latency rule applies and PART-HOLD-BACK is not the value to use.
    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(12);
  });

  it('falls back to the multiples when SERVER-CONTROL carries neither hold-back', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:6',
      '#EXT-X-SERVER-CONTROL:CAN-SKIP-UNTIL=36',
      '#EXTINF:6,',
      'a.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(18);
  });

  it('reads a hold-back written with surrounding whitespace', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-SERVER-CONTROL: HOLD-BACK = 9 ',
      '#EXTINF:2,',
      'a.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(9);
  });

  it('does not read PART-HOLD-BACK as HOLD-BACK', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:3',
      '#EXT-X-SERVER-CONTROL:PART-HOLD-BACK=1.5,HOLD-BACK=10',
      '#EXTINF:3,',
      'a.ts',
    ].join('\n');

    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(10);
  });

  it('leaves an on-demand playlist without an edge offset even with SERVER-CONTROL', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-SERVER-CONTROL:HOLD-BACK=12',
      '#EXTINF:2,',
      'a.ts',
      '#EXT-X-ENDLIST',
    ].join('\n');

    expect(parseStreamInfo(playlist)).toEqual({
      targetLiveWindow: Number.NaN,
      liveEdgeStartOffset: undefined,
    });
  });

  it('falls back to the multiple when the declared hold-back is zero', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-SERVER-CONTROL:HOLD-BACK=0',
      '#EXTINF:4,',
      'a.ts',
    ].join('\n');

    // The hls.js adapter reads an undeclared hold-back as 0, so a zero has to lose to the multiple on both paths.
    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(12);
  });

  it('treats a hold-back that is not a plain number as absent', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:4',
      '#EXT-X-SERVER-CONTROL:HOLD-BACK=1e1',
      '#EXTINF:4,',
      'a.ts',
    ].join('\n');

    // Reading the leading digits would silently yield 1 instead of the intended 10.
    expect(parseStreamInfo(playlist).liveEdgeStartOffset).toBe(12);
  });
});

describe('getStreamInfoFromSrc', () => {
  const media = ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join('\n');

  it('parses a media playlist directly', async () => {
    mockFetch({ 'https://example.com/live.m3u8': media });

    const info = await getStreamInfoFromSrc('https://example.com/live.m3u8');

    expect(info).toEqual({ targetLiveWindow: 0, liveEdgeStartOffset: 18 });
  });

  it('follows the first variant of a multivariant playlist', async () => {
    const master = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', 'media.m3u8'].join('\n');

    mockFetch({
      'https://example.com/master.m3u8': master,
      'https://example.com/media.m3u8': media,
    });

    const info = await getStreamInfoFromSrc('https://example.com/master.m3u8');

    expect(info).toEqual({ targetLiveWindow: 0, liveEdgeStartOffset: 18 });
  });

  it('throws when the initial fetch fails', async () => {
    mockFetch({ 'https://example.com/live.m3u8': { status: 500 } });

    await expect(getStreamInfoFromSrc('https://example.com/live.m3u8')).rejects.toThrow(/500/);
  });

  it('throws when a multivariant playlist has no variant URI', async () => {
    const master = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000'].join('\n');

    mockFetch({ 'https://example.com/master.m3u8': master });

    await expect(getStreamInfoFromSrc('https://example.com/master.m3u8')).rejects.toThrow(/No media playlist URL/);
  });

  it('passes the abort signal to fetch', async () => {
    const controller = new AbortController();

    controller.abort();

    const fetchSpy = vi.fn(async () => new Response(media, { status: 200 }));

    vi.stubGlobal('fetch', fetchSpy);

    await getStreamInfoFromSrc('https://example.com/live.m3u8', controller.signal).catch(() => {});

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/live.m3u8', { signal: controller.signal });
  });
});
