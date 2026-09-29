import type { MediaPlaybackState } from '@videojs/media';
import { isMediaPauseCapable, isMediaSeekCapable, isMediaSourceCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

export const playbackFeature = definePlayerFeature({
  name: 'playback',
  state: ({ target, set }): MediaPlaybackState => ({
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    play() {
      const { media } = target();
      const playing = media.play();

      // The `play` event is queued, so sync now, or an immediate second toggle would read the old state. A refused
      // `play()` leaves `paused` true, and `media.ended` can lag behind a replay.
      if (isMediaPauseCapable(media) && !media.paused) set({ paused: false, ended: false, started: true });

      return playing;
    },
    pause() {
      const { media } = target();

      if (isMediaPauseCapable(media)) {
        media.pause();
        // The `pause` event is queued, so sync now, or an immediate second toggle would read the old state.
        set({ paused: media.paused });
      }
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaPauseCapable(media) || !isMediaSeekCapable(media) || !isMediaSourceCapable(media)) return;

    // `currentTime` when playback last ran short of data, or `null` when it did
    // not. Safari reports `HAVE_CURRENT_DATA` for the whole of some MSE streams
    // while decoding and presenting normally, so `readyState` never climbs back
    // over `HAVE_FUTURE_DATA` and `playing` never fires. A frame presented since
    // then is proof the browser had future data after all.
    let starvedAt: number | null = null;

    const sync = () => {
      const starved = media.readyState < HTMLMediaElement.HAVE_FUTURE_DATA && !media.paused;

      if (!starved) starvedAt = null;
      else starvedAt ??= media.currentTime;

      set({
        paused: media.paused,
        ended: media.ended,
        started: !media.paused || media.currentTime > 0,
        waiting: starved && starvedAt === media.currentTime,
      });
    };

    // The browser reports running short of data; only an advancing `currentTime`
    // reports recovering from it.
    const starve = () => {
      starvedAt = media.currentTime;
      sync();
    };

    sync();

    listen(media, 'emptied', starve, { signal });
    listen(media, 'play', starve, { signal });
    listen(media, 'pause', sync, { signal });
    listen(media, 'ended', sync, { signal });
    listen(media, 'playing', sync, { signal });
    listen(media, 'waiting', starve, { signal });
    listen(media, 'seeking', starve, { signal });
    listen(media, 'seeked', sync, { signal });
    listen(media, 'canplay', sync, { signal });
    listen(media, 'timeupdate', sync, { signal });
  },
});
