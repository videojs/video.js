import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/create-composition';
import { signal } from '../../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Presentation } from '../../../../media/types';
import { applyStartPosition, type StartPositionContext, type StartPositionState } from '../apply-start-position';

/** Minimal resolved presentation — `isResolvedPresentation` needs id + selectionSets. */
function makeResolvedPresentation(url = 'https://example.com/a.m3u8'): Presentation {
  return { id: 'pres-1', url, selectionSets: [], startTime: 0 };
}

/**
 * A real `<video>` with controllable `currentTime` / `readyState` — no media is loaded in tests, so both are stubbed
 * the way `track-current-time.test.ts` stubs `currentTime`.
 */
function makeVideo(opts: { readyState?: number } = {}): HTMLVideoElement {
  const video = document.createElement('video');

  Object.defineProperty(video, 'currentTime', { value: 0, writable: true });
  Object.defineProperty(video, 'readyState', { value: opts.readyState ?? 0, writable: true });
  // jsdom has no media pipeline; `play()` must exist for the resume command.
  video.play = vi.fn(() => Promise.resolve());
  return video;
}

function reachMetadata(video: HTMLVideoElement): void {
  (video as unknown as { readyState: number }).readyState = HTMLMediaElement.HAVE_METADATA;
  video.dispatchEvent(new Event('loadedmetadata'));
}

function makeState(initial: StartPositionState = {}): StateSignals<StartPositionState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    startPosition: signal<number | undefined>(initial.startPosition),
    currentTime: signal<number | undefined>(initial.currentTime),
  };
}

function makeContext(initial: StartPositionContext = {}): ContextSignals<StartPositionContext> {
  return {
    mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement),
  };
}

function setupApplyStartPosition(initialState: StartPositionState = {}, initialContext: StartPositionContext = {}) {
  const state = makeState(initialState);
  const context = makeContext(initialContext);
  const reactor = applyStartPosition.setup({ state, context });

  return { state, context, reactor };
}

describe('applyStartPosition', () => {
  it('seeks the element and consumes the command once metadata arrives', async () => {
    const video = makeVideo();
    const { state, reactor } = setupApplyStartPosition(
      { presentation: makeResolvedPresentation(), startPosition: 42 },
      { mediaElement: video }
    );

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(42));

    expect(video.currentTime).toBe(0);
    expect(state.startPosition.get()).toBe(42);

    reachMetadata(video);

    await vi.waitFor(() => {
      expect(video.currentTime).toBe(42);
      // Consumed: a later MS rebuild must not replay a stale position.
      expect(state.startPosition.get()).toBeUndefined();
    });

    reactor.destroy();
  });

  it('applies immediately when the element already has metadata', async () => {
    const video = makeVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
    const { state, reactor } = setupApplyStartPosition(
      { presentation: makeResolvedPresentation() },
      { mediaElement: video }
    );

    // Command arrives mid-session (e.g. consumer-driven resume).
    state.startPosition.set(7);

    await vi.waitFor(() => {
      expect(video.currentTime).toBe(7);
      expect(state.startPosition.get()).toBeUndefined();
      expect(state.currentTime.get()).toBe(7);
    });

    reactor.destroy();
  });

  it('waits for a resolved presentation', async () => {
    const video = makeVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
    const { state, reactor } = setupApplyStartPosition(
      // Unresolved: url only — the command must idle until resolution.
      { presentation: { url: 'https://example.com/a.m3u8' }, startPosition: 42 },
      { mediaElement: video }
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(video.currentTime).toBe(0);
    expect(state.startPosition.get()).toBe(42);

    state.presentation.set(makeResolvedPresentation());
    await vi.waitFor(() => {
      expect(video.currentTime).toBe(42);
      expect(state.startPosition.get()).toBeUndefined();
    });

    reactor.destroy();
  });

  it('cancels a pending apply on source reset without consuming the command', async () => {
    const video = makeVideo();
    const { state, reactor } = setupApplyStartPosition(
      { presentation: makeResolvedPresentation(), startPosition: 42 },
      { mediaElement: video }
    );

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(42));

    // Source resets (URL replacement routes the presentation back through
    // unresolved) before the old source ever reached metadata.
    state.presentation.set({ url: 'https://example.com/b.m3u8' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The dropped listener must not fire against the new source's element
    // state...
    reachMetadata(video);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.startPosition.get()).toBe(42);

    // ...but the unconsumed command applies once the new source resolves —
    // "start the source I'm loading at P" survives the routing.
    state.presentation.set(makeResolvedPresentation('https://example.com/b.m3u8'));
    await vi.waitFor(() => {
      expect(video.currentTime).toBe(42);
      expect(state.startPosition.get()).toBeUndefined();
    });

    reactor.destroy();
  });

  it('does not touch playing/paused — position only', async () => {
    const video = makeVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
    const { state, reactor } = setupApplyStartPosition(
      { presentation: makeResolvedPresentation(), startPosition: 42 },
      { mediaElement: video }
    );

    await vi.waitFor(() => {
      expect(video.currentTime).toBe(42);
      expect(state.startPosition.get()).toBeUndefined();
    });
    expect(video.play).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('cleans up on destroy — no apply after teardown', async () => {
    const video = makeVideo();
    const { state, reactor } = setupApplyStartPosition(
      { presentation: makeResolvedPresentation(), startPosition: 42 },
      { mediaElement: video }
    );

    await vi.waitFor(() => expect(state.currentTime.get()).toBe(42));

    reactor.destroy();
    await new Promise((resolve) => setTimeout(resolve, 0));

    reachMetadata(video);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(video.currentTime).toBe(0);
    expect(state.startPosition.get()).toBe(42);
  });
});
