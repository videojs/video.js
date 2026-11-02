import type { MediaPlaybackRateRange, MediaPlaybackRateState } from '@videojs/media';
import { isMediaPlaybackRateCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { clamp } from '@videojs/utils/number';

import {
  filterPlaybackRates,
  getPlaybackRateRange,
  NATIVE_PLAYBACK_RATE_RANGE,
  parsePlaybackRates,
  roundPlaybackRate,
} from '../../../core/ui/utils/playback-rates';
import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';

const DEFAULT_RATES: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const DEFAULT_PLAYBACK_RATES = Symbol('@videojs/default-playback-rates');
const SET_DEFAULT_PLAYBACK_RATES = Symbol('@videojs/set-default-playback-rates');
// Kept off the public state until the shape settles.
const PLAYBACK_RATE_RANGE = Symbol('@videojs/playback-rate-range');

interface PlaybackRateSourceState extends Omit<MediaPlaybackRateState, 'playbackRates'> {
  [DEFAULT_PLAYBACK_RATES]: readonly number[];
  [SET_DEFAULT_PLAYBACK_RATES](value: readonly number[] | string | null | undefined): void;
  // Inline, so the feature's public type doesn't name the internal `MediaPlaybackRateRange`.
  [PLAYBACK_RATE_RANGE]: { readonly min: number; readonly max: number };
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

function warnUnfitPlaybackRates(rates: readonly number[], range: MediaPlaybackRateRange): void {
  if (filterPlaybackRates(rates, range).length > 0) return;

  console.warn(
    `[vjs] None of the default playback rates ${rates.join(', ')} is within the media's range of ${range.min} to ` +
      `${range.max}; using ${fitPlaybackRates(rates, range).join(', ')}.`
  );
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
  state: ({ target, get, set }): PlaybackRateSourceState => ({
    [DEFAULT_PLAYBACK_RATES]: DEFAULT_RATES,
    [SET_DEFAULT_PLAYBACK_RATES]: (value) => {
      const rates = parsePlaybackRates(value) ?? DEFAULT_RATES;

      set({ [DEFAULT_PLAYBACK_RATES]: rates });

      if (__DEV__) warnUnfitPlaybackRates(rates, get()[PLAYBACK_RATE_RANGE] as MediaPlaybackRateRange);
    },
    [PLAYBACK_RATE_RANGE]: NATIVE_PLAYBACK_RATE_RANGE,
    playbackRate: 1,
    playbackRateAvailability: 'unavailable',
    setPlaybackRate(rate: number) {
      const { media } = target();
      if (!isMediaPlaybackRateCapable(media)) return;

      // `0` is clamped too, on purpose: the spec allows it and Chromium skips its range check for it, but the media
      // then holds its frame while `paused` stays false, so the controls would claim it is playing. Use `pause()`.
      const { min, max } = getPlaybackRateRange(media);
      const next = clamp(rate, min, max);

      if (__DEV__ && next !== rate) {
        console.warn(`[vjs] Playback rate ${rate} is outside the media's range of ${min} to ${max}; using ${next}.`);
      }

      media.playbackRate = next;
    },
  }),
  derived: {
    /**
     * The default rates that fit the media's range. Set them through the player, not through the store. They are listed
     * even when the media cannot change its rate, so check `playbackRateAvailability` before offering them.
     */
    playbackRates: ({ get }): readonly number[] =>
      fitPlaybackRates(get()[DEFAULT_PLAYBACK_RATES], get()[PLAYBACK_RATE_RANGE]),
  },

  attach({ target, signal, get, set }) {
    const { media } = target;

    const syncRange = () => {
      const range = getPlaybackRateRange(media);
      const current = get()[PLAYBACK_RATE_RANGE];
      if (range.min === current.min && range.max === current.max) return;

      set({ [PLAYBACK_RATE_RANGE]: range });

      if (__DEV__) warnUnfitPlaybackRates(get()[DEFAULT_PLAYBACK_RATES], range);
    };

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

    const sync = () => set({ playbackRate: roundPlaybackRate(media.playbackRate) });

    set({ playbackRateAvailability: 'available' });
    sync();

    listen(media, 'ratechange', sync, { signal });
  },
});
