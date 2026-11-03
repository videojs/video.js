import type { MediaBufferState } from '@videojs/media';
import { isMediaBufferCapable } from '@videojs/media';
import { listen } from '@videojs/utils/events';
import { serializeTimeRanges } from '@videojs/utils/time';

import { definePlayerFeature } from '../../feature';

export const bufferFeature = definePlayerFeature({
  name: 'buffer',
  state: (): MediaBufferState => ({
    buffered: [],
    seekable: [],
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaBufferCapable(media)) return;

    const sync = () =>
      set({
        buffered: serializeTimeRanges(media.buffered),
        seekable: serializeTimeRanges(media.seekable),
      });

    sync();

    listen(media, 'loadedmetadata', sync, { signal });
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'progress', sync, { signal });
    listen(media, 'emptied', sync, { signal });
  },
});
