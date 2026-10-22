import type {
  MediaPlaybackRateState,
  MediaPlaybackRateSupport,
  MediaPlaybackRateSupportCapability,
} from '@videojs/media';
import { isMediaPlaybackRateCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { tryCall } from '@videojs/utils/function';
import { isString } from '@videojs/utils/predicate';

import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';

const DEFAULT_RATES: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const USER_RATES = Symbol('@videojs/user-playback-rates');
const SET_USER_RATES = Symbol('@videojs/set-user-playback-rates');
const RATE_SUPPORT = Symbol('@videojs/playback-rate-support');

interface PlaybackRateSourceState extends Omit<MediaPlaybackRateState, 'playbackRates'> {
  [USER_RATES]: readonly number[];
  [SET_USER_RATES](value: readonly number[] | string | null | undefined): void;
  [RATE_SUPPORT]: MediaPlaybackRateSupport | undefined;
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

/**
 * Narrows the requested rates to those the media accepts, keeping their order. When none survive, falls back to the
 * supported defaults, then to the media's own list, so a control always has a rate to offer.
 */
function filterSupportedRates(
  rates: readonly number[],
  support: MediaPlaybackRateSupport | undefined
): readonly number[] {
  if (!support) return rates;

  const { rates: listed, min = 0, max = Number.POSITIVE_INFINITY } = support;
  const isSupported = (rate: number) => rate >= min && rate <= max && (!listed || listed.includes(rate));

  const requested = rates.filter(isSupported);
  if (requested.length > 0) return requested;

  const defaults = DEFAULT_RATES.filter(isSupported);
  if (defaults.length > 0) return defaults;

  return listed?.length ? listed : [1];
}

export const playbackRateFeature = definePlayerFeature({
  name: 'playbackRate',
  config: {
    /**
     * Rates the player offers, in the order controls cycle through them. HTML takes a space-separated list, such as
     * `playback-rates="0.5 1 1.5 2"`. Missing or empty input restores the defaults. Rates the media does not accept are
     * left out, so a YouTube video, for example, may offer fewer.
     */
    playbackRates: {
      action: SET_USER_RATES,
      state: USER_RATES,
    },
  } satisfies PlayerFeatureConfig<PlaybackRateSourceState>,
  state: ({ target, set }): PlaybackRateSourceState => ({
    [USER_RATES]: DEFAULT_RATES,
    [SET_USER_RATES]: (value) => set({ [USER_RATES]: resolvePlaybackRates(value) }),
    [RATE_SUPPORT]: undefined,
    playbackRate: 1,
    playbackRateAvailability: 'unavailable',
    setPlaybackRate(rate: number) {
      const { media } = target();

      // A browser may still reject a rate the media reported as supported; a rejected rate leaves playback as it was.
      if (isMediaPlaybackRateCapable(media)) tryCall(() => (media.playbackRate = rate));
    },
  }),
  derived: {
    /** The configured rates the media accepts. Set them through the player, not through the store. */
    playbackRates: ({ get }): readonly number[] => filterSupportedRates(get()[USER_RATES], get()[RATE_SUPPORT]),
  },

  attach({ target, signal, set }) {
    const { media } = target;

    const syncSupport = () =>
      set({ [RATE_SUPPORT]: (media as Partial<MediaPlaybackRateSupportCapability>).playbackRateSupport });

    syncSupport();

    listen(media, 'playbackratesupportchange', syncSupport, { signal });
    // An adapter can receive its target after the store attaches.
    listen(media, 'loadstart', syncSupport, { signal });

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
