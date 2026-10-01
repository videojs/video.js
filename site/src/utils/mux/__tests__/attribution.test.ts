import { describe, expect, it } from 'vite-plus/test';

import { MUX_SUPPORT_URL, MUX_URL } from '@/consts';

import { contentPlacement, withMuxAttribution } from '../attribution';

describe('withMuxAttribution', () => {
  it('adds the placement to a tagged Mux link and keeps its campaign', () => {
    expect(withMuxAttribution(MUX_URL, 'hero')).toBe(
      'https://www.mux.com/?utm_source=videojs&utm_campaign=vjs10&utm_content=hero'
    );
    expect(withMuxAttribution(MUX_SUPPORT_URL, 'support-page')).toBe(
      'https://www.mux.com/sales-contact?form=sales&utm_source=videojs&utm_campaign=vjs10&utm_content=support-page'
    );
  });

  it('tags untagged Mux pages, subdomains included, and keeps their fragment', () => {
    expect(withMuxAttribution('https://www.mux.com/docs/guides/secure-video-playback#sign', 'docs-content')).toBe(
      'https://www.mux.com/docs/guides/secure-video-playback?utm_source=videojs&utm_campaign=vjs10&utm_content=docs-content#sign'
    );
    expect(withMuxAttribution('https://dashboard.mux.com/settings/data', 'docs-content')).toBe(
      'https://dashboard.mux.com/settings/data?utm_source=videojs&utm_campaign=vjs10&utm_content=docs-content'
    );
  });

  it('keeps a placement the link already names', () => {
    expect(withMuxAttribution('https://www.mux.com/?utm_content=custom', 'footer')).toBe(
      'https://www.mux.com/?utm_content=custom&utm_source=videojs&utm_campaign=vjs10'
    );
  });

  it('leaves media, other sites, and on-site links alone', () => {
    const stream = 'https://stream.mux.com/abc.m3u8';

    expect(withMuxAttribution(stream, 'docs-content')).toBe(stream);
    expect(withMuxAttribution('https://github.com/videojs/v10', 'docs-content')).toBe('https://github.com/videojs/v10');
    expect(withMuxAttribution('/docs/guides/mux-data', 'docs-content')).toBe('/docs/guides/mux-data');
  });
});

describe('contentPlacement', () => {
  it('separates blog posts from the docs', () => {
    expect(contentPlacement('/blog/videojs-v10-release-candidate')).toBe('blog-content');
    expect(contentPlacement('/docs/framework/html/guides/mux-data')).toBe('docs-content');
  });
});
