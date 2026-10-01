import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getStreamInfoFromSrc, looksLikeM3u8 } from '../m3u8-utils';

function mockFetch(responses: Record<string, string | { status: number; body?: string; url?: string }>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input.toString();
      const entry = responses[url];
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

describe('getStreamInfoFromSrc', () => {
  const media = ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join('\n');

  it.each([
    {
      name: 'returns `targetLiveWindow=0` and `targetduration * 3` for standard live',
      playlist: ['#EXTM3U', '#EXT-X-VERSION:6', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 18,
    },
    {
      name: 'returns `targetLiveWindow=Infinity` for `EVENT` playlists',
      playlist: [
        '#EXTM3U',
        '#EXT-X-PLAYLIST-TYPE:EVENT',
        '#EXT-X-TARGETDURATION:6',
        '#EXTINF:6.0,',
        'segment0.ts',
      ].join('\n'),
      targetLiveWindow: Number.POSITIVE_INFINITY,
      liveEdgeStartOffset: 18,
    },
    {
      name: 'returns `NaN` / `undefined` for `VOD` playlists',
      playlist: ['#EXTM3U', '#EXT-X-PLAYLIST-TYPE:VOD', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts'].join(
        '\n'
      ),
      targetLiveWindow: Number.NaN,
      liveEdgeStartOffset: undefined,
    },
    {
      name: 'treats `#EXT-X-ENDLIST` (without `VOD`) as on-demand',
      playlist: ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment0.ts', '#EXT-X-ENDLIST'].join('\n'),
      targetLiveWindow: Number.NaN,
      liveEdgeStartOffset: undefined,
    },
    {
      name: 'uses `PART-TARGET * 2` for low-latency live',
      playlist: [
        '#EXTM3U',
        '#EXT-X-VERSION:9',
        '#EXT-X-TARGETDURATION:4',
        '#EXT-X-PART-INF:PART-TARGET=0.5',
        '#EXTINF:4.0,',
        'segment0.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 1,
    },
    {
      name: 'leaves `liveEdgeStartOffset` undefined when neither tag is present',
      playlist: ['#EXTM3U', '#EXTINF:6.0,', 'segment0.ts'].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: undefined,
    },
    {
      name: 'ignores extra whitespace and CRLF line endings',
      playlist: ['#EXTM3U', '#EXT-X-TARGETDURATION: 6 ', '#EXTINF:6.0,', 'segment0.ts'].join('\r\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 18,
    },
    {
      name: 'parses `PART-TARGET` case-insensitively',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:4',
        '#EXT-X-PART-INF:part-target=0.25',
        '#EXTINF:4.0,',
        'segment0.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 0.5,
    },
    {
      name: 'prefers HOLD-BACK over the TARGETDURATION fallback',
      playlist: ['#EXTM3U', '#EXT-X-TARGETDURATION:2', '#EXT-X-SERVER-CONTROL:HOLD-BACK=12', '#EXTINF:2,', 'a.ts'].join(
        '\n'
      ),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 12,
    },
    {
      name: 'prefers PART-HOLD-BACK over the PART-TARGET fallback',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:2',
        '#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=2.171',
        '#EXT-X-PART-INF:PART-TARGET=1.034',
        '#EXTINF:2,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 2.171,
    },
    {
      name: 'ignores PART-HOLD-BACK when the playlist is not low latency',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:4',
        '#EXT-X-SERVER-CONTROL:PART-HOLD-BACK=1.5',
        '#EXTINF:4,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 12,
    },
    {
      name: 'falls back to the multiples when SERVER-CONTROL carries neither hold-back',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:6',
        '#EXT-X-SERVER-CONTROL:CAN-SKIP-UNTIL=36',
        '#EXTINF:6,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 18,
    },
    {
      name: 'reads a hold-back written with surrounding whitespace',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:2',
        '#EXT-X-SERVER-CONTROL: HOLD-BACK = 9 ',
        '#EXTINF:2,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 9,
    },
    {
      name: 'does not read PART-HOLD-BACK as HOLD-BACK',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:3',
        '#EXT-X-SERVER-CONTROL:PART-HOLD-BACK=1.5,HOLD-BACK=10',
        '#EXTINF:3,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 10,
    },
    {
      name: 'leaves an on-demand playlist without an edge offset even with SERVER-CONTROL',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:2',
        '#EXT-X-SERVER-CONTROL:HOLD-BACK=12',
        '#EXTINF:2,',
        'a.ts',
        '#EXT-X-ENDLIST',
      ].join('\n'),
      targetLiveWindow: Number.NaN,
      liveEdgeStartOffset: undefined,
    },
    {
      name: 'falls back to the multiple when the declared hold-back is zero',
      playlist: ['#EXTM3U', '#EXT-X-TARGETDURATION:4', '#EXT-X-SERVER-CONTROL:HOLD-BACK=0', '#EXTINF:4,', 'a.ts'].join(
        '\n'
      ),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 12,
    },
    {
      name: 'treats a hold-back that is not a plain number as absent',
      playlist: [
        '#EXTM3U',
        '#EXT-X-TARGETDURATION:4',
        '#EXT-X-SERVER-CONTROL:HOLD-BACK=1e1',
        '#EXTINF:4,',
        'a.ts',
      ].join('\n'),
      targetLiveWindow: 0,
      liveEdgeStartOffset: 12,
    },
  ])('$name', async ({ playlist, targetLiveWindow, liveEdgeStartOffset }) => {
    const url = 'https://example.com/live.m3u8';

    mockFetch({ [url]: playlist });

    expect(await getStreamInfoFromSrc(url)).toEqual({ targetLiveWindow, liveEdgeStartOffset });
    expect(fetch).toHaveBeenCalledExactlyOnceWith(url, {});
  });

  it.each([
    {
      name: 'resolves a relative variant URI',
      master: ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720', 'media.m3u8'],
      url: 'https://example.com/media.m3u8',
    },
    {
      name: 'preserves an absolute variant URI',
      master: ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', 'https://cdn.example.com/path/media.m3u8'],
      url: 'https://cdn.example.com/path/media.m3u8',
    },
    {
      name: 'skips blank and comment lines before a variant URI',
      master: ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000', '', '# a comment', 'media.m3u8'],
      url: 'https://example.com/media.m3u8',
    },
    {
      name: 'fetches only the first of multiple variants',
      master: [
        '#EXTM3U',
        '#EXT-X-STREAM-INF:BANDWIDTH=1000000',
        'low.m3u8',
        '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
        'high.m3u8',
      ],
      url: 'https://example.com/low.m3u8',
    },
  ])('$name', async ({ master, url }) => {
    mockFetch({
      'https://example.com/master.m3u8': master.join('\n'),
      [url]: media,
    });

    expect(await getStreamInfoFromSrc('https://example.com/master.m3u8')).toEqual({
      targetLiveWindow: 0,
      liveEdgeStartOffset: 18,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://example.com/master.m3u8', {});
    expect(fetch).toHaveBeenNthCalledWith(2, url, {});
  });

  it.each([
    { name: 'rejects a master without a variant URI', master: ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=2000000'] },
    {
      name: 'rejects a master-looking comment without a variant tag',
      master: [
        '#EXTM3U',
        '# comment containing #EXT-X-STREAM-INF',
        '#EXT-X-TARGETDURATION:6',
        '#EXTINF:6.0,',
        'segment0.ts',
      ],
    },
  ])('$name', async ({ master }) => {
    const url = 'https://example.com/master.m3u8';

    mockFetch({ [url]: master.join('\n') });

    await expect(getStreamInfoFromSrc(url)).rejects.toThrow('No media playlist URL');
    expect(fetch).toHaveBeenCalledExactlyOnceWith(url, {});
  });

  it('throws when the initial fetch fails', async () => {
    mockFetch({ 'https://example.com/live.m3u8': { status: 500 } });

    await expect(getStreamInfoFromSrc('https://example.com/live.m3u8')).rejects.toThrow(/500/);
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
