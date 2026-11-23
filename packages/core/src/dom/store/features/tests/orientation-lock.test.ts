import { combine, createStore, defineSlice } from '@videojs/store';
import type { WebKitVideoElement } from '@videojs/utils/dom';
import type { Mock } from 'vite-plus/test';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import type { OrientationLockType } from '../orientation-lock';
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

function setVideoDimensions(video: HTMLVideoElement, width: number, height: number) {
  Object.defineProperties(video, {
    videoWidth: { value: width, writable: true, configurable: true },
    videoHeight: { value: height, writable: true, configurable: true },
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

  it.each([
    { width: 1920, height: 1080, expected: 'landscape' },
    { width: 1080, height: 1920, expected: 'portrait' },
  ])('resolves auto to $expected for $width by $height video', async ({ width, height, expected }) => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, width, height);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith(expected);
    });
  });

  it('does not lock square video in auto mode', () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 1080, 1080);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(orientation.lock).not.toHaveBeenCalled();
  });

  it('unlocks when video dimensions become square during fullscreen', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 1920, 1080);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });

    setVideoDimensions(video, 1080, 1080);
    video.dispatchEvent(new Event('resize'));

    await vi.waitFor(() => {
      expect(orientation.unlock).toHaveBeenCalledTimes(1);
    });
  });

  it('waits for video dimensions and locks when metadata loads', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 0, 0);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(orientation.lock).not.toHaveBeenCalled();

    setVideoDimensions(video, 1920, 1080);
    video.dispatchEvent(new Event('loadedmetadata'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });
  });

  it('updates the resolved orientation when video dimensions change during fullscreen', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 1080, 1920);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('portrait');
    });

    setVideoDimensions(video, 1920, 1080);
    video.dispatchEvent(new Event('resize'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });
  });

  it('resolves auto when the setting changes during fullscreen', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 1920, 1080);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('portrait');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('portrait');
    });

    store.setOrientationLockType('auto');

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
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
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });

    await Promise.resolve();
    orientation.unlock.mockClear();

    setFullscreenElement(null);
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('unlocks when fullscreen exits with auto orientation', async () => {
    const orientation = stubOrientation();
    const video = createMockVideo();

    setVideoDimensions(video, 1080, 1920);

    const container = document.createElement('div');
    const store = createOrientationStore();

    store.setOrientationLockType('auto');
    store.attach({ media: video, container });

    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('portrait');
    });

    orientation.unlock.mockClear();
    setFullscreenElement(null);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.unlock).toHaveBeenCalledTimes(1);
    });
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

    store.state.setOrientationLockType('' as OrientationLockType);

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
      lock: vi
        .fn<ScreenOrientation['lock']>()
        .mockRejectedValue(Object.assign(new Error('Not supported'), { name: 'NotSupportedError' })),
      unlock: vi.fn<ScreenOrientation['unlock']>(),
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();

    // The feature subscribes to the whole store, and a real player publishes
    // constantly during playback (`currentTime` alone runs at several hertz).
    for (let tick = 1; tick <= 5; tick += 1) store.state.setTick(tick);

    await vi.waitFor(() => {
      expect(store.state.tick).toBe(5);
    });

    expect(orientation.lock).toHaveBeenCalledTimes(1);
  });

  it('does not warn when orientation locking is unavailable', async () => {
    const orientation = stubOrientation({ unlock: vi.fn<ScreenOrientation['unlock']>() });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn.mockClear();
    const video = createMockVideo();
    const container = document.createElement('div');
    const store = createOrientationStore();

    store.attach({ media: video, container });
    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await Promise.resolve();

    expect(orientation.unlock).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns for unexpected orientation lock failures', async () => {
    const failure = new Error('Permission denied');
    const orientation = stubOrientation({
      lock: vi.fn<ScreenOrientation['lock']>().mockRejectedValue(failure),
      unlock: vi.fn<ScreenOrientation['unlock']>(),
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn.mockClear();
    const video = createMockVideo();
    const container = document.createElement('div');
    const store = createOrientationStore();

    store.attach({ media: video, container });
    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not lock screen orientation'), failure);
    });
  });

  it('does not warn when the platform reports NotSupportedError', async () => {
    const orientation = stubOrientation({
      lock: vi
        .fn<ScreenOrientation['lock']>()
        .mockRejectedValue(Object.assign(new Error('Not supported'), { name: 'NotSupportedError' })),
      unlock: vi.fn<ScreenOrientation['unlock']>(),
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn.mockClear();
    const video = createMockVideo();
    const container = document.createElement('div');
    const store = createOrientationStore();

    store.attach({ media: video, container });
    setFullscreenElement(container);
    document.dispatchEvent(new Event('fullscreenchange'));

    await vi.waitFor(() => {
      expect(orientation.lock).toHaveBeenCalledWith('landscape');
    });
    await Promise.resolve();

    expect(warn).not.toHaveBeenCalled();
  });
});
