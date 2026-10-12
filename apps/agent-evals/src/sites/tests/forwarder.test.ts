import { describe, expect, it } from 'vitest';

import { rewriteLocation } from '../forwarder.ts';

describe('rewriteLocation', () => {
  const origin = 'https://deploy-preview-2948--vjs10-site.netlify.app';

  it('keeps redirects inside the preview on the host the client asked for', () => {
    expect(rewriteLocation(`${origin}/docs/guides/installation/react`, 'videojs.org', origin)).toBe(
      'https://videojs.org/docs/guides/installation/react'
    );
  });

  it('leaves relative and external redirects alone', () => {
    expect(rewriteLocation('/docs/guides', 'videojs.org', origin)).toBe('/docs/guides');
    expect(rewriteLocation('https://github.com/videojs/v10', 'videojs.org', origin)).toBe(
      'https://github.com/videojs/v10'
    );
  });
});
