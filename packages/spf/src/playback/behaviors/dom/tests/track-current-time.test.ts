import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/create-composition';
import { signal } from '../../../../core/signals/primitives';
import {
  type CurrentTimeContext,
  type CurrentTimeState,
  type TrackCurrentTimeConfig,
  trackCurrentTime,
} from '../track-current-time';

function makeState(initial: CurrentTimeState = {}): StateSignals<CurrentTimeState> {
  return {
    currentTime: signal<number | undefined>(initial.currentTime),
  };
}

function makeContext(initial: CurrentTimeContext = {}): ContextSignals<CurrentTimeContext> {
  return {
    mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement),
  };
}

function setupTrackCurrentTime(
  initialState: CurrentTimeState,
  initialContext: CurrentTimeContext,
  config?: TrackCurrentTimeConfig
) {
  const state = makeState(initialState);
  const context = makeContext(initialContext);
  const cleanup = trackCurrentTime.setup({ state, context, config });

  return { state, context, cleanup };
}

describe('trackCurrentTime', () => {
  it('syncs currentTime immediately when mediaElement is provided', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 5.5, writable: true });

    const { state, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    await vi.waitFor(() => {
      expect(state.currentTime.get()).toBe(5.5);
    });

    cleanup();
  });

  it('continues tracking on subsequent timeupdate events', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 0, writable: true });

    const { state, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    (mediaElement as any).currentTime = 3.0;
    mediaElement.dispatchEvent(new Event('timeupdate'));
    await vi.waitFor(() => expect(state.currentTime.get()).toBe(3.0));

    (mediaElement as any).currentTime = 7.5;
    mediaElement.dispatchEvent(new Event('timeupdate'));
    await vi.waitFor(() => expect(state.currentTime.get()).toBe(7.5));

    cleanup();
  });

  it('does not re-setup when context updates but mediaElement is unchanged', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 5, writable: true });

    const addEventListenerSpy = vi.spyOn(mediaElement, 'addEventListener');

    const state = makeState();
    const context: ContextSignals<CurrentTimeContext> & { videoBuffer: ReturnType<typeof signal<unknown>> } = {
      mediaElement: signal<HTMLMediaElement | undefined>(mediaElement),
      videoBuffer: signal<unknown>(undefined),
    };
    const cleanup = trackCurrentTime.setup({ state, context });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(5));

    const callsBefore = addEventListenerSpy.mock.calls.length;

    context.videoBuffer.set({});
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(addEventListenerSpy.mock.calls.length).toBe(callsBefore);

    cleanup();
  });

  it('writes defaultCurrentTime (0) when no mediaElement', async () => {
    const { state, cleanup } = setupTrackCurrentTime({}, {});

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(0));

    cleanup();
  });

  it('resets to defaultCurrentTime when mediaElement is removed', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 5.5, writable: true });

    const { state, context, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(5.5));

    context.mediaElement.set(undefined);

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(0));

    cleanup();
  });

  it('honors config.defaultCurrentTime override on initial and on removal', async () => {
    const { state, context, cleanup } = setupTrackCurrentTime({}, {}, { defaultCurrentTime: 10 });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(10));

    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 5.5, writable: true });
    context.mediaElement.set(mediaElement);

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(5.5));

    context.mediaElement.set(undefined);

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(10));

    cleanup();
  });

  it('starts tracking when mediaElement is added later', async () => {
    const { state, context, cleanup } = setupTrackCurrentTime({}, {});

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(0));

    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 2.0, writable: true });
    context.mediaElement.set(mediaElement);

    await vi.waitFor(() => {
      expect(state.currentTime.get()).toBe(2.0);
    });

    cleanup();
  });

  it('stops listening to old mediaElement when replaced', async () => {
    const element1 = document.createElement('video');

    Object.defineProperty(element1, 'currentTime', { value: 1.0, writable: true });
    const element2 = document.createElement('video');

    Object.defineProperty(element2, 'currentTime', { value: 20.0, writable: true });

    const { state, context, cleanup } = setupTrackCurrentTime({}, { mediaElement: element1 });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(1.0));

    context.mediaElement.set(element2);
    await vi.waitFor(() => expect(state.currentTime.get()).toBe(20.0));

    (element1 as any).currentTime = 99.0;
    element1.dispatchEvent(new Event('timeupdate'));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.currentTime.get()).toBe(20.0);

    cleanup();
  });

  it('resets currentTime on emptied event (src change reuses engine)', async () => {
    const mediaElement = document.createElement('video');
    let currentTime = 5.5;

    Object.defineProperty(mediaElement, 'currentTime', {
      get: () => currentTime,
      set: (v: number) => {
        currentTime = v;
      },
      configurable: true,
    });

    const { state, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(5.5));

    // Simulate src change on the same element: the media element load
    // algorithm resets currentTime to 0 and dispatches `emptied`.
    currentTime = 0;
    mediaElement.dispatchEvent(new Event('emptied'));

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(0));

    cleanup();
  });

  it('updates currentTime on seeking events (seek while paused)', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 0, writable: true });

    const { state, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    (mediaElement as any).currentTime = 60.0;
    mediaElement.dispatchEvent(new Event('seeking'));

    await vi.waitFor(() => {
      expect(state.currentTime.get()).toBe(60.0);
    });

    cleanup();
  });

  it('removes all listeners on cleanup', async () => {
    const mediaElement = document.createElement('video');

    Object.defineProperty(mediaElement, 'currentTime', { value: 0, writable: true });

    const { state, cleanup } = setupTrackCurrentTime({}, { mediaElement });

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(0));

    cleanup();

    (mediaElement as any).currentTime = 50.0;
    mediaElement.dispatchEvent(new Event('timeupdate'));
    mediaElement.dispatchEvent(new Event('seeking'));
    mediaElement.dispatchEvent(new Event('emptied'));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.currentTime.get()).toBe(0);
  });
});
