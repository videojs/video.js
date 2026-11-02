import type { MediaPlaybackState } from '@videojs/media';
import { isMediaAutoplayCapable, isMediaPauseCapable, isMediaSeekCapable, isMediaSourceCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

export const playbackFeature = definePlayerFeature({
  name: 'playback',
  state: ({ target, set }): MediaPlaybackState => ({
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    autoplay: false,
    autoplaying: false,
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
        // Pausing also clears the browser's own autoplay flag, without an event when the media was already paused.
        media.pause();
        // The `pause` event is queued, so sync now, or an immediate second toggle would read the old state.
        set({ paused: media.paused, autoplaying: false });
      }
    },
  }),

  attach({ target, signal, get, set }) {
    const { media } = target;
    if (!isMediaPauseCapable(media) || !isMediaSeekCapable(media) || !isMediaSourceCapable(media)) return;

    const autoplayEnabled = () => isMediaAutoplayCapable(media) && media.autoplay;

    // The browser starts `autoplay` once it can play through, and doesn't announce a refusal. So a new source starts an
    // attempt, and the state tracks it until playback starts, `pause()` cancels it, or the media shows it was refused.
    let autoplayCheck: number | undefined;

    const cancelAutoplayCheck = () => {
      if (autoplayCheck !== undefined) cancelAnimationFrame(autoplayCheck);

      autoplayCheck = undefined;
    };

    const startAutoplay = () => {
      cancelAutoplayCheck();

      // Already able to play through but still paused: the browser refused it before the store attached.
      const autoplaying =
        autoplayEnabled() &&
        !!(media.currentSrc || media.src) &&
        media.paused &&
        !media.ended &&
        media.currentTime === 0 &&
        media.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA;

      set({ autoplay: autoplayEnabled(), autoplaying });
    };

    const refuseAutoplay = () => {
      if (get().autoplaying) set({ autoplaying: false });
    };

    // The browser starts an allowed autoplay as the media can play through. Chromium's muted autoplay lands a task or a
    // frame after `canplaythrough`, but before the second frame, so a media still paused then was refused. Embeds, which
    // don't play through, report a refusal with `pause` or `error` instead.
    const checkAutoplay = () => {
      if (!get().autoplaying) return;

      cancelAutoplayCheck();
      autoplayCheck = requestAnimationFrame(() => {
        autoplayCheck = requestAnimationFrame(() => {
          autoplayCheck = undefined;

          if (media.paused) refuseAutoplay();
        });
      });
    };

    signal.addEventListener('abort', cancelAutoplayCheck);

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

      const started = !media.paused || media.currentTime > 0;

      set({
        paused: media.paused,
        ended: media.ended,
        started,
        waiting: starved && starvedAt === media.currentTime,
        autoplay: autoplayEnabled(),
        // Only a new source starts an attempt; events can only end one.
        autoplaying: get().autoplaying && !started && !media.ended,
      });
    };

    // The browser reports running short of data; only an advancing `currentTime`
    // reports recovering from it.
    const starve = () => {
      starvedAt = media.currentTime;
      sync();
    };

    startAutoplay();
    sync();

    listen(media, 'emptied', startAutoplay, { signal });
    listen(media, 'loadstart', startAutoplay, { signal });
    listen(media, 'canplaythrough', checkAutoplay, { signal });
    listen(media, 'pause', refuseAutoplay, { signal });
    listen(media, 'error', refuseAutoplay, { signal });
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
