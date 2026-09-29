import type { MediaSourceState } from '@videojs/media';
import { isMediaSourceCapable, MediaReadyState } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

export const sourceFeature = definePlayerFeature({
  name: 'source',
  state: (): MediaSourceState => ({
    currentSrc: '',
    canPlay: false,
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaSourceCapable(media)) return;

    const sync = () =>
      set({
        currentSrc: media.currentSrc,
        canPlay: media.readyState >= MediaReadyState.HAVE_FUTURE_DATA,
      });

    sync();

    listen(media, 'canplay', sync, { signal });
    listen(media, 'canplaythrough', sync, { signal });
    listen(media, 'loadstart', sync, { signal });
    listen(media, 'emptied', sync, { signal });
  },
});
