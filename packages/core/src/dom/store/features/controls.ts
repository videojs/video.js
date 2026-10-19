import type { MediaControlsState } from '@videojs/media';
import { isMediaPauseCapable, isMediaRemotePlaybackCapable, getRegisteredMedia } from '@videojs/media';
import { isPointInElement, listen } from '@videojs/utils/dom';
import { isNull } from '@videojs/utils/predicate';

import { definePlayerFeature } from '../../feature';
import { findGestureCoordinator } from '../../gesture/coordinator';
import { isRemotePlaybackConnected, isRemotePlaybackConnecting } from '../../presentation/remote-playback';

const IDLE_DELAY = 2000;
const TAP_THRESHOLD = 250;
const TOUCH_SETTLE_DELAY = 500;
/** How long after a control releases pointer capture a `mouseleave` inside the container is treated as spurious. */
const CAPTURE_RELEASE_DELAY = 100;

type RequestControlsLock = MediaControlsState['requestControlsLock'];
type ToggleControls = MediaControlsState['toggleControls'];

interface ControlsActions {
  requestControlsLock: RequestControlsLock;
  toggleControls: ToggleControls;
  setDelegates(requestControlsLock: RequestControlsLock, toggleControls: ToggleControls): void;
  reset(): void;
}

const controlsActionsByRequest = new WeakMap<RequestControlsLock, ControlsActions>();

