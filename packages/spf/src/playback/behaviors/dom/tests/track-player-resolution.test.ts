import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import {
  type PlayerResolutionContext,
  type PlayerResolutionState,
  type TrackPlayerResolutionConfig,
  trackPlayerResolution,
} from '../track-player-resolution';

const elements: HTMLElement[] = [];

/**
 * A laid-out `<video>`. Size has to come from a real box in a real document — an element that isn't being rendered
 * reports a `0 × 0` box, which is exactly the "nothing to measure" case one of the tests covers.
 */
function makeVideo(width: number, height: number): HTMLVideoElement {
  const element = document.createElement('video');

  element.style.display = 'block';
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  document.body.append(element);
  elements.push(element);
  return element;
}

function makeState(initial: PlayerResolutionState = {}): StateSignals<PlayerResolutionState> {
  return {
    playerResolution: signal<PlayerResolutionState['playerResolution']>(initial.playerResolution),
  };
}

function makeContext(initial: PlayerResolutionContext = {}): ContextSignals<PlayerResolutionContext> {
  return {
    mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement),
  };
}

function setupTrackPlayerResolution(
  initialContext: PlayerResolutionContext = {},
  config?: TrackPlayerResolutionConfig
) {
  const state = makeState();
  const context = makeContext(initialContext);
  const cleanup = trackPlayerResolution.setup({ state, context, config });

  return { state, context, cleanup };
}

/**
 * Device-pixel scaling is environment-dependent (headless Chromium reports 1, a retina run reports 2), so a test
 * asserting an exact reading either stubs the ratio or opts out of it.
 */
const CSS_PIXELS: TrackPlayerResolutionConfig = { useDevicePixelRatio: false };

afterEach(() => {
  vi.unstubAllGlobals();

  for (const element of elements.splice(0)) element.remove();
});

describe('trackPlayerResolution', () => {
  it('writes the rendered resolution of the attached media element', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));

    cleanup();
  });

  it('scales the reading into device pixels by default', async () => {
    vi.stubGlobal('devicePixelRatio', 2);
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement });

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 640, height: 360 }));

    cleanup();
  });

  it('rounds a fractional ratio to whole device pixels', async () => {
    vi.stubGlobal('devicePixelRatio', 1.5);
    const mediaElement = makeVideo(321, 181);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement });

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 482, height: 272 }));

    cleanup();
  });

  it('starts measuring when a media element is attached later', async () => {
    const { state, context, cleanup } = setupTrackPlayerResolution({}, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toBeUndefined());

    context.mediaElement.set(makeVideo(640, 360));

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 640, height: 360 }));

    cleanup();
  });

  it('re-measures when the element resizes', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));

    mediaElement.style.width = '1280px';
    mediaElement.style.height = '720px';

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 1280, height: 720 }));

    cleanup();
  });

  it('holds the slot identity when a resize rounds to the same reading', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));
    const measured = state.playerResolution.get();

    // Sub-pixel change: the observer reports it, the rounded reading is the same,
    // so nothing downstream should see a new value to re-run selection on.
    mediaElement.style.width = '320.4px';
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playerResolution.get()).toBe(measured);

    cleanup();
  });

  it('leaves the reading unset for an unrendered element so the cap stays inert', async () => {
    const mediaElement = makeVideo(320, 180);

    mediaElement.style.display = 'none';

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playerResolution.get()).toBeUndefined();

    cleanup();
  });

  it('clears the reading when the media element is detached', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, context, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));

    context.mediaElement.set(undefined);

    await vi.waitFor(() => expect(state.playerResolution.get()).toBeUndefined());

    cleanup();
  });

  it('stops measuring the previous element when it is replaced', async () => {
    const first = makeVideo(320, 180);
    const second = makeVideo(640, 360);

    const { state, context, cleanup } = setupTrackPlayerResolution({ mediaElement: first }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));

    context.mediaElement.set(second);
    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 640, height: 360 }));

    first.style.width = '1920px';
    first.style.height = '1080px';
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playerResolution.get()).toEqual({ width: 640, height: 360 });

    cleanup();
  });

  it('never measures when capRenditionToPlayerSize is false', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, { capRenditionToPlayerSize: false });

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playerResolution.get()).toBeUndefined();

    cleanup();
  });

  it('stops observing on cleanup', async () => {
    const mediaElement = makeVideo(320, 180);

    const { state, cleanup } = setupTrackPlayerResolution({ mediaElement }, CSS_PIXELS);

    await vi.waitFor(() => expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 }));

    cleanup();

    mediaElement.style.width = '1280px';
    mediaElement.style.height = '720px';
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playerResolution.get()).toEqual({ width: 320, height: 180 });
  });
});
