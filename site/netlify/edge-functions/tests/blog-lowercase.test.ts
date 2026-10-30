// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import blogLowercase, { config } from '../blog-lowercase';

async function locationOf(url: string): Promise<string | null | undefined> {
  const response = await blogLowercase(new Request(url));

  return response?.headers.get('location');
}

describe('blogLowercase', () => {
  it('lowercases a capitalized slug and drops the trailing slash in one hop', async () => {
    expect(await locationOf('https://videojs.org/blog/Video-js-7-is-here/?ref=x')).toBe(
      'https://videojs.org/blog/video-js-7-is-here?ref=x'
    );
  });

  it('moves alias hosts to videojs.org in the same hop', async () => {
    expect(await locationOf('https://videojs.com/blog/Brightcove-Acquires-Zencoder')).toBe(
      'https://videojs.org/blog/brightcove-acquires-zencoder'
    );
  });

  it('keeps percent-escapes as they are', async () => {
    expect(await locationOf('https://videojs.org/blog/That%E2%80%99s-It')).toBe(
      'https://videojs.org/blog/that%E2%80%99s-it'
    );
    expect(await blogLowercase(new Request('https://videojs.org/blog/that%E2%80%99s-it'))).toBeUndefined();
  });

  it('routes only capitalized blog paths here, as Netlify anchors the pattern at both ends', () => {
    const route = new RegExp(`^${String(config.pattern).replace(/^\^/, '').replace(/\$$/, '')}$`);

    expect(route.test('/blog/Brightcove-Acquires-Zencoder')).toBe(true);
    expect(route.test('/blog/That%E2%80%99s-it')).toBe(true);
    expect(route.test('/blog/brightcove-acquires-zencoder')).toBe(false);
    expect(route.test('/docs/Guides')).toBe(false);
  });
});
