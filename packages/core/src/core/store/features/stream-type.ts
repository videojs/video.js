import {
  isMediaBufferCapable,
  isMediaSeekCapable,
  isMediaStreamTypeCapable,
  type MediaStreamType,
  MediaStreamTypes,
  type MediaStreamTypeState,
} from '@videojs/media';
import { listen } from '@videojs/utils/events';

import { definePlayerFeature } from '../../feature';

export const streamTypeFeature = definePlayerFeature({
  name: 'streamType',
  state: (): MediaStreamTypeState => ({
    streamType: MediaStreamTypes.UNKNOWN,
  }),

  // Prefer the media's own `streamType` (e.g. `HlsJsAdapter`, which derives it from
  // manifest metadata and dispatches `streamtypechange`).  For plain elements
  // without that capability, fall back to duration-based detection so the
  // store still reports `live`/`on-demand` for native MP4 / native HLS.
  attach({ target, signal, set }) {
    const { media } = target;

    if (isMediaStreamTypeCapable(media)) {
      const sync = () => set({ streamType: media.streamType });

      sync();
      listen(media, 'streamtypechange', sync, { signal });
      return;
    }

    if (!isMediaSeekCapable(media)) return;

    const detect = (): MediaStreamType => {
      const { duration } = media;
      if (duration === Number.POSITIVE_INFINITY) return MediaStreamTypes.LIVE;

      if (Number.isFinite(duration) && duration > 0) return MediaStreamTypes.ON_DEMAND;

      return MediaStreamTypes.UNKNOWN;
    };

    const sync = () => set({ streamType: detect() });

    sync();

    listen(media, 'durationchange', sync, { signal });
    listen(media, 'loadedmetadata', sync, { signal });
    listen(media, 'emptied', sync, { signal });

    // `progress` widens the seekable window for DVR streams — treat it as a
    // hint that the duration may now be usable.
    if (isMediaBufferCapable(media)) {
      listen(media, 'progress', sync, { signal });
    }
  },
});
