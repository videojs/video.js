import { isMediaLiveCapable, type MediaLiveState } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

/**
 * Player feature exposing `liveEdgeStart` and `targetLiveWindow` in store state for media that implements
 * `MediaLiveCapability` (currently `HlsJsAdapter` and its delegates).
 *
 * - `liveEdgeStart` — presentation time marking the start of the Live Edge Window. Playing at the live edge when
 *   `currentTime >= liveEdgeStart`. `NaN` when the stream isn't live or the value is unknown.
 * - `targetLiveWindow` — `0` for standard latency live, `Infinity` for DVR, `NaN` for on-demand or unknown.
 *
 * Included by the {@link liveVideoFeatures} and {@link liveAudioFeatures} presets; apps can also compose it into a
 * custom preset.
 *
 * @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0007-live-edge.md
 */
export const liveFeature = definePlayerFeature({
  name: 'live',
  state: (): MediaLiveState => ({
    liveEdgeStart: Number.NaN,
    targetLiveWindow: Number.NaN,
  }),

  // `liveEdgeStart` has no change event. The media calculates it at read
  // time from inputs that can change without an event: the seekable end,
  // and for hls.js its live edge estimate, which moves with the clock. So
  // we read it again on events that often come with such a change.
  //
  // `timeupdate` keeps the stored value current during playback;
  // `progress`/`canplay` cover buffer and metadata changes. While paused,
  // the stored value can lag until the next of these events.
  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaLiveCapable(media)) return;

    const sync = () =>
      set({
        liveEdgeStart: media.liveEdgeStart,
        targetLiveWindow: media.targetLiveWindow,
      });

    sync();

    listen(media, 'targetlivewindowchange', sync, { signal });
    listen(media, 'streamtypechange', sync, { signal });
    listen(media, 'loadedmetadata', sync, { signal });
    listen(media, 'canplay', sync, { signal });
    listen(media, 'progress', sync, { signal });
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'timeupdate', sync, { signal });
    listen(media, 'emptied', sync, { signal });
  },
});
