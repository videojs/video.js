import { createStore, flush } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { NativeMedia } from '../../../media/native-capability';
import type { NativePlayerTarget } from '../../native-player-target';
import { nativeControlsFeature } from '../controls';

const IDLE_DELAY = 2000;

class MockMedia {
  paused: boolean;
  #listeners = new Map<string, Set<() => void>>();

  constructor(paused: boolean) {
    this.paused = paused;
  }

  addEventListener(type: string, listener: () => void) {
    if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());

    this.#listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: () => void) {
    this.#listeners.get(type)?.delete(listener);
  }

  setPaused(paused: boolean, type = paused ? 'pause' : 'play') {
    this.paused = paused;

    for (const listener of this.#listeners.get(type) ?? []) listener();
  }
}

// SAFETY: the feature only reads `paused` and adds or removes listeners, which the mock provides.
const asNativeMedia = (media: MockMedia) => media as unknown as NativeMedia;

function createPlayerStore({ paused = false, attach = true } = {}) {
  const media = new MockMedia(paused);
  const store = createStore<NativePlayerTarget>()(nativeControlsFeature);
  const detach = attach ? store.attach({ media: asNativeMedia(media), container: null }) : () => {};

  return { store, media, detach };
}

function idle(ms = IDLE_DELAY) {
  vi.advanceTimersByTime(ms);
  flush();
}

describe('nativeControlsFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts visible and active', () => {
    const { store } = createPlayerStore();

    expect(store.state.userActive).toBe(true);
    expect(store.state.controlsVisible).toBe(true);
  });

  it('hides after the idle delay while playing', () => {
    const { store } = createPlayerStore();

    idle(IDLE_DELAY - 1);
    expect(store.state.controlsVisible).toBe(true);

    idle(1);
    expect(store.state.userActive).toBe(false);
    expect(store.state.controlsVisible).toBe(false);
  });

  it('keeps controls visible while paused', () => {
    const { store } = createPlayerStore({ paused: true });

    idle();

    expect(store.state.userActive).toBe(false);
    expect(store.state.controlsVisible).toBe(true);
  });

  it('hides once playback starts if the user went idle while paused', () => {
    const { store, media } = createPlayerStore({ paused: true });

    idle();
    media.setPaused(false);
    flush();

    expect(store.state.controlsVisible).toBe(false);
  });

  it('starts counting down when an active user starts playback', () => {
    const { store, media } = createPlayerStore({ paused: true });

    idle(IDLE_DELAY - 500);
    store.state.toggleControls(true);
    idle(IDLE_DELAY - 500);
    media.setPaused(false);
    idle(IDLE_DELAY - 1);
    expect(store.state.controlsVisible).toBe(true);

    idle(1);
    expect(store.state.controlsVisible).toBe(false);
  });

  it('shows controls when playback pauses or ends', () => {
    const { store, media } = createPlayerStore();

    idle();
    media.setPaused(true, 'ended');
    flush();

    expect(store.state.controlsVisible).toBe(true);
  });

  describe('toggleControls', () => {
    it('toggles visibility and returns the new value', () => {
      const { store } = createPlayerStore();

      expect(store.state.toggleControls()).toBe(false);
      flush();
      expect(store.state.controlsVisible).toBe(false);

      expect(store.state.toggleControls()).toBe(true);
      flush();
      expect(store.state.controlsVisible).toBe(true);
    });

    it('restarts the idle timer when forced to show', () => {
      const { store } = createPlayerStore();

      idle(IDLE_DELAY - 500);
      store.state.toggleControls(true);
      idle(IDLE_DELAY - 1);

      expect(store.state.controlsVisible).toBe(true);
    });

    it('cannot hide controls over paused media', () => {
      const { store } = createPlayerStore({ paused: true });

      expect(store.state.toggleControls()).toBe(true);
      flush();
      expect(store.state.userActive).toBe(false);
    });
  });

  describe('requestControlsLock', () => {
    it('keeps controls visible until released, then gives a full idle window', () => {
      const { store } = createPlayerStore();
      const release = store.state.requestControlsLock();

      idle(IDLE_DELAY * 3);
      expect(store.state.controlsVisible).toBe(true);

      release();
      idle(IDLE_DELAY - 1);
      expect(store.state.controlsVisible).toBe(true);

      idle(1);
      expect(store.state.controlsVisible).toBe(false);
    });

    it('shows hidden controls', () => {
      const { store } = createPlayerStore();

      idle();
      store.state.requestControlsLock();
      flush();

      expect(store.state.controlsVisible).toBe(true);
    });

    it('waits for every lock, and ignores repeated releases', () => {
      const { store } = createPlayerStore();
      const releaseA = store.state.requestControlsLock();
      const releaseB = store.state.requestControlsLock();

      releaseA();
      releaseA();
      idle(IDLE_DELAY * 2);
      expect(store.state.controlsVisible).toBe(true);

      releaseB();
      idle();
      expect(store.state.controlsVisible).toBe(false);
    });

    it('holds a lock taken before attach', () => {
      const { store, media } = createPlayerStore({ attach: false });

      store.state.requestControlsLock();
      store.attach({ media: asNativeMedia(media), container: null });
      idle(IDLE_DELAY * 2);

      expect(store.state.controlsVisible).toBe(true);
    });
  });

  describe('detach', () => {
    it('stops the idle timer and media listeners', () => {
      const { store, media, detach } = createPlayerStore({ paused: true });

      detach();
      idle();
      expect(store.state.userActive).toBe(true);

      store.state.toggleControls(false);
      media.setPaused(false);
      flush();
      expect(store.state.controlsVisible).toBe(false);

      store.state.toggleControls(true);
      idle(IDLE_DELAY * 2);
      expect(store.state.controlsVisible).toBe(true);
    });
  });
});
