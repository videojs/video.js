import { createStore, flush } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerExtensionCoordinator } from '../../../extensions/coordinator';
import { getGestureCoordinator } from '../../../gesture/coordinator';
import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { controlsFeature } from '../controls';

const IDLE_DELAY = 2000;

describe('controlsFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with userActive: true and controlsVisible: true', () => {
      const { store } = createPlayerStore();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('idle timeout', () => {
    it('sets inactive after idle delay when playing', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('sets userActive false but keeps controlsVisible true when paused', () => {
      const video = createMockVideo({ paused: true });
      const { store } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('activity detection', () => {
    it('resets idle timer on pointermove', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Advance partway through idle delay
      vi.advanceTimersByTime(IDLE_DELAY - 500);

      container!.dispatchEvent(new Event('pointermove'));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);

      // Advance past original delay — still active since timer was reset
      vi.advanceTimersByTime(500);
      flush();

      expect(store.state.userActive).toBe(true);

      // Now wait full delay from the pointermove
      vi.advanceTimersByTime(IDLE_DELAY - 500);
      flush();

      expect(store.state.userActive).toBe(false);
    });

    it('sets active on keyup', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);

      container!.dispatchEvent(new Event('keyup'));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('keeps controls active while keydown repeats', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      for (let index = 0; index < 3; index++) {
        vi.advanceTimersByTime(IDLE_DELAY - 500);
        container!.dispatchEvent(new Event('keydown'));
        flush();
      }

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('reactivates on pointermove after idle', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);

      container!.dispatchEvent(new Event('pointermove'));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('sets active on focusin', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);

      container!.dispatchEvent(new Event('focusin'));
      flush();

      expect(store.state.userActive).toBe(true);
    });

    it('sets inactive immediately on mouseleave', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('mouseleave'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('ignores mouseleave inside the container right after pointer capture ends, as Safari 16 sends', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.spyOn(container!, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));

      container!.dispatchEvent(new Event('lostpointercapture'));
      container!.dispatchEvent(new MouseEvent('mouseleave', { clientX: 200, clientY: 250 }));
      flush();

      expect(store.state.controlsVisible).toBe(true);

      container!.dispatchEvent(new Event('lostpointercapture'));
      container!.dispatchEvent(new MouseEvent('mouseleave', { clientX: 200, clientY: 320 }));
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('hides on a mouseleave inside the container without a recent pointer capture release', () => {
      // A pointer leaving the window can report its last position inside the player, such as in fullscreen.
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.spyOn(container!, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));

      container!.dispatchEvent(new MouseEvent('mouseleave', { clientX: 200, clientY: 250 }));
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('keeps controlsVisible true on mouseleave when paused', () => {
      const video = createMockVideo({ paused: true });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('mouseleave'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('touch tap-to-toggle', () => {
    it('hides controls on tap when visible and playing', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);

      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('hides controls on a tap on the media while the store sees it through the player facade', () => {
      const video = createMockVideo({ paused: false });
      const container = createContainer();
      const extensions = new PlayerExtensionCoordinator(() => {});

      container.append(video);
      extensions.register({ mediaOverride: null });

      const media = extensions.getStoreMedia(video);
      const store = createStore<PlayerTarget>()(controlsFeature);

      expect(media).not.toBe(video);

      store.attach({ media, container });
      flush();

      video.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch' }));
      vi.advanceTimersByTime(100);

      video.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('keeps controls visible on tap when paused', () => {
      const video = createMockVideo({ paused: true });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);

      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      // userActive goes false but controlsVisible stays true (paused)
      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('shows controls on tap when hidden', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // First tap to hide
      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Second tap to show
      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('does not toggle on long press', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(300);

      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('does not toggle for mouse clicks', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);

      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'mouse' }));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('touch pointermove while controls are hidden does not show controls', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Let controls auto-hide
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Touch pointermove should not flip controlsVisible
      container!.dispatchEvent(createPointerEvent('pointermove', { pointerType: 'touch' }));
      flush();

      expect(store.state.controlsVisible).toBe(false);
      expect(store.state.userActive).toBe(false);
    });

    it('touch pointermove while controls are visible keeps idle timer alive without re-patching state', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Advance partway through idle delay
      vi.advanceTimersByTime(IDLE_DELAY - 500);

      // Touch pointermove should keep the timer alive without forcing a state change
      container!.dispatchEvent(createPointerEvent('pointermove', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);

      // Advance past the original deadline — still active because timer was reset
      vi.advanceTimersByTime(500);
      flush();

      expect(store.state.userActive).toBe(true);

      // Wait the full idle delay from the pointermove — now it should go inactive
      vi.advanceTimersByTime(IDLE_DELAY - 500);
      flush();

      expect(store.state.userActive).toBe(false);
    });

    it('synthetic focusin fired between touch pointerdown and pointerup is ignored', () => {
      // Mirrors Android Chrome: the container's own pointerup listener calls
      // this.focus() before the controls feature's pointerup handler runs,
      // so focusin fires while lastTouchAt was only set by pointerdown.
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Touch pointerdown starts the tap window.
      container!.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch' }));
      vi.advanceTimersByTime(50);

      // focusin fires before our pointerup handler runs (synchronous focus grab).
      container!.dispatchEvent(new Event('focusin'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('synthetic focusin shortly after touch pointerup does not re-activate hidden controls', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Tap to hide controls (starts visible). This records lastTouchUpAt
      // and sets controlsVisible=false via the inline tap-toggle.
      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);

      // Synthetic focusin within 500 ms of touch pointerup (from the container's
      // own focus() call) should be ignored.
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(new Event('focusin'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('focusin after a touch tap window has elapsed still activates controls', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Tap to hide
      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // After the 500 ms guard expires, focusin should still re-activate
      // (e.g., keyboard navigation focusing the container).
      vi.advanceTimersByTime(600);
      container!.dispatchEvent(new Event('focusin'));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('synthetic mouseleave shortly after touch pointerup does not call setInactive', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      // Let controls auto-hide first
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Tap shows controls (controlsVisible=false → setActive path)
      container!.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.controlsVisible).toBe(true);

      // Synthetic mouseleave within 500 ms of touchend should be ignored
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(new Event('mouseleave'));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('touch tap on interactive controls', () => {
    it('resets the idle timer when tapping a control button while a toggleControls gesture is registered', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      addToggleControlsGesture(container!);

      // A real control button (e.g. mute, seek ±10s) inside the player.
      const button = document.createElement('button');

      container!.appendChild(button);

      // Advance partway through the idle delay.
      vi.advanceTimersByTime(IDLE_DELAY - 500);

      // Quick touch tap on the button.
      button.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch' }));
      vi.advanceTimersByTime(100);
      button.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);

      // Advance past the original deadline — still active because the tap reset the
      // timer. Without the fix a control tap wouldn't count as activity and the
      // controls would hide here.
      vi.advanceTimersByTime(500);
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('does not reset the idle timer when tapping the video area (gesture owns the toggle)', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      addToggleControlsGesture(container!);

      vi.advanceTimersByTime(IDLE_DELAY - 500);

      // Quick touch tap on the bare container (non-interactive). The gesture
      // coordinator handles the toggle here — controls.ts must not reset.
      container!.dispatchEvent(createPointerEvent('pointerdown', { pointerType: 'touch' }));
      vi.advanceTimersByTime(100);
      container!.dispatchEvent(createPointerEvent('pointerup', { pointerType: 'touch' }));
      flush();

      vi.advanceTimersByTime(500);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });
  });

  describe('playback state interaction', () => {
    it('shows controls when media pauses', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Pause media
      Object.defineProperty(video, 'paused', { value: true, configurable: true });
      video.dispatchEvent(new Event('pause'));
      flush();

      expect(store.state.controlsVisible).toBe(true);
    });

    it('hides controls when media resumes and user is inactive', () => {
      const video = createMockVideo({ paused: true });
      const { store } = createPlayerStore(video);

      // Let idle expire — user inactive, but visible because paused
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);

      // Resume playback while user is still inactive
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      video.dispatchEvent(new Event('play'));
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('schedules idle when playback resumes and user is active', () => {
      const video = createMockVideo({ paused: true });
      const { store, container } = createPlayerStore(video);

      // Trigger activity to keep user active
      container!.dispatchEvent(new Event('pointermove'));
      flush();

      vi.advanceTimersByTime(IDLE_DELAY - 500);

      // Resume playback
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      video.dispatchEvent(new Event('play'));
      flush();

      expect(store.state.controlsVisible).toBe(true);

      // Playback must restart the deadline established by pointer activity.
      vi.advanceTimersByTime(500);
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);

      vi.advanceTimersByTime(IDLE_DELAY - 500);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });
  });

  describe('controls visibility locks', () => {
    it('keeps actions stable across attachment', () => {
      const video = createMockVideo({ paused: false });
      const store = createStore<PlayerTarget>()(controlsFeature);
      const requestControlsLock = store.state.requestControlsLock;
      const toggleControls = store.state.toggleControls;
      const target = { media: video, container: createContainer() };

      const detach = store.attach(target);

      flush();

      expect(store.state.requestControlsLock).toBe(requestControlsLock);
      expect(store.state.toggleControls).toBe(toggleControls);

      detach();
      flush();

      expect(store.state.requestControlsLock).toBe(requestControlsLock);
      expect(store.state.toggleControls).toBe(toggleControls);

      store.attach(target);
      flush();

      expect(store.state.requestControlsLock).toBe(requestControlsLock);
      expect(store.state.toggleControls).toBe(toggleControls);
    });

    it('keeps a pre-attach lock active across reattachment', () => {
      const video = createMockVideo({ paused: false });
      const store = createStore<PlayerTarget>()(controlsFeature);
      const target = { media: video, container: createContainer() };
      const release = store.state.requestControlsLock();

      const detach = store.attach(target);

      flush();

      vi.advanceTimersByTime(IDLE_DELAY * 2);
      flush();
      expect(store.state.controlsVisible).toBe(true);

      detach();
      flush();
      store.attach(target);
      flush();

      vi.advanceTimersByTime(IDLE_DELAY * 2);
      flush();
      expect(store.state.controlsVisible).toBe(true);

      release();
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('shows hidden controls and suspends the idle timeout while locked', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();
      expect(store.state.controlsVisible).toBe(false);

      const release = store.state.requestControlsLock();

      flush();

      expect(store.state.controlsVisible).toBe(true);

      vi.advanceTimersByTime(IDLE_DELAY * 2);
      flush();

      expect(store.state.controlsVisible).toBe(true);

      release();
      flush();

      vi.advanceTimersByTime(IDLE_DELAY - 1);
      flush();
      expect(store.state.controlsVisible).toBe(true);

      vi.advanceTimersByTime(1);
      flush();
      expect(store.state.controlsVisible).toBe(false);
    });

    it('keeps controls visible when activity is explicitly cleared while locked', () => {
      const video = createMockVideo({ paused: false });
      const { store, container } = createPlayerStore(video);
      const release = store.state.requestControlsLock();

      container!.dispatchEvent(new Event('mouseleave'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);

      release();
    });

    it('waits for every lock to release and treats releases as idempotent', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);
      const releaseFirst = store.state.requestControlsLock();
      const releaseSecond = store.state.requestControlsLock();

      releaseFirst();
      releaseFirst();
      vi.advanceTimersByTime(IDLE_DELAY * 2);
      flush();

      expect(store.state.controlsVisible).toBe(true);

      releaseSecond();
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });
  });

  describe('toggleControls', () => {
    it('hides controls when visible and playing', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      const result = store.state.toggleControls();

      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
      expect(result).toBe(false);
    });

    it('shows controls when hidden', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      // First toggle to hide
      store.state.toggleControls();
      flush();

      expect(store.state.controlsVisible).toBe(false);

      // Second toggle to show
      const result = store.state.toggleControls();

      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
      expect(result).toBe(true);
    });

    it('reschedules idle timer when showing controls', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      // Hide controls
      store.state.toggleControls();
      flush();

      // Show controls
      store.state.toggleControls();
      flush();

      expect(store.state.controlsVisible).toBe(true);

      // Should hide again after idle delay
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('keeps controlsVisible true when toggling off while paused', () => {
      const video = createMockVideo({ paused: true });
      const { store } = createPlayerStore(video);

      const result = store.state.toggleControls();

      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
      expect(result).toBe(true);
    });

    it('hides controls when forced off', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      expect(store.state.toggleControls(false)).toBe(false);
      expect(store.state.toggleControls(false)).toBe(false);
    });

    it('restarts the idle timer when forced on, even if already visible', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video);

      vi.advanceTimersByTime(IDLE_DELAY - 500);

      expect(store.state.toggleControls(true)).toBe(true);

      vi.advanceTimersByTime(500);
      flush();
      expect(store.state.controlsVisible).toBe(true);

      vi.advanceTimersByTime(IDLE_DELAY - 500);
      flush();
      expect(store.state.controlsVisible).toBe(false);
    });

    it('applies force before attach', () => {
      const store = createStore<PlayerTarget>()(controlsFeature);

      expect(store.state.toggleControls(false)).toBe(false);
      expect(store.state.toggleControls(false)).toBe(false);
      expect(store.state.toggleControls(true)).toBe(true);
    });
  });

  describe('cast interaction', () => {
    it('keeps controlsVisible true when casting and user goes inactive', () => {
      const { video, remote } = createGoogleCastVideo({ paused: false });
      const { store } = createPlayerStore(video);

      remote.state = 'connected';
      remote.dispatchEvent(new Event('connect'));
      flush();

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('hides controls after cast disconnects and user is inactive', () => {
      const { video, remote } = createGoogleCastVideo({ paused: false });
      const { store } = createPlayerStore(video);

      remote.state = 'connected';
      remote.dispatchEvent(new Event('connect'));
      flush();

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(true);

      remote.state = 'disconnected';
      remote.dispatchEvent(new Event('disconnect'));
      flush();

      expect(store.state.controlsVisible).toBe(false);
    });

    it('keeps controlsVisible true on mouseleave while casting', () => {
      const { video, remote } = createGoogleCastVideo({ paused: false });
      const { store, container } = createPlayerStore(video);

      remote.state = 'connected';
      remote.dispatchEvent(new Event('connect'));
      flush();

      container!.dispatchEvent(new Event('mouseleave'));
      flush();

      expect(store.state.userActive).toBe(false);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('null container', () => {
    it('does not track activity without container', () => {
      const video = createMockVideo({ paused: false });
      const { store } = createPlayerStore(video, null);

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('clears idle timer on detach', () => {
      const video = createMockVideo({ paused: false });
      const store = createStore<PlayerTarget>()(controlsFeature);

      const container = createContainer();
      const detach = store.attach({ media: video, container });

      flush();

      detach();
      flush();

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });

    it('does not react to media events after detach', () => {
      const video = createMockVideo({ paused: false });
      const store = createStore<PlayerTarget>()(controlsFeature);

      const container = createContainer();
      const detach = store.attach({ media: video, container });

      flush();

      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      expect(store.state.controlsVisible).toBe(false);

      detach();
      flush();

      // A leaked play listener would schedule a new idle timer after the reset.
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      video.dispatchEvent(new Event('play'));
      vi.advanceTimersByTime(IDLE_DELAY);
      flush();

      // State was reset to initial on detach
      expect(store.state.userActive).toBe(true);
      expect(store.state.controlsVisible).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createContainer(): HTMLElement {
  return document.createElement('div');
}

function createPointerEvent(type: string, init?: { pointerType?: string }): Event {
  const event = new Event(type, { bubbles: true });

  (event as unknown as Record<string, unknown>).pointerType = init?.pointerType ?? '';
  return event;
}

function addToggleControlsGesture(container: HTMLElement): () => void {
  return getGestureCoordinator(container).add({
    type: 'tap',
    action: 'toggleControls',
    pointer: 'touch',
    recognizer: { handleUp() {}, reset() {} },
    onActivate() {},
  });
}

function createMockRemote(): EventTarget & { state: string; prompt: () => Promise<void> } {
  const target = new EventTarget() as EventTarget & { state: string; prompt: () => Promise<void> };

  target.state = 'disconnected';
  target.prompt = () => Promise.resolve();
  return target;
}

function createGoogleCastVideo(overrides: Parameters<typeof createMockVideo>[0] = {}) {
  const video = createMockVideo(overrides);
  const remote = createMockRemote();

  Object.defineProperty(video, 'remote', { value: remote, configurable: true });
  return { video, remote };
}

function createPlayerStore(video?: HTMLVideoElement, container?: HTMLElement | null) {
  const store = createStore<PlayerTarget>()(controlsFeature);

  const media = video ?? createMockVideo({ paused: true });
  const cont = container === undefined ? createContainer() : container;

  store.attach({ media, container: cont });
  flush();

  return { store, media, container: cont };
}
