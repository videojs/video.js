import type { MediaPlaybackRateState } from '@videojs/media';
import { isMediaPlaybackRateCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isString } from '@videojs/utils/predicate';

import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';

const DEFAULT_RATES: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const SET_PLAYBACK_RATES = Symbol('@videojs/set-playback-rates');

interface PlaybackRateSourceState extends MediaPlaybackRateState {
  [SET_PLAYBACK_RATES](value: readonly number[] | string | null | undefined): void;
}

/**
 * Normalizes author input into the rates the player cycles through. Accepts an array or a space-separated attribute
 * value, keeps the author's order, and drops invalid and repeated rates. Input with no usable rate restores the
 * defaults.
 */
function resolvePlaybackRates(value: readonly number[] | string | null | undefined): readonly number[] {
  const candidates = isString(value) ? value.trim().split(/\s+/).map(Number) : (value ?? []);
  const rates = [...new Set(candidates.filter((rate) => Number.isFinite(rate) && rate > 0))];

  return rates.length > 0 ? rates : DEFAULT_RATES;
}

export const playbackRateFeature = definePlayerFeature({
  name: 'playbackRate',
  config: {
    /**
     * Rates the player offers, in the order controls cycle through them. HTML takes a space-separated list, such as
     * `playback-rates="0.5 1 1.5 2"`. Missing or empty input restores the defaults.
     */
    playbackRates: {
      action: SET_PLAYBACK_RATES,
      state: 'playbackRates',
    },
  } satisfies PlayerFeatureConfig<PlaybackRateSourceState>,
  state: ({ target, set }): PlaybackRateSourceState => ({
    playbackRates: DEFAULT_RATES,
    playbackRate: 1,
    setPlaybackRate(rate: number) {
      const { media } = target();

      if (isMediaPlaybackRateCapable(media)) media.playbackRate = rate;
    },
    [SET_PLAYBACK_RATES]: (value) => set({ playbackRates: resolvePlaybackRates(value) }),
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaPlaybackRateCapable(media)) return;

    const sync = () => set({ playbackRate: media.playbackRate });

    sync();

    listen(media, 'ratechange', sync, { signal });
  },
});
