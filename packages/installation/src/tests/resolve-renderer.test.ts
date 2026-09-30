import { describe, expect, it } from 'vite-plus/test';

import {
  articleFor,
  isRendererValidForUseCase,
  type Renderer,
  resolveRenderer,
  resolveRendererCandidates,
  type UseCase,
} from '../index';

describe('resolveRenderer', () => {
  it.each<[string, UseCase, Renderer]>([
    ['https://youtu.be/aqz-KE-bpKQ', 'default-video', 'youtube'],
    ['https://vimeo.com/76979871', 'default-video', 'vimeo'],
    [
      'https://customer-abc123.cloudflarestream.com/bfbd585059e33391d67b0f1d15fe6ea4/iframe',
      'default-video',
      'cloudflare',
    ],
    ['https://www.tiktok.com/@_luwes/video/7527476667770522893', 'default-video', 'tiktok'],
    ['https://www.twitch.tv/videos/106400740', 'default-video', 'twitch'],
    ['https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M', 'default-audio', 'spotify'],
    ['https://stream.mux.com/abc123.m3u8', 'default-video', 'mux-video'],
    ['https://example.com/video.m3u8', 'default-video', 'hls'],
    ['https://example.com/video.mpd', 'default-video', 'dash'],
    ['https://example.com/video.mp4', 'default-video', 'html5-video'],
    ['https://example.com/audio.mp3', 'default-audio', 'html5-audio'],
  ])('resolves %s in %s to %s', (url, useCase, expected) => {
    expect(resolveRenderer(url, useCase)).toBe(expected);
  });

  it.each<[string, UseCase, Renderer]>([
    ['https://stream.mux.com/abc123.m3u8', 'default-audio', 'mux-audio'],
    ['https://stream.mux.com/abc123.m3u8', 'live-audio', 'mux-audio'],
    ['https://stream.mux.com/abc123.m3u8', 'background-video', 'mux-background-video'],
    ['https://example.com/video.m3u8', 'background-video', 'hls-background-video'],
    ['https://example.com/video.m3u8', 'live-video', 'hls'],
    ['https://example.com/video.mp4', 'background-video', 'background-video'],
  ])('picks the first renderer the use case offers for %s in %s', (url, useCase, expected) => {
    expect(resolveRenderer(url, useCase)).toBe(expected);
  });

  it.each<[string, UseCase]>([
    ['https://vimeo.com/76979871', 'default-audio'],
    ['https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M', 'default-video'],
    ['https://example.com/video.mpd', 'default-audio'],
    ['https://example.com/audio.mp3', 'default-video'],
    ['https://example.com/video.mp4', 'default-audio'],
    // The live presets take streaming sources only.
    ['https://example.com/video.mp4', 'live-video'],
    ['https://example.com/video.m3u8', 'live-audio'],
  ])('returns null for %s when %s offers none of its renderers', (url, useCase) => {
    expect(resolveRenderer(url, useCase)).toBeNull();
  });

  it('returns null for a URL no media plays', () => {
    expect(resolveRenderer('https://example.com/page', 'default-video')).toBeNull();
  });
});

describe('resolveRendererCandidates', () => {
  it('lists the generic stream renderers after the service renderers for a manifest', () => {
    expect(resolveRendererCandidates('https://stream.mux.com/abc123.m3u8')).toEqual([
      'mux-video',
      'mux-audio',
      'mux-background-video',
      'hls',
      'hls-background-video',
    ]);
    expect(
      resolveRendererCandidates(
        'https://customer-abc123.cloudflarestream.com/bfbd585059e33391d67b0f1d15fe6ea4/manifest/video.mpd'
      )
    ).toEqual(['cloudflare', 'dash']);
  });

  it('lists only the service renderers for a URL without a stream extension', () => {
    expect(resolveRendererCandidates('https://youtu.be/aqz-KE-bpKQ')).toEqual(['youtube']);
    expect(resolveRendererCandidates('https://stream.mux.com/abc123')).toEqual([
      'mux-video',
      'mux-audio',
      'mux-background-video',
    ]);
  });

  it('returns no candidates for Wistia, which has no renderer yet', () => {
    expect(resolveRendererCandidates('https://fast.wistia.net/embed/iframe/e4a27b971d')).toEqual([]);
  });
});

describe('articleFor', () => {
  it('returns "an" for hls', () => {
    expect(articleFor('hls')).toBe('an');
  });

  it('returns "an" for html5-video', () => {
    expect(articleFor('html5-video')).toBe('an');
  });

  it('returns "an" for html5-audio', () => {
    expect(articleFor('html5-audio')).toBe('an');
  });
});

describe('isRendererValidForUseCase', () => {
  it('html5-video is valid for default-video', () => {
    expect(isRendererValidForUseCase('html5-video', 'default-video')).toBe(true);
  });

  it('html5-audio is valid for default-audio', () => {
    expect(isRendererValidForUseCase('html5-audio', 'default-audio')).toBe(true);
  });

  it('background-video is valid for background-video', () => {
    expect(isRendererValidForUseCase('background-video', 'background-video')).toBe(true);
  });

  it('html5-video is not valid for default-audio', () => {
    expect(isRendererValidForUseCase('html5-video', 'default-audio')).toBe(false);
  });

  it('html5-video is not valid for background-video', () => {
    expect(isRendererValidForUseCase('html5-video', 'background-video')).toBe(false);
  });

  it('dash and mux-video are valid for default-video', () => {
    expect(isRendererValidForUseCase('dash', 'default-video')).toBe(true);
    expect(isRendererValidForUseCase('mux-video', 'default-video')).toBe(true);
  });

  it('vimeo is valid for default-video but not default-audio', () => {
    expect(isRendererValidForUseCase('vimeo', 'default-video')).toBe(true);
    expect(isRendererValidForUseCase('vimeo', 'default-audio')).toBe(false);
  });

  it('the embed video renderers are valid for default-video but not default-audio', () => {
    for (const renderer of ['youtube', 'cloudflare', 'tiktok', 'twitch'] as const) {
      expect(isRendererValidForUseCase(renderer, 'default-video')).toBe(true);
      expect(isRendererValidForUseCase(renderer, 'default-audio')).toBe(false);
    }
  });

  it('spotify is valid for default-audio but not default-video', () => {
    expect(isRendererValidForUseCase('spotify', 'default-audio')).toBe(true);
    expect(isRendererValidForUseCase('spotify', 'default-video')).toBe(false);
  });

  it('mux-audio is valid for default-audio but not default-video', () => {
    expect(isRendererValidForUseCase('mux-audio', 'default-audio')).toBe(true);
    expect(isRendererValidForUseCase('mux-audio', 'default-video')).toBe(false);
  });

  it('live-video accepts live-aware renderers', () => {
    expect(isRendererValidForUseCase('hls', 'live-video')).toBe(true);
    expect(isRendererValidForUseCase('mux-video', 'live-video')).toBe(true);
    expect(isRendererValidForUseCase('dash', 'live-video')).toBe(false);
    expect(isRendererValidForUseCase('html5-video', 'live-video')).toBe(false);
    expect(isRendererValidForUseCase('vimeo', 'live-video')).toBe(false);
  });

  it('live-audio accepts only mux-audio', () => {
    expect(isRendererValidForUseCase('mux-audio', 'live-audio')).toBe(true);
    expect(isRendererValidForUseCase('html5-audio', 'live-audio')).toBe(false);
    expect(isRendererValidForUseCase('hls', 'live-audio')).toBe(false);
  });
});
