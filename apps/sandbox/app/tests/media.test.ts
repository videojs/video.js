import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { hasSkinChoice, hasTailwindSkin, landingSource, MEDIA, MEDIA_IDS, mediaSources } from '../media';
import {
  DASH_SOURCE_IDS,
  DEFAULT_BACKGROUND_SOURCE,
  DEFAULT_DASH_SOURCE,
  DEFAULT_SOURCE,
  DEFAULT_YOUTUBE_SOURCE,
  MUX_SOURCE_IDS,
  NON_DASH_SOURCE_IDS,
  SOURCE_IDS,
  SOURCES,
  YOUTUBE_SOURCE_IDS,
} from '../shared/sources';

const templatesDir = resolve(import.meta.dirname, '../../templates');

describe('MEDIA', () => {
  it('has an html and a react template for every media', () => {
    for (const id of MEDIA_IDS) {
      expect(existsSync(resolve(templatesDir, `html-${id}/main.ts`)), `html-${id}`).toBe(true);
      expect(existsSync(resolve(templatesDir, `react-${id}/main.tsx`)), `react-${id}`).toBe(true);
    }
  });

  it('describes every html and react template', () => {
    const pages = readdirSync(templatesDir)
      .filter((name) => /^(?:html|react)-/.test(name))
      .map((name) => name.replace(/^(?:html|react)-/, ''));

    expect(new Set(pages)).toEqual(new Set(MEDIA_IDS));
  });

  it('fixes the source for the embeds other than YouTube and the native background video only', () => {
    const fixed = MEDIA_IDS.filter((id) => MEDIA[id].fixedSource !== undefined);
    const embeds = MEDIA_IDS.filter((id) => MEDIA[id].embed);

    expect(fixed).toEqual(['background-video', ...embeds.filter((id) => id !== 'youtube-video')]);
    expect(embeds).toEqual([
      'vimeo-video',
      'youtube-video',
      'cloudflare-video',
      'spotify-audio',
      'tiktok-video',
      'twitch-video',
      'wistia-video',
    ]);
  });

  it('lands the SPF background media on the 4K ladder and falls dash.js back to a DASH manifest', () => {
    expect(MEDIA['hls-background-video'].entrySource).toBe(DEFAULT_BACKGROUND_SOURCE);
    expect(MEDIA['mux-background-video'].entrySource).toBe(DEFAULT_BACKGROUND_SOURCE);
    expect(MEDIA['dash-video'].fallbackSource).toBe(DEFAULT_DASH_SOURCE);
    expect(MEDIA['youtube-video'].fallbackSource).toBe(DEFAULT_YOUTUBE_SOURCE);
    expect(MEDIA_IDS.filter((id) => MEDIA[id].fallbackSource)).toEqual(['dash-video', 'youtube-video']);
  });

  it('labels what the SPF engines do with protected and MPEG-TS sources', () => {
    const protectedSource = SOURCES['mux-drm'];
    const transportStream = SOURCES['hls-1'];
    const cmaf = SOURCES['hls-4k'];

    expect(protectedSource.drm).toBe(true);
    expect(transportStream.subType).toBe('ts');
    expect(MEDIA['hls-video'].outcome?.(protectedSource)).toBe('plays where the browser has the CDM');
    expect(MEDIA['hls-audio'].outcome?.(protectedSource)).toBe('plays if its audio is clear');
    expect(MEDIA['hls-video'].outcome?.(transportStream)).toBe('expects unsupported-format error');
    expect(MEDIA['hls-audio'].outcome?.(transportStream)).toBe('expects no playback');
    expect(MEDIA['hls-background-video'].outcome?.(transportStream)).toBe('expects unsupported-format error');
    expect(MEDIA['hls-background-video'].outcome?.(cmaf)).toBeUndefined();
    expect(MEDIA['mux-video-spf'].outcome).toBeUndefined();
  });
});

describe('mediaSources', () => {
  it('offers the SPF engines HLS sources and the empty source only', () => {
    for (const media of ['hls-video', 'hls-audio', 'hls-background-video'] as const) {
      const sources = mediaSources(media, 'html');

      expect(sources).toContain('none');
      expect(sources).toContain('hls-1');
      expect(sources).toContain('hls-4k');
      expect(sources).not.toContain('mp4-1');
      expect(sources).not.toContain('mux-drm');

      for (const id of sources) expect(['hls', 'none']).toContain(SOURCES[id].type);
    }
  });

  it('keeps structured sources off the CDN page', () => {
    expect(mediaSources('mux-video', 'html')).toEqual(MUX_SOURCE_IDS);
    expect(mediaSources('mux-video', 'cdn')).toEqual(NON_DASH_SOURCE_IDS);
    expect(mediaSources('hlsjs-video', 'html')).toContain('hls-drm');
    expect(mediaSources('hlsjs-video', 'cdn')).not.toContain('hls-drm');
  });

  it('offers YouTube page URLs to the YouTube media only, minus player parameters on the CDN page', () => {
    expect(mediaSources('youtube-video', 'react')).toEqual(YOUTUBE_SOURCE_IDS);
    expect(mediaSources('youtube-video', 'cdn')).not.toContain('youtube-captions-on');
    expect(mediaSources('youtube-video', 'cdn')).toContain('youtube-captions');

    for (const media of MEDIA_IDS.filter((id) => id !== 'youtube-video')) {
      for (const platform of ['html', 'cdn'] as const) {
        expect(
          mediaSources(media, platform).some((id) => SOURCES[id].type === 'youtube'),
          media
        ).toBe(false);
      }
    }
  });

  it('narrows dash.js to DASH manifests and lets the audio player take anything', () => {
    expect(mediaSources('dash-video', 'react')).toEqual(DASH_SOURCE_IDS);
    expect(mediaSources('audio', 'react')).toEqual(SOURCE_IDS);
    expect(mediaSources('video', 'react')).toEqual(NON_DASH_SOURCE_IDS);
  });
});

describe('landingSource', () => {
  it('keeps an offered source and otherwise lands on the entry or fallback source', () => {
    expect(landingSource('youtube-video', 'html', 'hls-1')).toBe(DEFAULT_YOUTUBE_SOURCE);
    expect(landingSource('youtube-video', 'html', 'youtube-short')).toBe('youtube-short');
    expect(landingSource('youtube-video', 'cdn', 'youtube-captions-on')).toBe(DEFAULT_YOUTUBE_SOURCE);
    expect(landingSource('video', 'html', 'youtube-short')).toBe(DEFAULT_SOURCE);
    expect(landingSource('video', 'html', 'hls-2')).toBe('hls-2');
    expect(landingSource('hls-background-video', 'html', 'hls-2')).toBe(DEFAULT_BACKGROUND_SOURCE);
  });
});

describe('hasTailwindSkin', () => {
  it('is available for the skinned players outside the CDN page', () => {
    expect(hasTailwindSkin('video', 'html')).toBe(true);
    expect(hasTailwindSkin('mux-audio', 'react')).toBe(true);
    expect(hasTailwindSkin('video', 'cdn')).toBe(false);
    expect(hasTailwindSkin('background-video', 'html')).toBe(false);
    expect(hasTailwindSkin('hls-background-video', 'html')).toBe(false);
    expect(hasTailwindSkin('vimeo-video', 'html')).toBe(false);
  });
});

describe('hasSkinChoice', () => {
  it('leaves only the background media without one', () => {
    expect(MEDIA_IDS.filter((id) => !hasSkinChoice(id))).toEqual([
      'background-video',
      'hls-background-video',
      'mux-background-video',
    ]);
  });
});
