import { describe, expect, it } from 'vite-plus/test';

import {
  defaultInstallationExtensions,
  installationExtensionsFor,
  muxDataNeedsEnvKey,
  parseInstallationExtensions,
  serializeInstallationExtensions,
} from '../extensions';

describe('installationExtensionsFor', () => {
  it('offers Google Cast only for compatible adapters with a ready-made video skin', () => {
    expect(installationExtensionsFor('default-video', 'video', 'hls')).toContain('google-cast');
    expect(installationExtensionsFor('live-video', 'neutral-video', 'dash')).toContain('google-cast');
    expect(installationExtensionsFor('default-video', 'video', 'html5-video')).not.toContain('google-cast');
    expect(installationExtensionsFor('default-video', 'none', 'hls')).not.toContain('google-cast');
    expect(installationExtensionsFor('default-audio', 'audio', 'mux-audio')).not.toContain('google-cast');
  });

  it('offers and defaults Mux Data for Mux media', () => {
    expect(installationExtensionsFor('default-video', 'video', 'mux-video')).toContain('mux-data');
    expect(defaultInstallationExtensions('mux-video')).toEqual(['mux-data']);
    expect(defaultInstallationExtensions('hls')).toEqual([]);
  });

  it('offers Mux Data for media played by a video or audio element, but not iframe embeds', () => {
    expect(installationExtensionsFor('default-video', 'video', 'hls')).toContain('mux-data');
    expect(installationExtensionsFor('default-video', 'none', 'dash')).toContain('mux-data');
    expect(installationExtensionsFor('default-audio', 'audio', 'html5-audio')).toContain('mux-data');
    expect(installationExtensionsFor('background-video', 'video', 'hls-background-video')).toContain('mux-data');
    expect(installationExtensionsFor('default-video', 'video', 'youtube')).not.toContain('mux-data');
    expect(installationExtensionsFor('default-audio', 'audio', 'spotify')).not.toContain('mux-data');
  });

  it('offers Google Analytics for every player except background video', () => {
    expect(installationExtensionsFor('default-video', 'video', 'youtube')).toContain('google-analytics');
    expect(installationExtensionsFor('live-audio', 'none', 'mux-audio')).toContain('google-analytics');
    expect(installationExtensionsFor('background-video', 'video', 'background-video')).not.toContain(
      'google-analytics'
    );
    expect(defaultInstallationExtensions('html5-video')).not.toContain('google-analytics');
  });
});

describe('muxDataNeedsEnvKey', () => {
  it('needs no key for Mux media or stream.mux.com URLs, and a key for any other source', () => {
    expect(muxDataNeedsEnvKey('mux-video', 'https://cdn.example.com/video.m3u8')).toBe(false);
    expect(muxDataNeedsEnvKey('html5-video', 'https://stream.mux.com/abc123/highest.mp4')).toBe(false);
    expect(muxDataNeedsEnvKey('hls', 'https://cdn.example.com/video.m3u8')).toBe(true);
    expect(muxDataNeedsEnvKey('hls', 'not a url')).toBe(true);
  });
});

describe('installation extension serialization', () => {
  it('round-trips comma-separated choices and uses none for an empty selection', () => {
    expect(parseInstallationExtensions('google-cast, mux-data')).toEqual(['google-cast', 'mux-data']);
    expect(parseInstallationExtensions('none')).toEqual([]);
    expect(serializeInstallationExtensions(['google-cast', 'mux-data'])).toBe('google-cast,mux-data');
    expect(serializeInstallationExtensions([])).toBe('none');
  });
});
