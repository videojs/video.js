import { describe, expect, it } from 'vite-plus/test';

import { TikTokVideo } from '../tiktok-video/adapter';

const SRC = 'https://www.tiktok.com/@videojs/video/7273420104193772846';

describe('TikTokVideo', () => {
  it('builds the embed with a bootstrap autoplay unless its own controls are showing', () => {
    // `autoplay=1` is the embed parameter; the `allow` attribute names the feature policy and carries it either way.
    expect(TikTokVideo.getTemplateHTML({ src: SRC })).toContain('autoplay=1');
    // A dormant player starts only from a click inside the frame, which a skin or poster drawn over it takes.
    expect(TikTokVideo.getTemplateHTML({ src: SRC, preload: 'none' })).toContain('autoplay=1');
    // TikTok's chrome takes clicks, so the frame is left for the viewer to start.
    expect(TikTokVideo.getTemplateHTML({ src: SRC, controls: '' })).not.toContain('autoplay=1');
  });
});
