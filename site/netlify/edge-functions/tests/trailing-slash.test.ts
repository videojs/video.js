// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import trailingSlash from '../trailing-slash';

async function locationOf(url: string): Promise<string | null | undefined> {
  const response = await trailingSlash(new Request(url));

  return response?.headers.get('location');
}

describe('trailingSlash', () => {
  it('drops the trailing slash on the same host', async () => {
    expect(await locationOf('https://videojs.org/docs/guides/autoplay/?a=1')).toBe(
      'https://videojs.org/docs/guides/autoplay?a=1'
    );
  });

  it('moves alias hosts to videojs.org in the same hop', async () => {
    expect(await locationOf('https://videojs.com/guides/react/')).toBe('https://videojs.org/guides/react');
    expect(await locationOf('https://www.videojs.com/blog/')).toBe('https://videojs.org/blog');
  });

  it('keeps deploy previews on their own host', async () => {
    expect(await locationOf('https://deploy-preview-1--vjs10-site.netlify.app/blog/')).toBe(
      'https://deploy-preview-1--vjs10-site.netlify.app/blog'
    );
  });

  it('leaves the embed snippet URL and the PostHog proxy to the redirect rules', async () => {
    expect(await trailingSlash(new Request('https://videojs.com/html5-video-support/'))).toBeUndefined();
    expect(await trailingSlash(new Request('https://videojs.org/ph/e/'))).toBeUndefined();
  });
});
