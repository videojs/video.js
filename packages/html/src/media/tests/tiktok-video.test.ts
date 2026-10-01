import { describe, expect, it } from 'vite-plus/test';

import { TikTokVideo } from '../tiktok-video/adapter';

const SRC = 'https://www.tiktok.com/@videojs/video/7273420104193772846';

describe('TikTokVideo', () => {
  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the embed out of hit-testing so the skin above it sees hover', () => {
    // A cross-origin frame swallows every pointer event it is given, and the skin never sees the hover that
    // reveals the controls.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toMatch(
      /:host\(:not\(\[controls\]\):not\(\[preload="none"\]\)\)\s*\{\s*pointer-events:\s*none/
    );
  });

  it('builds the embed with a bootstrap autoplay unless the player is left dormant', () => {
    // `autoplay=1` is the embed parameter; the `allow` attribute names the feature policy and carries it either way.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toContain('autoplay=1');
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toContain('autoplay=1');
    // The two cases the hit-testing rule above excludes are the two that skip the bootstrap, so the frame stays
    // clickable exactly where its own controls are the only way to start it.
    expect(TikTokVideo.getTemplateHTML({ src: SRC, controls: '' })).not.toContain('autoplay=1');
  });
});
