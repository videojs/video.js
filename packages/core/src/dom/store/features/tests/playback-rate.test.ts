import type { MediaPlaybackRateSupport } from '@videojs/media';
import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import { setPlayerConfigValue } from '../../../feature';
import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackRateFeature } from '../playback-rate';

const ratesConfig = playbackRateFeature.config!.playbackRates;

function createRateStore() {
  return createStore<PlayerTarget>()(playbackRateFeature);
}

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

function createSupportingVideo(support: MediaPlaybackRateSupport | undefined) {
  const video = createMockVideo();

  Object.defineProperty(video, 'playbackRateSupport', { value: support, writable: true, configurable: true });

  return video as HTMLVideoElement & { playbackRateSupport: MediaPlaybackRateSupport | undefined };
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

    it('leaves the rate unchanged when the media rejects it', () => {
      const store = createRateStore();
      const video = createMockVideo();

      Object.defineProperty(video, 'playbackRate', {
        get: () => 1,
        set: () => {
          throw new DOMException('Unsupported rate', 'NotSupportedError');
        },
        configurable: true,
      });
      store.attach({ media: video, container: null });

      expect(() => store.state.setPlaybackRate(32)).not.toThrow();
      expect(store.state.playbackRate).toBe(1);
    });
  });

  describe('playbackRates', () => {
    it('keeps configured rates in the author order', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [2, 1, 0.5]);

      expect(store.state.playbackRates).toEqual([2, 1, 0.5]);
    });

    it('parses a space-separated attribute value', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, ' 0.5  1\n1.5 2 ');

      expect(store.state.playbackRates).toEqual([0.5, 1, 1.5, 2]);
    });

    it('drops invalid and repeated rates', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, '1 fast 0 -1 Infinity 2 1');

      expect(store.state.playbackRates).toEqual([1, 2]);
    });

    it.each([undefined, null, '', '   ', 'fast', [], [0, Number.NaN]])(
      'restores the defaults for unusable input %j',
      (value) => {
        const store = createRateStore();
        const defaults = store.state.playbackRates;

        setPlayerConfigValue(store, ratesConfig, [1, 2]);
        setPlayerConfigValue(store, ratesConfig, value);

        expect(store.state.playbackRates).toEqual(defaults);
      }
    );

    it('preserves configured rates across media detach', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [1, 2]);

      const detach = store.attach({ media: createMockVideo(), container: null });

      detach();

      expect(store.state.playbackRates).toEqual([1, 2]);
    });
  });

  describe('media support', () => {
    it('leaves out rates outside the supported range, keeping the author order', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [3, 0.25, 2, 1, 0.5]);
      store.attach({ media: createSupportingVideo({ min: 0.5, max: 2 }), container: null });

      expect(store.state.playbackRates).toEqual([2, 1, 0.5]);
    });

    it('leaves out rates the media does not list', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [0.5, 1, 1.1, 2]);
      store.attach({ media: createSupportingVideo({ rates: [0.25, 0.5, 1, 2] }), container: null });

      expect(store.state.playbackRates).toEqual([0.5, 1, 2]);
    });

    it('falls back to the supported defaults when no configured rate is supported', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [3, 4]);
      store.attach({ media: createSupportingVideo({ min: 0.5, max: 1 }), container: null });

      expect(store.state.playbackRates).toEqual([0.5, 0.75, 1]);
    });

    it("falls back to the media's own list when no default is supported", () => {
      const store = createRateStore();

      store.attach({ media: createSupportingVideo({ rates: [3, 4] }), container: null });

      expect(store.state.playbackRates).toEqual([3, 4]);
    });

    it('follows support the media announces, restoring the configured rates once it clears', () => {
      const store = createRateStore();
      const video = createSupportingVideo(undefined);

      setPlayerConfigValue(store, ratesConfig, [0.5, 1, 3]);
      store.attach({ media: video, container: null });

      expect(store.state.playbackRates).toEqual([0.5, 1, 3]);

      video.playbackRateSupport = { rates: [1, 3] };
      video.dispatchEvent(new Event('playbackratesupportchange'));

      expect(store.state.playbackRates).toEqual([1, 3]);

      video.playbackRateSupport = undefined;
      video.dispatchEvent(new Event('playbackratesupportchange'));

      expect(store.state.playbackRates).toEqual([0.5, 1, 3]);
    });
  });
});
