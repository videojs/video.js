import { describe, expect, it, vi } from 'vite-plus/test';

import type { AdapterType } from '../adapter-type';
import {
  findLazyMedia,
  type LazySource,
  matchAdapterType,
  matchHls,
  type NativeHlsSupport,
  resolveLazySource,
} from '../lazy-media';

const HLS = 'https://example.com/master.m3u8';

function adapterTypeOf(src: string, type?: string): AdapterType | null | undefined {
  return resolveLazySource(src, { type, nativeHls: 'unsupported' })?.adapterType;
}

function playbackOf(nativeHls: NativeHlsSupport | undefined, preferPlayback?: 'native' | 'mse') {
  return resolveLazySource(HLS, { nativeHls, preferPlayback })?.playback;
}

describe('resolveLazySource', () => {
  it.each<[string, AdapterType]>([
    ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'youtube'],
    ['https://youtu.be/aqz-KE-bpKQ', 'youtube'],
    ['youtube/aqz-KE-bpKQ', 'youtube'],
    ['youtube/shorts/aqz-KE-bpKQ', 'youtube'],
    ['https://vimeo.com/76979871', 'vimeo'],
    ['vimeo/76979871?hash=8272103f6e', 'vimeo'],
    ['https://player.vimeo.com/video/76979871?h=8272103f6e', 'vimeo'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8', 'mux'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M', 'mux'],
    ['https://fast.wistia.net/embed/iframe/e4a27b971d', 'wistia'],
    ['https://example.com/page?wvideo=e4a27b971d', 'wistia'],
    ['https://watch.videodelivery.net/5d5bc37ffcf54c9b82e996823bffbb81', 'cloudflare'],
    ['https://customer-abc123.cloudflarestream.com/5d5bc37ffcf54c9b82e996823bffbb81/manifest/video.m3u8', 'cloudflare'],
    ['https://www.tiktok.com/@scout2015/video/6718335390845095173', 'tiktok'],
    ['https://www.twitch.tv/videos/2175470236', 'twitch'],
    ['https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5', 'spotify'],
    ['spotify:track:1301WleyT98MSxVHPZCA6M', 'spotify'],
    [HLS, 'hls'],
    ['https://example.com/manifest.mpd', 'dash'],
    ['/movie.mp4', 'video'],
    ['/song.mp3', 'audio'],
  ])('resolves %s as %s', (src, expected) => {
    expect(adapterTypeOf(src)).toBe(expected);
  });

  it('treats a media file on an embed host as that file', () => {
    const progressive =
      'https://player.vimeo.com/progressive_redirect/playback/123456/rendition/720p/file.mp4?loc=external';

    expect(adapterTypeOf(progressive)).toBe('video');
    expect(adapterTypeOf('https://player.vimeo.com/external/123456.m3u8?s=abc')).toBe('hls');
    expect(adapterTypeOf('https://embed.wistia.com/deliveries/abc.mp4')).toBe('video');
  });

  it('treats a path that only looks like a shorthand as a file', () => {
    expect(adapterTypeOf('youtube/intro.mp4')).toBe('video');
    expect(adapterTypeOf('vimeo/trailer.mp4')).toBe('video');
  });

  it('resolves an extensionless source from its MIME type', () => {
    const src = 'https://cdn.example.com/signed/abc?token=1';

    expect(adapterTypeOf(src)).toBeNull();
    expect(adapterTypeOf(src, 'video/mp4')).toBe('video');
    expect(adapterTypeOf(src, 'application/x-mpegURL')).toBe('hls');
  });

  it('carries the trimmed source, its type, and its URL', () => {
    const source = resolveLazySource(' https://example.com/a.mp4 ', { type: 'video/mp4', nativeHls: 'unsupported' })!;

    expect(source.src).toBe('https://example.com/a.mp4');
    expect(source.type).toBe('video/mp4');
    expect(source.url?.hostname).toBe('example.com');
    expect(resolveLazySource('/a.mp4', { nativeHls: 'unsupported' })!.url).toBeNull();
  });

  it('returns null for an empty source', () => {
    expect(resolveLazySource(' ', { nativeHls: 'unsupported' })).toBeNull();
  });

  it('plays HLS natively by default only where that is the preferred path', () => {
    expect(playbackOf('preferred')).toBe('native');
    expect(playbackOf('supported')).toBe('mse');
    expect(playbackOf('unsupported')).toBe('mse');
  });

  it('plays HLS natively wherever the browser can when native is preferred', () => {
    expect(playbackOf('preferred', 'native')).toBe('native');
    expect(playbackOf('supported', 'native')).toBe('native');
    expect(playbackOf('unsupported', 'native')).toBe('mse');
  });

  it('always plays HLS through an engine when MSE is preferred', () => {
    expect(playbackOf('preferred', 'mse')).toBe('mse');
    expect(playbackOf(undefined, 'mse')).toBe('mse');
  });

  it('leaves the playback path unknown until native support is', () => {
    expect(playbackOf(undefined)).toBeUndefined();
    expect(playbackOf(undefined, 'native')).toBeUndefined();
  });
});

describe('findLazyMedia', () => {
  const source = (adapterType: AdapterType | null, playback?: 'native' | 'mse'): LazySource => ({
    src: 'x',
    type: undefined,
    url: null,
    adapterType,
    playback,
  });

  it('picks the first media that plays the source', () => {
    const first = { match: matchAdapterType('video', 'audio') };
    const second = { match: matchAdapterType('video') };

    expect(findLazyMedia([first, second], source('video'))).toBe(first);
    expect(findLazyMedia([second, first], source('audio'))).toBe(first);
  });

  it('returns null when no media plays the source, or there is no source', () => {
    expect(findLazyMedia([{ match: matchAdapterType('dash') }], source('video'))).toBeNull();
    expect(findLazyMedia([{ match: vi.fn(() => true) }], null)).toBeNull();
  });

  it('waits on a media that cannot tell yet, without trying the ones after it', () => {
    const later = { match: vi.fn(() => true) };

    expect(findLazyMedia([{ match: matchHls('native') }, later], source('hls'))).toBeUndefined();
    expect(later.match).not.toHaveBeenCalled();
  });

  it('matches HLS media by their playback path', () => {
    const native = { match: matchHls('native') };
    const mse = { match: matchHls('mse') };

    expect(findLazyMedia([native, mse], source('hls', 'native'))).toBe(native);
    expect(findLazyMedia([native, mse], source('hls', 'mse'))).toBe(mse);
    expect(findLazyMedia([native, mse], source('dash', 'native'))).toBeNull();
  });
});
