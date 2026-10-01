import { combine, createStore, defineSlice } from '@videojs/store';
import type { WebKitVideoElement } from '@videojs/utils/dom';
import type { Mock } from 'vite-plus/test';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import type { ScreenOrientationLockType } from '../orientation-lock';
import { orientationLockFeature, selectOrientationLock } from '../orientation-lock';

/** Stands in for the unrelated features a real player publishes alongside. */
const noiseSlice = defineSlice<PlayerTarget>()({
  state: ({ set }): { tick: number; setTick(value: number): void } => ({
    tick: 0,
    setTick: (value) => set({ tick: value }),
  }),
});

type OrientationMock = {
  lock: Mock<ScreenOrientation['lock']>;
  unlock: Mock<ScreenOrientation['unlock']>;
};

function stubOrientation(): OrientationMock;
function stubOrientation<Orientation extends Partial<ScreenOrientation>>(orientation: Orientation): Orientation;
function stubOrientation<Orientation extends Partial<ScreenOrientation>>(orientation?: Orientation) {
  const stub =
    orientation ??
    ({
      lock: vi.fn<ScreenOrientation['lock']>(async () => {}),
      unlock: vi.fn<ScreenOrientation['unlock']>(),
    } satisfies OrientationMock);

  vi.stubGlobal('screen', { orientation: stub });
  return stub;
}

function setFullscreenElement(value: Element | null) {
  Object.defineProperty(document, 'fullscreenElement', {
    value,
    writable: true,
    configurable: true,
  });
}

// Stores keep document-level fullscreen listeners until destroyed, so an
// undestroyed store from an earlier test reacts to later dispatches.
const stores: { destroy(): void }[] = [];

function createOrientationStore() {
  const store = createStore<PlayerTarget>()(orientationLockFeature);

  stores.push(store);
  return store;
}

describe('orientationLockFeature', () => {
  afterEach(() => {
    for (const store of stores.splice(0)) store.destroy();

    setFullscreenElement(null);
    vi.unstubAllGlobals();
  });

  it('locks landscape by default when fullscreen starts', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });
  });

  it('locks the configured orientation type when fullscreen starts', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.setOrientationLockType('portrait');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('portrait');
    });
  });

  it('re-locks when the configured type changes during fullscreen', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });

    store.setOrientationLockType('portrait');

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('portrait');
    });

    expect(orientation.unlock).not.toHaveBeenCalled();
  });

  it('restores the default type when configuration is cleared', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.setOrientationLockType('portrait');
    expect(store.orientationLockType).toBe('portrait');

    store.setOrientationLockType(undefined);
    expect(store.orientationLockType).toBe('landscape');

    store.attach({ media: video, container });
    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });
  });

  it('preserves the configured type across detach', () => {
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.setOrientationLockType('portrait');

    const detach = store.attach({ media: video, container });

    detach();

    expect(store.orientationLockType).toBe('portrait');
  });

  it('stops responding to configuration changes after detach', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();
    const detach = store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalled();
    });

    await Promise.resolve();
    detach();
    orientation.lock.mockClear();

    store.setOrientationLockType('portrait');
    await Promise.resolve();

    expect(orientation.lock).not.toHaveBeenCalled();
  });

  it('unlocks when fullscreen exits', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalled();
    });

    await Promise.resolve();
    orientation.unlock.mockClear();

    setFullscreenElement(null);
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('unlocks on destroy while fullscreen is active', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalled();
    });

    await Promise.resolve();
    orientation.unlock.mockClear();
    store.destroy();

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('handles webkit presentation mode changes', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

    video.webkitPresentationMode = 'inline';
    const container = document.createElement('div');

    const store = createOrientationStore();

    store.attach({ media: video, container });

    video.webkitPresentationMode = 'fullscreen';
    video.dispatchEvent(new Event('webkitpresentationmodechanged'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });

    await Promise.resolve();
    orientation.unlock.mockClear();

    video.webkitPresentationMode = 'inline';
    video.dispatchEvent(new Event('webkitpresentationmodechanged'));

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('restores the default type for an empty configured value', () => {
    stubOrientation();

    const store = createOrientationStore();

    store.state.setOrientationLockType('portrait');
    expect(store.state.orientationLockType).toBe('portrait');

    store.state.setOrientationLockType('' as ScreenOrientationLockType);

    expect(store.state.orientationLockType).toBe('landscape');
  });

  it('exposes the orientation lock slice name for selectors', () => {
    expect(orientationLockFeature.name).toBe('orientationLock');
    expect(selectOrientationLock.displayName).toBe('orientationLock');
  });

  it('selects orientation lock state', () => {
    stubOrientation();

    const store = createOrientationStore();

    expect(selectOrientationLock(store.state)?.orientationLockType).toBe('landscape');
  });

  it('does not re-request a rejected lock when unrelated state changes', async () => {
    // Desktop Chrome rejects `lock()` outside mobile form factors, so `held`
    // never catches up to the requested type and the primitive cannot dedupe
    // on its own. Only the resolved-value comparison in `sync` stops a retry
    // for every published change.
    const orientation = stubOrientation({
      lock: vi.fn<ScreenOrientation['lock']>().mockRejectedValue(new Error('NotSupportedError')),
      unlock: vi.fn<ScreenOrientation['unlock']>(),
    });
    const video = createMockVideo();
    const container = document.createElement('div');

    const store = createStore<PlayerTarget>()(combine(orientationLockFeature, noiseSlice));

    stores.push(store);
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledTimes(1);
    });

    // The feature subscribes to the whole store, and a real player publishes
    // constantly during playback (`currentTime` alone runs at several hertz).
    for (let tick = 1; tick <= 5; tick += 1) store.state.setTick(tick);

    await vi.waitFor(() => {
      expect(store.state.tick).toBe(5);
    });

    expect(orientation.lock).toHaveBeenCalledTimes(1);
  });
});
