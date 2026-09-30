import { describe, expect, it } from 'vite-plus/test';

import { type AdapterType, resolveAdapterType, resolveMimeType } from '../adapter-type';

describe('resolveAdapterType', () => {
  it.each<[string, AdapterType]>([
    ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'youtube'],
    ['https://youtu.be/aqz-KE-bpKQ', 'youtube'],
    ['youtu.be/aqz-KE-bpKQ', 'youtube'],
    ['https://m.youtube.com/shorts/aqz-KE-bpKQ', 'youtube'],
    ['https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ', 'youtube'],
    ['https://www.youtube.com/playlist?list=PLv3TTBr1W_9tppikBxAE', 'youtube'],
    ['https://vimeo.com/76979871', 'vimeo'],
    ['https://player.vimeo.com/video/76979871?h=8272103f6e', 'vimeo'],
    ['https://fast.wistia.net/embed/iframe/e4a27b971d', 'wistia'],
    ['https://example.com/page?wvideo=e4a27b971d', 'wistia'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8', 'mux'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M', 'mux'],
    ['https://customer-abc123.cloudflarestream.com/5d5bc37ffcf54c9b82e996823bffbb81/manifest/video.m3u8', 'cloudflare'],
    ['https://watch.videodelivery.net/5d5bc37ffcf54c9b82e996823bffbb81', 'cloudflare'],
    ['https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M', 'spotify'],
    ['spotify:episode:7makk4oTQel546B0PZlDM5', 'spotify'],
    ['https://www.tiktok.com/@scout2015/video/6718335390845095173', 'tiktok'],
    ['https://www.twitch.tv/videos/2175470236', 'twitch'],
    ['https://www.twitch.tv/monstercat', 'twitch'],
  ])('resolves the service URL %s to %s', (src, expected) => {
    expect(resolveAdapterType(src)).toBe(expected);
  });

  it.each<[string, AdapterType]>([
    ['youtube/aqz-KE-bpKQ', 'youtube'],
    ['vimeo/76979871', 'vimeo'],
  ])('resolves the %s shorthand', (src, expected) => {
    expect(resolveAdapterType(src)).toBe(expected);
  });

  it.each<[string, AdapterType]>([
    ['https://example.com/live/stream.m3u8', 'hls'],
    ['https://example.com/manifest.mpd', 'dash'],
    ['/media/video.mp4', 'video'],
    ['https://cdn.example.com/podcast.mp3', 'audio'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M/highest.mp4', 'video'],
  ])('resolves %s by its file extension', (src, expected) => {
    expect(resolveAdapterType(src)).toBe(expected);
  });

  it('ignores surrounding whitespace', () => {
    expect(resolveAdapterType('  https://youtu.be/aqz-KE-bpKQ  ')).toBe('youtube');
  });

  it('resolves Mux streams on a custom domain as plain HLS', () => {
    expect(resolveAdapterType('https://stream.example.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8')).toBe(
      'hls'
    );
  });

  it('prefers the MIME type over the file extension', () => {
    expect(resolveAdapterType('https://example.com/manifest', 'application/vnd.apple.mpegurl')).toBe('hls');
    expect(resolveAdapterType('https://example.com/video.mp4', 'application/dash+xml')).toBe('dash');
    expect(resolveAdapterType('blob:https://example.com/1234', 'video/mp4')).toBe('video');
    expect(resolveAdapterType('https://example.com/episode', 'audio/mpeg')).toBe('audio');
  });

  it('ignores MIME type parameters', () => {
    expect(resolveAdapterType('https://example.com/manifest', 'application/x-mpegURL; charset=utf-8')).toBe('hls');
    expect(resolveAdapterType('https://example.com/manifest', 'application/dash+xml; profiles=x')).toBe('dash');
    expect(resolveAdapterType('https://example.com/manifest', 'audio/mpegurl; charset=utf-8')).toBe('hls');
  });

  it('prefers the service adapter type over the MIME type', () => {
    expect(
      resolveAdapterType(
        'https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8',
        'application/x-mpegurl'
      )
    ).toBe('mux');
  });

  it('falls back to the file extension for an unrecognized MIME type', () => {
    expect(resolveAdapterType('https://example.com/video.mp4', 'application/octet-stream')).toBe('video');
  });

  it.each([
    ['an empty string', ''],
    ['a bare YouTube id', 'aqz-KE-bpKQ'],
    ['a bare Vimeo id', '76979871'],
    ['a bare Wistia id', 'e4a27b971d'],
    ['a bare Mux playback id', 'a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M'],
    ['a malformed shorthand', 'youtube/not-an-id'],
    ['a Mux player page', 'https://player.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M'],
    ['an unknown file type', 'https://example.com/file.bin'],
    ['a YouTube page without a video', 'https://www.youtube.com/'],
    ['a Vimeo page without a video', 'https://vimeo.com/'],
    ['a TikTok short link', 'https://vm.tiktok.com/ZMabc123/'],
    ['a Twitch clip', 'https://clips.twitch.tv/SomeClipSlug'],
    ['a service URL nested in a query parameter', 'https://example.com/share?url=https://youtu.be/aqz-KE-bpKQ'],
  ])('returns null for %s', (_, src) => {
    expect(resolveAdapterType(src)).toBe(null);
  });
});

describe('resolveMimeType', () => {
  it.each([
    ['https://example.com/live/stream.m3u8', 'application/x-mpegurl'],
    ['https://example.com/manifest.mpd?token=abc', 'application/dash+xml'],
    ['/media/video.mp4', 'video/mp4'],
    ['clip.WEBM', 'video/webm'],
    ['movie.mov', 'video/quicktime'],
    ['movie.ogv', 'video/ogg'],
    ['https://cdn.example.com/podcast.mp3#t=30', 'audio/mpeg'],
    ['track.m4a', 'audio/mp4'],
    ['track.wav', 'audio/wav'],
    ['track.ogg', 'audio/ogg'],
    ['track.flac', 'audio/flac'],
    ['track.aac', 'audio/aac'],
  ])('resolves %s to %s', (src, expected) => {
    expect(resolveMimeType(src)).toBe(expected);
  });

  it.each([
    ['an empty string', ''],
    ['a URL without an extension', 'https://example.com/manifest'],
    ['an extension only in the query string', 'https://example.com/play?file=video.mp4'],
    ['an unknown file type', 'https://example.com/file.bin'],
  ])('returns null for %s', (_, src) => {
    expect(resolveMimeType(src)).toBe(null);
  });
});
