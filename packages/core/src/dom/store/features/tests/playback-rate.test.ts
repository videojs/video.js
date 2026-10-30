import type { MediaPlaybackRateRange } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { setPlayerConfigValue } from '../../../feature';
import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackRateFeature } from '../playback-rate';

const ratesConfig = playbackRateFeature.config!.defaultPlaybackRates;

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

function createRangedVideo(range: MediaPlaybackRateRange | undefined) {
  const video = createMockVideo();

  Object.defineProperty(video, 'playbackRateRange', { value: range, writable: true, configurable: true });

  return video as HTMLVideoElement & { playbackRateRange: MediaPlaybackRateRange | undefined };
}

afterEach(() => {
  vi.restoreAllMocks();
});

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

    it('drops the single-precision noise browsers report', () => {
      const video = createMockVideo();
      const store = createRateStore();

      store.attach({ media: video, container: null });
      video.playbackRate = Math.fround(1.1);
      video.dispatchEvent(new Event('ratechange'));

      expect(Math.fround(1.1)).not.toBe(1.1);
      expect(store.state.playbackRate).toBe(1.1);
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

    it.each([
      [32, 16],
      [0.01, 0.0625],
    ])('clamps %s to the native range as %s and warns', (rate, expected) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const video = createMockVideo();
      const store = createRateStore();

      store.attach({ media: video, container: null });
      store.setPlaybackRate(rate);

      expect(video.playbackRate).toBe(expected);
      expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(`Playback rate ${rate} is outside`));
    });

    it("clamps to the media's own range", () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const video = createRangedVideo({ min: 0.25, max: 2 });
      const store = createRateStore();

      store.attach({ media: video, container: null });
      store.setPlaybackRate(3);

      expect(video.playbackRate).toBe(2);
    });

    it('does not warn for a rate within the range', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const store = createRateStore();

      store.attach({ media: createMockVideo(), container: null });
      store.setPlaybackRate(1.1);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('defaultPlaybackRates', () => {
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

  describe('media range', () => {
    it('assumes the native range for a media that reports none', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [0.05, 1, 16, 17]);
      store.attach({ media: createMockVideo(), container: null });

      expect(store.state.playbackRates).toEqual([1, 16]);
    });

    it("leaves out rates outside the media's range, keeping the author order", () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [3, 0.25, 2, 1.1, 0.5]);
      store.attach({ media: createRangedVideo({ min: 0.5, max: 2 }), container: null });

      expect(store.state.playbackRates).toEqual([2, 1.1, 0.5]);
    });

    it('falls back to the defaults that fit when no configured rate does', () => {
      const store = createRateStore();

      setPlayerConfigValue(store, ratesConfig, [3, 4]);
      store.attach({ media: createRangedVideo({ min: 0.5, max: 1 }), container: null });

      expect(store.state.playbackRates).toEqual([0.5, 0.75, 1]);
    });

    it('falls back to the rate nearest 1 when no default fits', () => {
      const store = createRateStore();

      store.attach({ media: createRangedVideo({ min: 3, max: 4 }), container: null });

      expect(store.state.playbackRates).toEqual([3]);
    });

    it('keeps the range off the public state', () => {
      const store = createRateStore();

      store.attach({ media: createRangedVideo({ min: 0.25, max: 2 }), container: null });

      expect(Reflect.ownKeys(store.state).filter((key) => String(key).includes('Range'))).toEqual([]);
    });

    it('reads the range again when a new source loads', () => {
      const store = createRateStore();
      const video = createRangedVideo(undefined);

      setPlayerConfigValue(store, ratesConfig, [1, 3]);
      store.attach({ media: video, container: null });
      video.playbackRateRange = { min: 0.25, max: 2 };
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.playbackRates).toEqual([1]);
    });
  });
});
