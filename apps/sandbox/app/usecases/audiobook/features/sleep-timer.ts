import { definePlayerFeature } from '@videojs/core/dom';
import { isMediaPauseCapable, isMediaSeekCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

/** A timer that pauses playback at a wall-clock moment or at a point in the media. */
export type SleepTimer =
  | { readonly mode: 'off' }
  | { readonly mode: 'clock'; readonly endsAt: number }
  | { readonly mode: 'position'; readonly until: number };

/** Minutes from now, a media time to stop at, or `null` to cancel. */
export type SleepTimerRequest = { minutes: number } | { until: number } | null;

export interface SleepTimerState {
  sleepTimer: SleepTimer;
  /** Whole seconds until the timer fires, 0 while it is off. Wall-clock for a clock timer, media time for a position. */
  sleepRemaining: number;
  setSleepTimer(request: SleepTimerRequest): void;
}

const OFF: SleepTimer = { mode: 'off' };
const TICK_INTERVAL = 1000;

/**
 * Pauses the media when the time comes. A clock timer counts real minutes; a position timer waits for the media to
 * reach a point, so "end of this chapter" is `{ until: chapter.endTime }` and the rate does not matter. Seeking past a
 * position cancels it: the listener moved on.
 */
export const sleepTimerFeature = definePlayerFeature({
  name: 'sleepTimer',
  state: ({ target, set }): SleepTimerState => ({
    sleepTimer: OFF,
    sleepRemaining: 0,
    setSleepTimer(request) {
      if (request === null) {
        set({ sleepTimer: OFF, sleepRemaining: 0 });
      } else if ('minutes' in request) {
        const ms = Math.max(0, request.minutes) * 60_000;

        set({ sleepTimer: { mode: 'clock', endsAt: Date.now() + ms }, sleepRemaining: Math.ceil(ms / 1000) });
      } else {
        const { media } = target();
        const now = isMediaSeekCapable(media) ? media.currentTime : 0;

        set({
          sleepTimer: { mode: 'position', until: request.until },
          sleepRemaining: Math.max(0, Math.ceil(request.until - now)),
        });
      }
    },
  }),

  attach({ target, signal, set, get }) {
    const { media } = target;
    if (!isMediaPauseCapable(media) || !isMediaSeekCapable(media)) return;

    const tick = () => {
      const timer = get().sleepTimer;
      if (timer.mode === 'off') return;

      // A seek in flight reports its destination before `seeked` decides whether it cancelled the timer.
      if (timer.mode === 'position' && media.seeking) return;

      const remaining = timer.mode === 'clock' ? (timer.endsAt - Date.now()) / 1000 : timer.until - media.currentTime;

      if (remaining <= 0) {
        if (!media.paused) media.pause();

        set({ sleepTimer: OFF, sleepRemaining: 0 });
        return;
      }

      const whole = Math.ceil(remaining);

      if (whole !== get().sleepRemaining) set({ sleepRemaining: whole });
    };

    const onSeeked = () => {
      const timer = get().sleepTimer;

      if (timer.mode === 'position' && media.currentTime > timer.until) set({ sleepTimer: OFF, sleepRemaining: 0 });
      else tick();
    };

    const interval = setInterval(tick, TICK_INTERVAL);

    tick();

    listen(media, 'timeupdate', tick, { signal });
    listen(media, 'seeked', onSeeked, { signal });
    listen(media, 'ended', () => set({ sleepTimer: OFF, sleepRemaining: 0 }), { signal });

    signal.addEventListener('abort', () => clearInterval(interval), { once: true });
  },
});
