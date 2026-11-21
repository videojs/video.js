import type { MediaControlsState } from '@videojs/media';
import { listen } from '@videojs/utils/events';
import { isNull } from '@videojs/utils/predicate';

import type { NativeMedia } from '../../media/native-capability';
import { defineNativePlayerFeature } from '../feature';

/** Matches the web feature's idle delay. */
const IDLE_DELAY = 2000;

/** The idle machinery `attach` drives, keyed by the store's `toggleControls` so `attach` can find its own. */
interface ControlsController {
  attach(media: NativeMedia): void;
  detach(): void;
  recompute(): void;
}

const controllers = new WeakMap<MediaControlsState['toggleControls'], ControlsController>();

/**
 * Controls visibility for react-native: the same `MediaControlsState` as the web `controlsFeature`, without a
 * container.
 *
 * The web feature finds activity itself by listening to the container's pointer, keyboard, and focus events. A
 * react-native `<View>` has no such events to listen to from outside, so the UI reports activity through the public
 * actions instead: `toggleControls(true)` for a touch on the controls, `toggleControls()` for a tap on the backdrop,
 * and `requestControlsLock()` for a sustained interaction such as a slider drag. See `Controls`.
 *
 * Controls stay visible while paused or locked; otherwise they hide after two seconds without activity.
 *
 * @internal
 */
export const nativeControlsFeature = defineNativePlayerFeature({
  name: 'controls',
  state: ({ get, set }): MediaControlsState => {
    let media: NativeMedia | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let lockCount = 0;

    // Lock tokens live here rather than in `attach`, so a lock taken before attach, or held across a reattach, still
    // counts.
    const computeVisible = (userActive: boolean) => lockCount > 0 || userActive || (!isNull(media) && media.paused);

    function clearIdle() {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }

    // Without media there is no playback to hide the controls over, so nothing schedules.
    function scheduleIdle() {
      clearIdle();

      if (lockCount > 0 || isNull(media)) return;

      idleTimer = setTimeout(setInactive, IDLE_DELAY);
    }

    function setActive() {
      if (!get().userActive || !get().controlsVisible) set({ userActive: true, controlsVisible: true });

      scheduleIdle();
    }

    function setInactive() {
      clearIdle();
      set({ userActive: false, controlsVisible: computeVisible(false) });
    }

    function requestControlsLock(): () => void {
      let released = false;

      lockCount++;
      clearIdle();

      if (!get().controlsVisible) set({ controlsVisible: true });

      return () => {
        if (released) return;

        released = true;
        lockCount--;

        // Give the user a full activity window after the interaction ends.
        if (lockCount === 0) setActive();
      };
    }

    function toggleControls(forceShow?: boolean): boolean {
      if (forceShow ?? !get().controlsVisible) setActive();
      else setInactive();

      // SAFETY: `get` reads the state this factory returns; it is untyped only because the slice infers its type from
      // that return.
      return get().controlsVisible as boolean;
    }

    controllers.set(toggleControls, {
      attach(next) {
        media = next;
        // Always start the timer. Paused media keeps the controls up anyway; only `userActive` falls.
        scheduleIdle();
      },
      detach() {
        media = null;
        clearIdle();
      },
      recompute() {
        // SAFETY: as in `toggleControls`, `get` reads this factory's own `MediaControlsState`.
        const userActive = get().userActive as boolean;

        set({ controlsVisible: computeVisible(userActive) });

        // Playback starting is when an active user's controls begin counting down.
        if (userActive && !isNull(media) && !media.paused) scheduleIdle();
      },
    });

    return {
      userActive: true,
      controlsVisible: true,
      requestControlsLock,
      toggleControls,
    };
  },

  attach({ target, signal, get }) {
    const { media } = target;
    const controller = controllers.get(get().toggleControls)!;

    controller.attach(media);

    listen(media, 'play', controller.recompute, { signal });
    listen(media, 'pause', controller.recompute, { signal });
    listen(media, 'ended', controller.recompute, { signal });

    signal.addEventListener('abort', controller.detach, { once: true });
  },
});
