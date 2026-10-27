import { describe, expect, it } from 'vite-plus/test';

import { TikTokVideo } from '../tiktok-video/adapter';

const SRC = 'https://www.tiktok.com/@videojs/video/7273420104193772846';

let tagCounter = 0;

function createTikTokVideo(): TikTokVideo {
  const TestTikTokVideo = class extends TikTokVideo {};

  customElements.define(`test-tiktok-video-${tagCounter++}`, TestTikTokVideo);
  return new TestTikTokVideo();
}

describe('TikTokVideo', () => {
  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('leaves a dormant embed clickable only until it has played', () => {
    // `preload="none"` leaves TikTok's player unbuilt until something inside the frame is clicked.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toMatch(
      /:host\(\[preload="none"\]\) iframe:not\(\[data-started\]\)\s*\{\s*pointer-events:\s*auto/
    );
  });

  it('marks the embed started on play and dormant again once a new embed replaces it', () => {
    const element = createTikTokVideo();
    const iframe = element.shadowRoot!.querySelector('iframe')!;

    expect(iframe.hasAttribute('data-started')).toBe(false);

    element.adapter.dispatchEvent(new Event('play'));
    expect(iframe.hasAttribute('data-started')).toBe(true);

    element.adapter.dispatchEvent(new Event('emptied'));
    expect(iframe.hasAttribute('data-started')).toBe(false);
  });

  it('builds the embed with a bootstrap autoplay unless the player is left dormant', () => {
    // `autoplay=1` is the embed parameter; the `allow` attribute names the feature policy and carries it either way.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toContain('autoplay=1');
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none' })).not.toContain('autoplay=1');
    // The two cases that skip the bootstrap are the two where the frame stays clickable, since its own controls are
    // then the only way to start it.
    expect(TikTokVideo.getTemplateHTML({ src: SRC, controls: '' })).not.toContain('autoplay=1');
  });
});
