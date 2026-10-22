import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import {
  type PlaybackRateContext,
  type PlaybackRateState,
  type TrackPlaybackRateConfig,
  trackPlaybackRate,
} from '../track-playback-rate';

function makeState(initial: PlaybackRateState = {}): StateSignals<PlaybackRateState> {
  return { playbackRate: signal<number | undefined>(initial.playbackRate) };
}

function makeContext(initial: PlaybackRateContext = {}): ContextSignals<PlaybackRateContext> {
  return { mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement) };
}

function setupTrackPlaybackRate(
  initialState: PlaybackRateState = {},
  initialContext: PlaybackRateContext = {},
  config?: TrackPlaybackRateConfig
) {
  const state = makeState(initialState);
  const context = makeContext(initialContext);
  const cleanup = trackPlaybackRate.setup({ state, context, config });

  return { state, context, cleanup };
}

describe('trackPlaybackRate', () => {
  it('syncs playbackRate immediately when mediaElement is provided', async () => {
    const mediaElement = document.createElement('video');

    const { state, cleanup } = setupTrackPlaybackRate({}, { mediaElement });

    await vi.waitFor(() => {
      expect(state.playbackRate.get()).toBe(1);
    });

    cleanup();
  });

  it('continues tracking on subsequent ratechange events', async () => {
    const mediaElement = document.createElement('video');

    const { state, cleanup } = setupTrackPlaybackRate({}, { mediaElement });

    mediaElement.playbackRate = 0.5;
    mediaElement.dispatchEvent(new Event('ratechange'));
    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(0.5));

    mediaElement.playbackRate = 1.5;
    mediaElement.dispatchEvent(new Event('ratechange'));
    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1.5));

    mediaElement.playbackRate = 2;
    mediaElement.dispatchEvent(new Event('ratechange'));
    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(2));

    cleanup();
  });

  it('writes defaultPlaybackRate (1) when no mediaElement', async () => {
    const { state, cleanup } = setupTrackPlaybackRate();

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1));

    cleanup();
  });

  it('resets to defaultPlaybackRate when mediaElement is removed', async () => {
    const mediaElement = document.createElement('video');

    mediaElement.playbackRate = 2;

    const { state, context, cleanup } = setupTrackPlaybackRate({}, { mediaElement });

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(2));

    context.mediaElement.set(undefined);

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1));

    cleanup();
  });

  it('honors config.defaultPlaybackRate override on initial and on removal', async () => {
    const { state, context, cleanup } = setupTrackPlaybackRate({}, {}, { defaultPlaybackRate: 1.5 });

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1.5));

    const mediaElement = document.createElement('video');

    mediaElement.playbackRate = 2;
    context.mediaElement.set(mediaElement);

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(2));

    context.mediaElement.set(undefined);

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1.5));

    cleanup();
  });

  it('starts tracking when mediaElement is added later', async () => {
    const { state, context, cleanup } = setupTrackPlaybackRate();

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1));

    const mediaElement = document.createElement('video');

    mediaElement.playbackRate = 2;
    context.mediaElement.set(mediaElement);

    await vi.waitFor(() => {
      expect(state.playbackRate.get()).toBe(2);
    });

    cleanup();
  });

  it('stops listening to old mediaElement when replaced', async () => {
    const element1 = document.createElement('video');
    const element2 = document.createElement('video');

    element2.playbackRate = 2;

    const { state, context, cleanup } = setupTrackPlaybackRate({}, { mediaElement: element1 });

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1));

    context.mediaElement.set(element2);
    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(2));

    // Old element ratechange should no longer affect state
    element1.playbackRate = 3;
    element1.dispatchEvent(new Event('ratechange'));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playbackRate.get()).toBe(2);

    cleanup();
  });

  it('removes ratechange listener on cleanup', async () => {
    const mediaElement = document.createElement('video');

    const { state, cleanup } = setupTrackPlaybackRate({}, { mediaElement });

    await vi.waitFor(() => expect(state.playbackRate.get()).toBe(1));

    cleanup();

    mediaElement.playbackRate = 2;
    mediaElement.dispatchEvent(new Event('ratechange'));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(state.playbackRate.get()).toBe(1);
  });
});
