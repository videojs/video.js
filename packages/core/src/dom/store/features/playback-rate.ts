import type { MediaPlaybackRateRange, MediaPlaybackRateRangeCapability, MediaPlaybackRateState } from '@videojs/media';
import { isMediaPlaybackRateCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { clamp } from '@videojs/utils/number';

import { filterPlaybackRates, parsePlaybackRates } from '../../../core/ui/utils/playback-rates';
import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';

const DEFAULT_RATES: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Chromium throws outside this range and Firefox stops playing outside it. WebKit accepts any rate, but its audio drops
// out well inside these bounds, so this shared range is assumed for a media that reports none.
const NATIVE_RANGE: MediaPlaybackRateRange = { min: 0.0625, max: 16 };

const DEFAULT_PLAYBACK_RATES = Symbol('@videojs/default-playback-rates');
const SET_DEFAULT_PLAYBACK_RATES = Symbol('@videojs/set-default-playback-rates');

interface PlaybackRateSourceState extends Omit<MediaPlaybackRateState, 'playbackRates'> {
  [DEFAULT_PLAYBACK_RATES]: readonly number[];
  [SET_DEFAULT_PLAYBACK_RATES](value: readonly number[] | string | null | undefined): void;
}

/** The media's own rate range, or the native one when it reports none. */
function getPlaybackRateRange(media: object): MediaPlaybackRateRange {
  return (media as Partial<MediaPlaybackRateRangeCapability>).playbackRateRange ?? NATIVE_RANGE;
}

/**
 * Narrows the default rates to the media's range, keeping their order. When none fit, falls back to the built-in
 * defaults that fit, then to the rate nearest `1`, so a control always has a rate to offer.
 */
function fitPlaybackRates(rates: readonly number[], range: MediaPlaybackRateRange): readonly number[] {
  const fitted = filterPlaybackRates(rates, range);
  if (fitted.length > 0) return fitted;

  const defaults = filterPlaybackRates(DEFAULT_RATES, range);
  if (defaults.length > 0) return defaults;

  return [clamp(1, range.min, range.max)];
}

export const playbackRateFeature = definePlayerFeature({
  name: 'playbackRate',
  config: {
    /**
     * Rates the player's controls offer, in the order they cycle through them, unless a control sets its own `rates`.
     * HTML takes a space-separated list, such as `default-playback-rates="0.5 1 1.5 2"`. Missing or empty input
     * restores the defaults. Rates outside the media's range are left out, so YouTube, which plays up to `2`, may offer
     * fewer.
     */
    defaultPlaybackRates: {
      action: SET_DEFAULT_PLAYBACK_RATES,
      state: DEFAULT_PLAYBACK_RATES,
    },
  } satisfies PlayerFeatureConfig<PlaybackRateSourceState>,
  state: ({ target, set }): PlaybackRateSourceState => ({
    [DEFAULT_PLAYBACK_RATES]: DEFAULT_RATES,
    [SET_DEFAULT_PLAYBACK_RATES]: (value) =>
      set({ [DEFAULT_PLAYBACK_RATES]: parsePlaybackRates(value) ?? DEFAULT_RATES }),
    playbackRate: 1,
    playbackRateRange: NATIVE_RANGE,
    playbackRateAvailability: 'unavailable',
    setPlaybackRate(rate: number) {
      const { media } = target();
      if (!isMediaPlaybackRateCapable(media)) return;

      const { min, max } = getPlaybackRateRange(media);
      const next = clamp(rate, min, max);

      if (__DEV__ && next !== rate) {
        console.warn(`[vjs] Playback rate ${rate} is outside the media's range of ${min} to ${max}; using ${next}.`);
      }

      media.playbackRate = next;
    },
  }),
  derived: {
    /** The default rates that fit the media's range. Set them through the player, not through the store. */
    playbackRates: ({ get }): readonly number[] =>
      fitPlaybackRates(get()[DEFAULT_PLAYBACK_RATES], get().playbackRateRange),
  },

  attach({ target, signal, set }) {
    const { media } = target;

    const syncRange = () => set({ playbackRateRange: getPlaybackRateRange(media) });

    syncRange();

    // An adapter can receive the target that reports its range after the store attaches.
    listen(media, 'loadstart', syncRange, { signal });

    // A media with no `playbackRate`, such as an embed whose provider takes no
    // speed command, would otherwise keep the default rates and show a control
    // that does nothing.
    if (!isMediaPlaybackRateCapable(media)) {
      set({ playbackRate: 1, playbackRateAvailability: 'unsupported' });
      return;
    }

    const sync = () => set({ playbackRate: media.playbackRate });

    set({ playbackRateAvailability: 'available' });
    sync();

    listen(media, 'ratechange', sync, { signal });
  },
});
