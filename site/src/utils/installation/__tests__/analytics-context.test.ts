import { describe, expect, it } from 'vite-plus/test';

import { installationAnalyticsContext, installationContextForUrl } from '../analytics-context';
import { DEFAULT_SELECTION } from '../url-state';

describe('installationAnalyticsContext', () => {
  it('names every pick after its query parameter, defaults included', () => {
    expect(installationAnalyticsContext('react', DEFAULT_SELECTION)).toEqual({
      installation_route: 'react',
      installation_method: 'pnpm',
      installation_framework: 'react',
      installation_project: 'existing',
      installation_template: 'next',
      installation_preset: expect.any(String),
      installation_skin: 'video',
      installation_media: 'html5-video',
      installation_extensions: '',
      installation_styling: null,
      installation_custom_source: false,
    });
  });

  it('says a source URL was given without including it', () => {
    const context = installationAnalyticsContext('html', {
      ...DEFAULT_SELECTION,
      sourceUrl: 'https://secret.example.com/video.m3u8?token=abc',
    });

    expect(context.installation_custom_source).toBe(true);
    expect(JSON.stringify(context)).not.toContain('secret.example.com');
  });
});

describe('installationContextForUrl', () => {
  it('reads the picks from an HTML or Markdown guide URL alike', () => {
    const search = '?package-manager=npm&skin=neutral';

    expect(installationContextForUrl('/docs/guides/installation/html.md', search)).toEqual(
      installationContextForUrl('/docs/guides/installation/html', search)
    );
    expect(installationContextForUrl('/docs/guides/installation/html.md', search)).toMatchObject({
      installation_route: 'html',
      installation_framework: 'html',
      installation_method: 'npm',
      installation_skin: 'neutral-video',
    });
  });

  it('is empty off the installation guide', () => {
    expect(installationContextForUrl('/docs/framework/html/guides/fullscreen.md', '?skin=neutral')).toEqual({});
  });
});
