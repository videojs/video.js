import { describe, expect, it } from 'vite-plus/test';

import { resolveInstallationMethodHref, resolveInstallationMethodUrl } from '../method-navigation';
import { DEFAULT_SELECTION } from '../url-state';

describe('resolveInstallationMethodUrl', () => {
  it('carries shared choices and the selected framework into Shadcn', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html?preset=audio&skin=neutral');
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/shadcn', 'shadcn');

    expect(result.pathname).toBe('/docs/guides/installation/shadcn');
    expect(result.searchParams.get('framework')).toBe('html');
    expect(result.searchParams.get('preset')).toBe('audio');
    expect(result.searchParams.get('skin')).toBe('neutral');
  });

  it('carries the React route into Shadcn when the destination names no framework', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/react');
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/shadcn', 'shadcn');

    expect(result.searchParams.get('framework')).toBe('react');
  });

  it('drops the no-scaffold choice when switching to Shadcn', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html?template=none');
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/shadcn', 'shadcn');

    expect(result.searchParams.get('framework')).toBe('html');
    expect(result.searchParams.has('template')).toBe(false);
  });

  it('uses the CDN guide implicit existing-site setup', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html?template=none');
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/cdn', 'cdn');

    expect(result.searchParams.has('template')).toBe(false);
  });

  it('returns from Shadcn to the selected packaged framework', () => {
    const current = new URL(
      'https://videojs.org/docs/guides/installation/shadcn?framework=html&preset=audio&template=astro&styling=css'
    );
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation', 'packaged');

    expect(result.pathname).toBe('/docs/guides/installation/html');
    expect(result.searchParams.has('framework')).toBe(false);
    expect(result.searchParams.get('template')).toBe('astro');
    expect(result.searchParams.has('styling')).toBe(false);
    expect(result.searchParams.get('preset')).toBe('audio');
  });

  it('returns from CDN to packaged HTML with the shared choices', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/cdn?preset=audio&skin=neutral');
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/html', 'packaged');

    expect(result.pathname).toBe('/docs/guides/installation/html');
    expect(result.searchParams.get('preset')).toBe('audio');
    expect(result.searchParams.get('skin')).toBe('neutral');
  });

  it('uses choices already written into the card destination', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html?preset=audio');
    const result = resolveInstallationMethodUrl(
      current,
      '/docs/guides/installation/shadcn?preset=live-video&framework=html',
      'shadcn'
    );

    expect(result.searchParams.get('preset')).toBe('live-video');
    expect(result.searchParams.get('framework')).toBe('html');
  });

  it('removes the source framework when switching to CDN', () => {
    const current = new URL(
      'https://videojs.org/docs/guides/installation/shadcn?framework=react&preset=audio&package-manager=yarn&template=vite&styling=css'
    );
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/cdn', 'cdn');

    expect(result.pathname).toBe('/docs/guides/installation/cdn');
    expect(result.searchParams.has('framework')).toBe(false);
    expect(result.searchParams.has('package-manager')).toBe(false);
    expect(result.searchParams.has('template')).toBe(false);
    expect(result.searchParams.has('styling')).toBe(false);
    expect(result.searchParams.get('preset')).toBe('audio');
  });

  it('carries a new project and its package manager into the CDN Vite app', () => {
    const current = new URL(
      'https://videojs.org/docs/guides/installation/html?project=new&template=astro&package-manager=yarn'
    );
    const result = resolveInstallationMethodUrl(current, '/docs/guides/installation/cdn', 'cdn');

    expect(result.search).toBe('?project=new&package-manager=yarn&template=vite');
  });
});

describe('resolveInstallationMethodHref', () => {
  it('writes the selected HTML framework when switching to Shadcn', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html');
    const result = resolveInstallationMethodHref(
      current,
      '/docs/guides/installation/shadcn',
      'shadcn',
      DEFAULT_SELECTION,
      'html'
    );

    expect(result).toBe('/docs/guides/installation/shadcn?framework=html');
  });

  it('uses the selected Shadcn framework when returning to Packaged', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/shadcn?framework=react');
    const result = resolveInstallationMethodHref(
      current,
      '/docs/guides/installation/html',
      'packaged',
      { ...DEFAULT_SELECTION, useCase: 'default-audio', skin: 'neutral-audio', media: 'html5-audio' },
      'html'
    );

    expect(result).toBe('/docs/guides/installation/html?preset=audio&skin=neutral');
  });

  it('drops the package manager for an existing CDN page', () => {
    const current = new URL('https://videojs.org/docs/guides/installation/html');
    const result = resolveInstallationMethodHref(current, '/docs/guides/installation/cdn', 'cdn', {
      ...DEFAULT_SELECTION,
      installMethod: 'bun',
      useCase: 'default-audio',
      skin: 'neutral-audio',
      media: 'html5-audio',
      sourceUrl: 'https://example.com/audio.mp3',
    });

    expect(result).toBe(
      '/docs/guides/installation/cdn?preset=audio&skin=neutral&source-url=https%3A%2F%2Fexample.com%2Faudio.mp3'
    );
  });
});
