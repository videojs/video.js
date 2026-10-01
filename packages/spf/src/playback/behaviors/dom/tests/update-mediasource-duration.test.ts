import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Presentation } from '../../../../media/types';
import { updateMediaSourceDuration } from '../update-mediasource-duration';

function setupUpdateMediaSourceDuration() {
  const state = { presentation: signal<MaybeResolvedPresentation | undefined>(undefined) };
  const context = { mediaSource: signal<MediaSource | undefined>(undefined) };
  const reactor = updateMediaSourceDuration.setup({ state, context });

  return { state, context, reactor };
}

function makeMediaSource({
  duration = NaN,
  readyState = 'open',
  sourceBuffers = [],
}: {
  duration?: number;
  readyState?: MediaSource['readyState'];
  sourceBuffers?: SourceBuffer[];
} = {}) {
  // Back the mock with a real EventTarget so tests can dispatch
  // sourceopen / sourceended to drive `waitForMediaSourceOpen`.
  const target = new EventTarget();

  return Object.create(MediaSource.prototype, {
    readyState: { value: readyState, writable: true },
    duration: { value: duration, writable: true, configurable: true },
    sourceBuffers: { value: sourceBuffers as unknown as SourceBufferList, writable: false },
    addEventListener: { value: target.addEventListener.bind(target) },
    removeEventListener: { value: target.removeEventListener.bind(target) },
    dispatchEvent: { value: target.dispatchEvent.bind(target) },
  }) as MediaSource;
}

function transitionMediaSource(mediaSource: MediaSource, readyState: MediaSource['readyState'], eventType: string) {
  (mediaSource as MediaSource & { readyState: MediaSource['readyState'] }).readyState = readyState;
  mediaSource.dispatchEvent(new Event(eventType));
}

function makeUpdatingSourceBuffer() {
  const target = Object.assign(new EventTarget(), {
    updating: true,
    buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
  });
  const addEventListener = vi.spyOn(target, 'addEventListener');
  const buffer = target as unknown as SourceBuffer;
  const finishUpdating = () => {
    target.updating = false;
    target.dispatchEvent(new Event('updateend'));
  };

  return { buffer, finishUpdating, addEventListener };
}

function recordDurationWrites(mediaSource: MediaSource) {
  let duration = mediaSource.duration;
  const write = vi.fn((next: number) => {
    if (mediaSource.readyState !== 'open' || [...mediaSource.sourceBuffers].some((buffer) => buffer.updating)) {
      throw new DOMException('MediaSource is not ready', 'InvalidStateError');
    }

    duration = next;
  });

  Object.defineProperty(mediaSource, 'duration', { get: () => duration, set: write });
  return write;
}

