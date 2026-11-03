import { describe, expect, it } from 'vite-plus/test';

import { YouTubeVideo } from '../youtube-video/adapter';

describe('YouTubeVideo', () => {
  it("reports the embed's playback rate range, which the player narrows its rates to", () => {
    const tag = 'test-youtube-video-range';

    customElements.define(tag, class extends YouTubeVideo {});

    const element = document.createElement(tag) as HTMLElement & { playbackRateRange: unknown };

    expect(element.playbackRateRange).toEqual({ min: 0.25, max: 2 });
  });
});
