import { describe, expect, it } from 'vite-plus/test';

import {
  defaultInstallationExtensions,
  installationExtensionsFor,
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
});

describe('installation extension serialization', () => {
  it('round-trips comma-separated choices and uses none for an empty selection', () => {
    expect(parseInstallationExtensions('google-cast, mux-data')).toEqual(['google-cast', 'mux-data']);
    expect(parseInstallationExtensions('none')).toEqual([]);
    expect(serializeInstallationExtensions(['google-cast', 'mux-data'])).toBe('google-cast,mux-data');
    expect(serializeInstallationExtensions([])).toBe('none');
  });
});
