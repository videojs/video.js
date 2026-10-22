import { describe, expect, it } from 'vite-plus/test';

import {
  type LazyAudioMediaName,
  type LazyVideoMediaName,
  resolveLazyAudioMedia,
  resolveLazyVideoMedia,
} from '../lazy-media';

const MUX = 'https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8';
const HLS = 'https://example.com/master.m3u8';

describe('resolveLazyVideoMedia', () => {
  it.each<[string, LazyVideoMediaName]>([
    ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'youtube-video'],
    ['https://vimeo.com/76979871', 'vimeo-video'],
    [MUX, 'mux-video'],
    ['https://example.com/manifest.mpd', 'dash-video'],
    ['/movie.mp4', 'video'],
    ['/song.mp3', 'video'],
  ])('resolves %s to %s', (src, expected) => {
    expect(resolveLazyVideoMedia(src, { nativeHls: false })).toBe(expected);
  });

  it('plays HLS natively where the browser can, and through hls.js elsewhere', () => {
    expect(resolveLazyVideoMedia(HLS, { nativeHls: true })).toBe('native-hls-video');
    expect(resolveLazyVideoMedia(HLS, { nativeHls: false })).toBe('hlsjs-video');
  });

  it('plays HLS through hls.js when MSE playback is preferred', () => {
    expect(resolveLazyVideoMedia(HLS, { nativeHls: true, preferPlayback: 'mse' })).toBe('hlsjs-video');
    expect(resolveLazyVideoMedia(HLS, { nativeHls: undefined, preferPlayback: 'mse' })).toBe('hlsjs-video');
  });

  it('defers an HLS choice until native support is known', () => {
    expect(resolveLazyVideoMedia(HLS, { nativeHls: undefined })).toBeUndefined();
    expect(resolveLazyVideoMedia('/movie.mp4', { nativeHls: undefined })).toBe('video');
  });

  it('resolves an extensionless source from its MIME type', () => {
    const src = 'https://cdn.example.com/signed/abc?token=1';

    expect(resolveLazyVideoMedia(src, { nativeHls: false })).toBeNull();
    expect(resolveLazyVideoMedia(src, { nativeHls: false, type: 'video/mp4' })).toBe('video');
    expect(resolveLazyVideoMedia(src, { nativeHls: false, type: 'application/x-mpegURL' })).toBe('hlsjs-video');
  });

  it.each<[string, LazyVideoMediaName]>([
    ['youtube/aqz-KE-bpKQ', 'youtube-video'],
    ['youtube/shorts/aqz-KE-bpKQ', 'youtube-video'],
    ['https://youtu.be/aqz-KE-bpKQ', 'youtube-video'],
    ['vimeo/76979871', 'vimeo-video'],
    ['vimeo/76979871?hash=8272103f6e', 'vimeo-video'],
    ['https://player.vimeo.com/video/76979871?h=8272103f6e', 'vimeo-video'],
    ['https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M', 'mux-video'],
  ])('matches the service shorthand or host %s to %s', (src, expected) => {
    expect(resolveLazyVideoMedia(src, { nativeHls: false })).toBe(expected);
  });

  it('treats a path that only looks like a shorthand as a file', () => {
    expect(resolveLazyVideoMedia('youtube/intro.mp4', { nativeHls: false })).toBe('video');
    expect(resolveLazyVideoMedia('vimeo/trailer.mp4', { nativeHls: false })).toBe('video');
  });

  it('returns null for services outside the supported set', () => {
    expect(resolveLazyVideoMedia('https://fast.wistia.net/embed/iframe/e4a27b971d', { nativeHls: false })).toBeNull();
    expect(
      resolveLazyVideoMedia('https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M', { nativeHls: false })
    ).toBeNull();
    expect(resolveLazyVideoMedia('', { nativeHls: false })).toBeNull();
  });
});

describe('resolveLazyAudioMedia', () => {
  it.each<[string, LazyAudioMediaName]>([
    [MUX, 'mux-audio'],
    ['/song.mp3', 'audio'],
    ['/movie.mp4', 'audio'],
  ])('resolves %s to %s', (src, expected) => {
    expect(resolveLazyAudioMedia(src, { nativeHls: false })).toBe(expected);
  });

  it('plays HLS through the browser where it can, and through an engine elsewhere', () => {
    expect(resolveLazyAudioMedia(HLS, { nativeHls: true })).toBe('audio');
    expect(resolveLazyAudioMedia(HLS, { nativeHls: false })).toBe('hls-audio');
    expect(resolveLazyAudioMedia(HLS, { nativeHls: true, preferPlayback: 'mse' })).toBe('hls-audio');
    expect(resolveLazyAudioMedia(HLS, { nativeHls: undefined })).toBeUndefined();
  });

  it('returns null for sources no audio media plays', () => {
    expect(resolveLazyAudioMedia('https://www.youtube.com/watch?v=aqz-KE-bpKQ', { nativeHls: false })).toBeNull();
    expect(resolveLazyAudioMedia('https://example.com/manifest.mpd', { nativeHls: false })).toBeNull();
  });
});
