import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { StateSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import type { ScreenResolution } from '../../../../media/dom/screen';
import {
  type ScreenResolutionState,
  type TrackScreenResolutionConfig,
  trackScreenResolution,
} from '../track-screen-resolution';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A mutable screen, so a test can move it the way the environment would. */
function stubScreen(width: number, height: number, ratio = 1) {
  const screen = Object.assign(new EventTarget(), { width, height, orientation: new EventTarget() });

  vi.stubGlobal('screen', screen);
  vi.stubGlobal('devicePixelRatio', ratio);
  return screen;
}

function setupTrackScreenResolution(config?: TrackScreenResolutionConfig) {
  const state: StateSignals<ScreenResolutionState> = {
    screenResolution: signal<ScreenResolution | undefined>(undefined),
  };
  const cleanup = trackScreenResolution.setup({ state, context: {}, config });

  return { state, cleanup };
}

describe('trackScreenResolution', () => {
  it('populates the slot at setup, not on the first change', () => {
    // The watcher reports its starting value, so nothing downstream sees
    // `undefined` while waiting for a screen that may never change.
    stubScreen(1440, 900);

    const { state, cleanup } = setupTrackScreenResolution();

    expect(state.screenResolution.get()).toEqual({ width: 1440, height: 900 });
    cleanup();
  });

  it('reports device pixels by default', () => {
    stubScreen(1440, 900, 2);

    const { state, cleanup } = setupTrackScreenResolution();

    expect(state.screenResolution.get()).toEqual({ width: 2880, height: 1800 });
    cleanup();
  });

  it('reports CSS pixels when useDevicePixelRatio is off', () => {
    stubScreen(1440, 900, 2);

    const { state, cleanup } = setupTrackScreenResolution({ useDevicePixelRatio: false });

    expect(state.screenResolution.get()).toEqual({ width: 1440, height: 900 });
    cleanup();
  });

  it('tracks the screen changing under the window', () => {
    const screen = stubScreen(1440, 900);
    const { state, cleanup } = setupTrackScreenResolution();

    screen.width = 3840;
    screen.height = 2160;
    screen.dispatchEvent(new Event('change'));

    expect(state.screenResolution.get()).toEqual({ width: 3840, height: 2160 });
    cleanup();
  });

  it('writes undefined where there is no screen to read', () => {
    // The value a cap reads as "no cap", rather than leaving the slot unwritten.
    vi.stubGlobal('screen', undefined);

    const state = { screenResolution: signal<ScreenResolution | undefined>({ width: 1920, height: 1080 }) };
    const cleanup = trackScreenResolution.setup({ state, context: {} });

    expect(state.screenResolution.get()).toBeUndefined();
    cleanup();
  });

  it('stops writing after cleanup', () => {
    const screen = stubScreen(1440, 900);
    const { state, cleanup } = setupTrackScreenResolution();

    cleanup();

    screen.width = 3840;
    screen.dispatchEvent(new Event('change'));

    expect(state.screenResolution.get()).toEqual({ width: 1440, height: 900 });
  });
});
