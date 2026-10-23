import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackRateFeature } from '../playback-rate';

/**
 * A media that takes no speed command, such as `TikTokVideo`: its adapter defines no `playbackRate` member, so the
 * store can only learn that it is missing.
 */
function createRatelessMedia(): HTMLVideoElement {
  const media = new EventTarget() as EventTarget & { paused: boolean; muted: boolean };

  media.paused = true;
  media.muted = false;

  return media as unknown as HTMLVideoElement;
}

describe('playbackRateFeature', () => {
  describe('attach', () => {
    it('reports playback rate unavailable before a media attaches', () => {
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      expect(store.state.playbackRateAvailability).toBe('unavailable');
    });

    it('reports playback rate available on a media with a playbackRate', () => {
      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      video.playbackRate = 1.5;
      store.attach({ media: video, container: null });

      expect(store.state.playbackRateAvailability).toBe('available');
      expect(store.state.playbackRate).toBe(1.5);
    });

    it('reports playback rate unsupported on a media without a playbackRate', () => {
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      store.attach({ media: createRatelessMedia(), container: null });

      expect(store.state.playbackRateAvailability).toBe('unsupported');
      expect(store.state.playbackRate).toBe(1);
    });

    it('updates on ratechange', () => {
      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      store.attach({ media: video, container: null });
      video.playbackRate = 2;
      video.dispatchEvent(new Event('ratechange'));

      expect(store.state.playbackRate).toBe(2);
    });
  });

  describe('setPlaybackRate', () => {
    it('sets the rate on a media with a playbackRate', () => {
      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      store.attach({ media: video, container: null });
      store.setPlaybackRate(1.5);

      expect(video.playbackRate).toBe(1.5);
    });

    it('leaves a media without a playbackRate untouched', () => {
      const media = createRatelessMedia();
      const store = createStore<PlayerTarget>()(playbackRateFeature);

      store.attach({ media, container: null });
      store.setPlaybackRate(2);

      expect('playbackRate' in media).toBe(false);
    });
  });
});
