import { createState } from '@videojs/store';
import { animationFrame } from '@videojs/utils/dom';
import { shallowEqual } from '@videojs/utils/object';

import type { TimeSliderProgressState } from '../../../core/ui/time-slider/core';

export type { TimeSliderProgressState } from '../../../core/ui/time-slider/core';

/**
 * A visual playback clock. Keep frame updates local to the slider rather than publishing estimated media time. The
 * presentation layer can supply a transition property to wait for after seeking.
 *
 * @internal
 */
export function createTimeSliderProgress(transition?: string) {
  const state = createState<{ currentTime: number | undefined; advancing: boolean }>({
    currentTime: undefined,
    advancing: false,
  });
  let media: TimeSliderProgressState | null = null;
  let cancel: (() => void) | undefined;
  let readTime: (() => number | undefined) | undefined;
  let element: HTMLElement | null = null;
  let pending = false;
  let interpolate = true;
  let time = 0;
  let since = 0;

  function frame(now: number) {
    if (pending) {
      const transitioning = element
        ?.getAnimations?.()
        .some(
          (animation) =>
            'transitionProperty' in animation &&
            animation.transitionProperty === transition &&
            animation.playState !== 'finished'
        );

      if (media?.seeking || transitioning) {
        cancel = animationFrame(frame);
        return;
      }

      pending = false;
      time = readTime?.() ?? media?.currentTime ?? time;
      since = now;
    }

    if (!media?.playing) {
      state.patch({ currentTime: time, advancing: false });
      return;
    }

    const actual = readTime?.() ?? media.currentTime;
    const forward = actual >= time;

    // Native media is already a frame clock; only cached embed time needs interpolation.
    if (actual !== time) {
      time = actual;
      since = now;
    }

    let currentTime = time + (interpolate ? ((now - since) / 1000) * media.playbackRate : 0);

    // A sampled media clock can advance more slowly just after a seek. Wait for it to catch up instead of reversing.
    if (forward && state.current.advancing) currentTime = Math.max(currentTime, state.current.currentTime ?? 0);

    state.patch({ currentTime: Math.max(0, Math.min(currentTime, media.duration || Infinity)), advancing: true });
    cancel = animationFrame(frame);
  }

  function seek(currentTime: number) {
    cancel?.();
    pending = true;
    time = currentTime;
    state.patch({ currentTime, advancing: false });
    cancel = animationFrame(frame);
  }

  function destroy() {
    cancel?.();
    cancel = undefined;
    media = null;
    readTime = undefined;
    element = null;
    pending = false;
  }

  return {
    state,
    seek,
    update(
      next: TimeSliderProgressState,
      getCurrentTime?: () => number | undefined,
      el: HTMLElement | null = null,
      interpolateTime = true
    ) {
      readTime = getCurrentTime;
      element = el;
      interpolate = interpolateTime;

      if (media && shallowEqual(media, next)) return;

      const previous = media;

      media = next;

      if (next.seeking && !previous?.seeking && !pending) seek(readTime?.() ?? next.currentTime);

      if (pending) return;

      // Store timeupdate snapshots can lag the frame clock. Continuous playback reads the media directly instead.
      if (previous?.playing && next.playing && previous.playbackRate === next.playbackRate) return;

      cancel?.();
      time = readTime?.() ?? next.currentTime;
      since = performance.now();
      state.patch({ currentTime: time, advancing: false });

      if (next.playing) cancel = animationFrame(frame);
    },
    destroy,
  };
}
