import type { MediaPlaybackRateState } from '@videojs/media';
import { isMediaPlaybackRateCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

const DEFAULT_RATES: readonly number[] = [0.2, 0.5, 0.7, 1, 1.2, 1.5, 1.7, 2];

export const playbackRateFeature = definePlayerFeature({
  name: 'playbackRate',
  state: ({ target }): MediaPlaybackRateState => ({
    playbackRates: DEFAULT_RATES,
    playbackRate: 1,
    playbackRateAvailability: 'unavailable',
    setPlaybackRate(rate: number) {
      const { media } = target();

      if (isMediaPlaybackRateCapable(media)) media.playbackRate = rate;
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;

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
