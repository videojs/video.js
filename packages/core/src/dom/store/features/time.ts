import {
  hasMetadata,
  isMediaBufferCapable,
  isMediaPauseCapable,
  isMediaSeekCapable,
  isMediaSourceCapable,
  type MediaTimeState,
} from '@videojs/media';
import { animationFrame, listen, onEvent } from '@videojs/utils/dom';
import { noop } from '@videojs/utils/function';

import { definePlayerFeature } from '../../feature';
import { signalKeys } from '../signal-keys';

export const timeFeature = definePlayerFeature({
  name: 'time',
  state: ({ target, signals, set }): MediaTimeState => ({
    currentTime: 0,
    duration: 0,
    seeking: false,
    async seek(time: number) {
      const { media } = target(),
        signal = signals.supersede(signalKeys.seek);
      if (!isMediaSeekCapable(media) || !isMediaSourceCapable(media)) return 0;

      // A new source abandons the seek at any stage, so `emptied` cancels it like a superseding seek.
      listen(media, 'emptied', () => signals.supersede(signalKeys.seek), { signal, once: true });

      if (!hasMetadata(media)) {
        const loaded = await onEvent(media, 'loadedmetadata', { signal }).catch(() => false);
        if (!loaded) return media.currentTime;
      }

      const clampedTime = Math.max(0, Math.min(time, media.duration || Infinity));

      set({ currentTime: clampedTime, seeking: true });

      media.currentTime = clampedTime;
      await onEvent(media, 'seeked', { signal }).catch(noop);

      return media.currentTime;
    },
  }),

  attach({ target, signal, set, get }) {
    const { media } = target;
    if (!isMediaSeekCapable(media)) return;

    // For live streams `media.duration` is `Infinity` — fall back to the end
    // of the last seekable range, which represents the live edge and tracks
    // the sliding DVR window as new segments become available.
    const resolveDuration = () => {
      const { duration } = media;

      if (duration === Number.POSITIVE_INFINITY && isMediaBufferCapable(media)) {
        const { seekable } = media;

        return seekable.length > 0 ? seekable.end(seekable.length - 1) : 0;
      }

      return Number.isFinite(duration) ? duration : 0;
    };

    const sync = () =>
      set({
        currentTime: media.currentTime,
        duration: resolveDuration(),
        seeking: media.seeking,
      });

    // While a seek is in-flight the store holds an optimistic `currentTime`
    // that reflects the user's target position.  Browser `timeupdate` and
    // `progress` events during seeking carry an unreliable intermediate
    // `currentTime` that would snap the time-slider back to the old
    // position, so skip sync from those events while the store indicates an
    // active seek.
    const syncUnlessSeeking = () => {
      if (get().seeking) return;

      sync();
    };

    let cancel: (() => void) | undefined;

    const stop = () => {
      cancel?.();
      cancel = undefined;
    };

    const frame = () => {
      if (!isMediaPauseCapable(media) || media.paused || media.ended) {
        stop();
        return;
      }

      // Duration and seek state are event-driven. Avoid even allocating a store patch for a frozen clock.
      const state = get();
      const currentTime = media.currentTime;

      if (!state.seeking && currentTime !== state.currentTime) set({ currentTime });

      cancel = animationFrame(frame);
    };

    const start = () => {
      if (!cancel && isMediaPauseCapable(media) && !media.paused && !media.ended) cancel = animationFrame(frame);
    };

    const finish = () => {
      stop();
      syncUnlessSeeking();
    };

    sync();
    start();
    signal.addEventListener('abort', stop, { once: true });

    listen(media, 'play', start, { signal });
    listen(media, 'playing', start, { signal });

    listen(media, 'pause', finish, { signal });
    listen(media, 'ended', finish, { signal });
    listen(
      media,
      'timeupdate',
      () => {
        // Hidden tabs suspend rAF. Keep their state current, and retain event updates while paused.
        if (!cancel || document.hidden) syncUnlessSeeking();
      },
      { signal }
    );
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'seeking', sync, { signal });
    listen(media, 'seeked', sync, { signal });
    listen(media, 'loadedmetadata', sync, { signal });
    listen(
      media,
      'emptied',
      () => {
        stop();
        sync();
      },
      { signal }
    );
    // `progress` fires as the seekable range grows, so the live-edge duration
    // tracks the DVR window without requiring a separate durationchange event.
    listen(media, 'progress', syncUnlessSeeking, { signal });
  },
});