export const controlsFeature = definePlayerFeature({
  name: 'controls',
  state: ({ get, set }): MediaControlsState => {
    const fallbackRequestControlsLock = () => {
      // Fallback before attach — show controls, but there is no idle timer to suspend.
      set({ controlsVisible: true });
      return () => {};
    };
    const fallbackToggleControls = (forceShow?: boolean) => {
      // Fallback before attach — no idle timer, just flip state.
      const next = forceShow ?? !get().userActive;

      set({ userActive: next, controlsVisible: next });
      return next as boolean;
    };
    const actions = createControlsActions(fallbackRequestControlsLock, fallbackToggleControls);

    controlsActionsByRequest.set(actions.requestControlsLock, actions);

    return {
      userActive: true,
      controlsVisible: true,
      requestControlsLock: actions.requestControlsLock,
      toggleControls: actions.toggleControls,
    };
  },

  attach({ target, signal, get, set }) {
    const { media, container } = target;

    if (!isMediaPauseCapable(media) || isNull(container)) {
      if (__DEV__ && isNull(container)) {
        console.warn('[vjs] controlsFeature requires a container element for activity tracking.');
      }

      return;
    }

    // Idle timer
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let controlsLockCount = 0;

    const computeVisible = (userActive: boolean): boolean => {
      return (
        controlsLockCount > 0 ||
        userActive ||
        media.paused ||
        isRemotePlaybackConnected(media) ||
        isRemotePlaybackConnecting(media)
      );
    };

    function clearIdle() {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }

    function scheduleIdle() {
      clearIdle();

      if (controlsLockCount > 0) return;

      idleTimer = setTimeout(setInactive, IDLE_DELAY);
    }

    function setActive() {
      if (!get().userActive) {
        set({ userActive: true, controlsVisible: true });
      }

      scheduleIdle();
    }

    function setInactive() {
      clearIdle();
      set({ userActive: false, controlsVisible: computeVisible(false) });
    }

    function requestControlsLock(): () => void {
      controlsLockCount++;
      clearIdle();

      if (!get().controlsVisible) {
        set({ controlsVisible: true });
      }

      let released = false;

      return () => {
        if (released || signal.aborted) return;

        released = true;
        controlsLockCount--;

        if (controlsLockCount === 0) {
          // Give the user a full activity window after the interaction ends.
          setActive();
        }
      };
    }

    function toggleControls(forceShow?: boolean): boolean {
      if (forceShow ?? !get().controlsVisible) {
        setActive();
      } else {
        setInactive();
      }

      return get().controlsVisible;
    }

    const actions = controlsActionsByRequest.get(get().requestControlsLock)!;

    actions.setDelegates(requestControlsLock, toggleControls);

    // Touch tap-to-toggle.
    //
    // When the skin registers `tap action="toggleControls"` alongside
    // `doubletap` gestures, the tap recognizer defers its callback by 200 ms
    // (doubletap window) and re-reads live state at fire time. Any synthetic
    // event that flips visibility during that window inverts the toggle —
    // Android first-tap flash. The guards below short-circuit such events
    // inside a touch interaction.
    //
    // `lastTouchAt` is recorded on pointerdown as well as pointerup: the
    // container's own pointerup listener calls this.focus() synchronously
    // before ours runs, firing focusin while lastTouchAt would otherwise
    // still be 0.
    let pointerDownTime = 0;
    let lastTouchAt = 0;

    const isRecentTouch = () => lastTouchAt > 0 && Date.now() - lastTouchAt < TOUCH_SETTLE_DELAY;

    let lastCaptureReleaseAt = 0;
    const isRecentCaptureRelease = () =>
      lastCaptureReleaseAt > 0 && Date.now() - lastCaptureReleaseAt < CAPTURE_RELEASE_DELAY;

    function onPointerDown(event: PointerEvent) {
      pointerDownTime = Date.now();

      if (event.pointerType === 'touch') {
        lastTouchAt = pointerDownTime;
      }
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerType === 'touch') {
        lastTouchAt = Date.now();
      }

      if (event.pointerType === 'touch' && Date.now() - pointerDownTime < TAP_THRESHOLD) {
        // A claimed tap belongs to the gesture layer, which owns the toggle — nothing
        // to do here. An unclaimed tap (e.g. on a control button the coordinator
        // ignores) falls through and resets the idle timer below; without that,
        // repeatedly tapping a control lets the controls auto-hide mid-interaction.
        const coordinator = findGestureCoordinator(container as HTMLElement);
        if (coordinator?.claimsTap(event, 'toggleControls')) return;

        // Inline touch tap-to-toggle for standalone use (no gestures). `media` may be the player's facade, which is
        // never the event target.
        const isMediaOrContainer = [getRegisteredMedia(media), container].includes(event.target as HTMLElement);

        if (get().controlsVisible && isMediaOrContainer) {
          setInactive();
        } else {
          setActive();
        }
      } else {
        setActive();
      }
    }

    // Recompute visibility when playback state changes.
    const onPlaybackChange = () => {
      const { userActive } = get();

      set({ controlsVisible: computeVisible(userActive) });

      // When playback starts, schedule idle if user is active.
      if (!media.paused && userActive) {
        scheduleIdle();
      }
    };

    function onPointerMove(event: PointerEvent): void {
      // On touch, don't flip visibility mid-gesture — just keep the idle timer alive.
      if (event.pointerType === 'touch') {
        if (get().userActive) scheduleIdle();

        return;
      }

      setActive();
    }

    // Container event listeners
    listen(container, 'pointermove', onPointerMove, { signal });
    listen(container, 'pointerdown', onPointerDown, { signal });
    listen(container, 'pointerup', onPointerUp, { signal });
    listen(
      container,
      'lostpointercapture',
      () => {
        lastCaptureReleaseAt = Date.now();
      },
      { signal }
    );
    listen(container, 'keydown', setActive, { signal });
    listen(container, 'keyup', setActive, { signal });
    listen(
      container,
      'focusin',
      () => {
        // Ignore focusin from the container's own pointerup focus grab.
        if (isRecentTouch()) return;

        setActive();
      },
      { signal }
    );
    // On touch devices pointerleave would fire after a pointerup event which hides the controls.
    // https://w3c.github.io/pointerevents/#dfn-pointerup
    listen(
      container,
      'mouseleave',
      (event: Event) => {
        // Ignore synthetic mouseleave that Android Chrome dispatches after touchend.
        if (isRecentTouch()) return;

        // Safari 16 dispatches mouseleave right after a control releases pointer capture, such as after a click on the
        // time slider, with the pointer still inside. Only that case is ignored: a pointer leaving the window can also
        // report a last position inside the container.
        if (isRecentCaptureRelease() && event instanceof MouseEvent && isPointInElement(container, event)) return;

        setInactive();
      },
      { signal }
    );

    // Media event listeners for playback state changes.
    listen(media, 'play', onPlaybackChange, { signal });
    listen(media, 'pause', onPlaybackChange, { signal });
    listen(media, 'ended', onPlaybackChange, { signal });

    // Recompute visibility when cast state changes.
    if (isMediaRemotePlaybackCapable(media)) {
      const onCastChange = () => {
        const { userActive } = get();

        set({ controlsVisible: computeVisible(userActive) });
      };

      listen(media.remote, 'connect', onCastChange, { signal });
      listen(media.remote, 'connecting', onCastChange, { signal });
      listen(media.remote, 'disconnect', onCastChange, { signal });
    }

    // Restore fallback behavior on detach. Active lock tokens transfer to the
    // fallback and will transfer again if the store is reattached.
    signal.addEventListener(
      'abort',
      () => {
        actions.reset();
        controlsLockCount = 0;
        clearIdle();
      },
      { once: true }
    );

    // Always schedule idle initially. When paused, userActive will go false
    // but controlsVisible stays true (because paused keeps controls visible).
    scheduleIdle();
  },
});

function createControlsActions(
  fallbackRequestControlsLock: RequestControlsLock,
  fallbackToggleControls: ToggleControls
): ControlsActions {
  let requestControlsLockDelegate = fallbackRequestControlsLock;
  let toggleControlsDelegate = fallbackToggleControls;
  const locks = new Set<{ release: () => void }>();

  const requestControlsLock = () => {
    const lock = { release: requestControlsLockDelegate() };
    let released = false;

    locks.add(lock);

    return () => {
      if (released) return;

      released = true;
      locks.delete(lock);
      lock.release();
    };
  };

  const toggleControls = (forceShow?: boolean) => toggleControlsDelegate(forceShow);

  const actions: ControlsActions = {
    requestControlsLock,
    toggleControls,
    setDelegates(nextRequestControlsLock, nextToggleControls) {
      if (nextRequestControlsLock !== requestControlsLockDelegate) {
        requestControlsLockDelegate = nextRequestControlsLock;

        for (const lock of locks) {
          lock.release();
          lock.release = nextRequestControlsLock();
        }
      }

      toggleControlsDelegate = nextToggleControls;
    },
    reset() {
      actions.setDelegates(fallbackRequestControlsLock, fallbackToggleControls);
    },
  };

  return actions;
}