describe('updateMediaSourceDuration', () => {
  it('sets MediaSource.duration when conditions met', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockMediaSource = makeMediaSource();

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: 60 } as Presentation);

    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(60);
    });

    reactor.destroy();
  });

  it('does not update again after initial set even if presentation duration changes', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();
    const mockMediaSource = makeMediaSource();
    const write = recordDurationWrites(mockMediaSource);

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ duration: 60 } as Presentation);
      await vi.waitFor(() => expect(write).toHaveBeenCalledExactlyOnceWith(60));

      state.presentation.set({ duration: 120 } as Presentation);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockMediaSource.duration).toBe(60);

      state.presentation.set(undefined);
      await vi.waitFor(() => expect(reactor.snapshot.get().value).toBe('preconditions-unmet'));
      state.presentation.set({ duration: 120 } as Presentation);
      await vi.waitFor(() => expect(reactor.snapshot.get().value).toBe('duration-writable'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).toHaveBeenCalledExactlyOnceWith(60);
      expect(mockMediaSource.duration).toBe(60);
    } finally {
      reactor.destroy();
    }
  });

  it('waits for sourceopen before writing when MediaSource starts closed', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockMediaSource = makeMediaSource({ readyState: 'closed' });

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: 60 } as Presentation);

    // Behavior is awaiting sourceopen — duration not yet written.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMediaSource.duration).toBeNaN();

    // MediaSource opens — write proceeds.
    transitionMediaSource(mockMediaSource, 'open', 'sourceopen');

    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(60);
    });

    reactor.destroy();
  });

  it('does not write if MediaSource transitions to ended before opening', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockMediaSource = makeMediaSource({ readyState: 'closed' });

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: 60 } as Presentation);

    // Race: endOfStream lands before sourceopen — readyState jumps to 'ended'.
    transitionMediaSource(mockMediaSource, 'ended', 'sourceended');

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockMediaSource.duration).toBeNaN();

    reactor.destroy();
  });

  it.each([NaN, -10])('does not update when duration is invalid (%s)', async (duration) => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();
    const mockMediaSource = makeMediaSource();
    const write = recordDurationWrites(mockMediaSource);

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ duration } as Presentation);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).not.toHaveBeenCalled();

      state.presentation.set({ duration: 60 } as Presentation);
      await vi.waitFor(() => expect(write).toHaveBeenCalledExactlyOnceWith(60));
    } finally {
      reactor.destroy();
    }
  });

  it('writes Infinity to MediaSource.duration for live', async () => {
    // Per the MSE spec, `mediaSource.duration = Number.POSITIVE_INFINITY` is
    // the canonical live signal. The buffered-range clamp doesn't fire
    // (`anyEnd > Infinity` is always false), so Infinity passes through.
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockMediaSource = makeMediaSource();

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: Number.POSITIVE_INFINITY } as Presentation);

    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(Number.POSITIVE_INFINITY);
    });

    reactor.destroy();
  });

  it('writes Infinity after sourceopen when the MediaSource starts closed (live)', async () => {
    // Regression: the live path used to write only if the MediaSource was
    // already open at entry, returning without scheduling a wait otherwise. The
    // presentation can resolve to Infinity before `setupMediaSource` opens the
    // MediaSource, so that eager write was missed — the first append then pinned
    // a finite live-edge duration, and appends stalled once the window slid past.
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockMediaSource = makeMediaSource({ readyState: 'closed' });

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: Number.POSITIVE_INFINITY } as Presentation);

    // Awaiting sourceopen — nothing written yet.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMediaSource.duration).toBeNaN();

    // MediaSource opens — Infinity is written.
    transitionMediaSource(mockMediaSource, 'open', 'sourceopen');

    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(Number.POSITIVE_INFINITY);
    });

    reactor.destroy();
  });

  it('writes Infinity for live only once a mid-append buffer goes idle', async () => {
    // Regression: a synchronous Infinity write that races an in-flight append
    // throws (MSE forbids setting duration while a buffer is updating) and was
    // swallowed, leaving the live stream pinned to a finite duration. The write
    // must defer to a non-updating instant.
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const { buffer: mockBuffer, finishUpdating } = makeUpdatingSourceBuffer();
    const mockMediaSource = makeMediaSource({ duration: 30, sourceBuffers: [mockBuffer] });

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: Number.POSITIVE_INFINITY } as Presentation);

    // Buffer still updating — must not have written yet (and must not throw).
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMediaSource.duration).toBe(30);

    // Append finishes — Infinity is written, overriding the finite value.
    finishUpdating();
    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(Number.POSITIVE_INFINITY);
    });

    reactor.destroy();
  });

  it('extends duration to match buffered range if needed', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockBuffered = {
      length: 1,
      start: () => 0,
      end: () => 60.5, // Buffered to 60.5 seconds
    };

    const mockBuffer = Object.create(SourceBuffer.prototype, {
      buffered: { value: mockBuffered, writable: false },
      updating: { value: false, writable: true },
    });

    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockBuffer] });

    context.mediaSource.set(mockMediaSource);

    // Presentation duration is 60, but buffered is 60.5
    state.presentation.set({ duration: 60 } as Presentation);

    await vi.waitFor(() => {
      // Duration should be extended to match buffered range
      expect(mockMediaSource.duration).toBe(60.5);
    });

    reactor.destroy();
  });

  it('defers duration set until the attached buffer finishes updating', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();
    const { buffer: mockBuffer, finishUpdating, addEventListener } = makeUpdatingSourceBuffer();
    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockBuffer] });
    const write = recordDurationWrites(mockMediaSource);

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ duration: 60 } as Presentation);
      await vi.waitFor(() =>
        expect(addEventListener).toHaveBeenCalledWith('updateend', expect.any(Function), expect.any(Object))
      );
      expect(write).not.toHaveBeenCalled();

      finishUpdating();
      await vi.waitFor(() => expect(write).toHaveBeenCalledExactlyOnceWith(60));
      expect(mockMediaSource.duration).toBe(60);
    } finally {
      reactor.destroy();
    }
  });

  it('preserves a finite duration set while waiting for buffers to finish updating', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const { buffer: mockBuffer, finishUpdating } = makeUpdatingSourceBuffer();
    const addEventListener = vi.spyOn(mockBuffer, 'addEventListener');
    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockBuffer] });

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ url: 'https://example.com/video.m3u8', duration: 60 });

      await vi.waitFor(() => {
        expect(addEventListener).toHaveBeenCalled();
      });

      mockMediaSource.duration = 42;
      finishUpdating();

      // Let the resumed write settle before asserting that duration was preserved.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockMediaSource.duration).toBe(42);
    } finally {
      reactor.destroy();
    }
  });

  it('defers until every attached SourceBuffer finishes updating', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();
    const { buffer: mockA, finishUpdating: finishA, addEventListener: listenA } = makeUpdatingSourceBuffer();
    const { buffer: mockB, finishUpdating: finishB, addEventListener: listenB } = makeUpdatingSourceBuffer();
    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockA, mockB] });
    const write = recordDurationWrites(mockMediaSource);

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ duration: 60 } as Presentation);
      await vi.waitFor(() => {
        expect(listenA).toHaveBeenCalledWith('updateend', expect.any(Function), expect.any(Object));
        expect(listenB).toHaveBeenCalledWith('updateend', expect.any(Function), expect.any(Object));
      });
      expect(write).not.toHaveBeenCalled();

      finishA();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).not.toHaveBeenCalled();

      finishB();
      await vi.waitFor(() => expect(write).toHaveBeenCalledExactlyOnceWith(60));
    } finally {
      reactor.destroy();
    }
  });

  it('composes against a single-buffer (audio-only) MediaSource', async () => {
    // Demonstrates the generic posture: the behavior wires only to mediaSource
    // and reads its sourceBuffers — audio-only and video-only configurations
    // compose it without per-type slot plumbing.
    const { state, context, reactor } = setupUpdateMediaSourceDuration();

    const mockAudioBuffer = Object.create(SourceBuffer.prototype, {
      buffered: { value: { length: 0, start: () => 0, end: () => 0 } as TimeRanges, writable: false },
      updating: { value: false, writable: true },
    });
    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockAudioBuffer] });

    context.mediaSource.set(mockMediaSource);
    state.presentation.set({ duration: 45 } as Presentation);

    await vi.waitFor(() => {
      expect(mockMediaSource.duration).toBe(45);
    });

    reactor.destroy();
  });

  it('does not throw when readyState transitions to ended during the async wait', async () => {
    const { state, context, reactor } = setupUpdateMediaSourceDuration();
    const { buffer: mockBuffer, finishUpdating, addEventListener } = makeUpdatingSourceBuffer();
    const mockMediaSource = makeMediaSource({ sourceBuffers: [mockBuffer] });
    const write = recordDurationWrites(mockMediaSource);

    try {
      context.mediaSource.set(mockMediaSource);
      state.presentation.set({ duration: 60 } as Presentation);
      await vi.waitFor(() =>
        expect(addEventListener).toHaveBeenCalledWith('updateend', expect.any(Function), expect.any(Object))
      );
      expect(mockMediaSource.readyState).toBe('open');

      transitionMediaSource(mockMediaSource, 'ended', 'sourceended');
      finishUpdating();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(write).not.toHaveBeenCalled();
      expect(mockMediaSource.duration).toBeNaN();
    } finally {
      reactor.destroy();
    }
  });
});
