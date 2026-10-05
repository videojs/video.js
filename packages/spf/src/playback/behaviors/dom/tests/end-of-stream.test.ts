import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Presentation, Segment, VideoTrack } from '../../../../media/types';
import { createSourceBufferActor, type SourceBufferActor } from '../../../actors/dom/source-buffer';
import { type EndOfStreamContext, type EndOfStreamState, endOfStream } from '../end-of-stream';

function makeState(initial: EndOfStreamState = {}): StateSignals<EndOfStreamState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    currentTime: signal<number | undefined>(initial.currentTime),
  };
}

// Test-only context shape: extends EndOfStreamContext (which only declares
// `mediaSource` as a contributed slot) with the optional buffer-actor
// signals endOfStream reads defensively. The behavior under test composes
// against whatever's actually present in scope — these tests stand the
// signals up directly to exercise that runtime read path.
interface EndOfStreamTestContext extends EndOfStreamContext {
  videoBufferActor?: SourceBufferActor;
  audioBufferActor?: SourceBufferActor;
}

function makeContext(initial: EndOfStreamTestContext = {}): ContextSignals<EndOfStreamContext> & {
  videoBufferActor: ReturnType<typeof signal<SourceBufferActor | undefined>>;
  audioBufferActor: ReturnType<typeof signal<SourceBufferActor | undefined>>;
} {
  return {
    mediaSource: signal<MediaSource | undefined>(initial.mediaSource),
    videoBufferActor: signal<SourceBufferActor | undefined>(initial.videoBufferActor),
    audioBufferActor: signal<SourceBufferActor | undefined>(initial.audioBufferActor),
  };
}

function setupEndOfStream(initialState: EndOfStreamState, initialContext: EndOfStreamTestContext) {
  // Default `currentTime` well past any test scenario's last-segment startTime
  // — tests that exercise the currentTime gate pass their own value.
  const state = makeState({ currentTime: 1000, ...initialState });
  const context = makeContext(initialContext);
  // endOfStream uses a manual Behavior<> literal (not defineBehavior), so
  // its public setup signature requires config even though the behavior
  // doesn't consume it. Pass {} explicitly. cleanup widens to
  // BehaviorCleanup (void | () => void | { destroy }) — the real return is
  // a () => void; cast for callable ergonomics in tests.
  const cleanup = endOfStream.setup({ state, context, config: {} }) as () => void;

  return { state, context, cleanup };
}

// ============================================================================
// Mock helpers
// ============================================================================

/**
 * Back the mock with a real EventTarget so tests can dispatch sourceopen / sourceended to exercise the behavior's local
 * readyState subscription.
 */
function makeMediaSource(
  overrides: { readyState?: MediaSource['readyState']; duration?: number; sourceBuffers?: SourceBuffer[] } = {}
): MediaSource {
  const target = new EventTarget();
  const ms = Object.create(MediaSource.prototype, {
    readyState: { value: overrides.readyState ?? 'open', writable: true },
    duration: { value: overrides.duration ?? 0, writable: true },
    sourceBuffers: { value: (overrides.sourceBuffers ?? []) as unknown as SourceBufferList, writable: false },
    addEventListener: { value: target.addEventListener.bind(target) },
    removeEventListener: { value: target.removeEventListener.bind(target) },
    dispatchEvent: { value: target.dispatchEvent.bind(target) },
  }) as MediaSource;

  ms.endOfStream = vi.fn();
  return ms;
}

function transitionMediaSource(mediaSource: MediaSource, readyState: MediaSource['readyState'], eventType: string) {
  (mediaSource as MediaSource & { readyState: MediaSource['readyState'] }).readyState = readyState;
  mediaSource.dispatchEvent(new Event(eventType));
}

function makeSourceBuffer(): SourceBuffer {
  const listeners: Record<string, EventListener[]> = {};

  return {
    buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
    updating: false,
    appendBuffer: vi.fn(() => {
      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) listener(new Event('updateend'));
      }, 0);
    }),
    remove: vi.fn(() => {
      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) listener(new Event('updateend'));
      }, 0);
    }),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners[type] ??= [];
      listeners[type].push(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener);
    }),
  } as unknown as SourceBuffer;
}

function makeSegments(count: number): Segment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `seg-${i}`,
    url: `https://example.com/seg-${i}.m4s`,
    startTime: i * 2.5,
    duration: 2.5,
  }));
}

// `complete` toggles the parser's completeness signal: a complete playlist has
// a finite Track.duration (EXTINF sum), an incomplete (live) one is Infinity.
function makeResolvedVideoTrack(segmentCount: number, id = 'video-1', complete = true): VideoTrack {
  return {
    id,
    type: 'video' as const,
    url: 'https://example.com/video.m3u8',
    mimeType: 'video/mp4',
    bandwidth: 1_000_000,
    initialization: { id: 'init', url: 'https://example.com/init.mp4' },
    segments: makeSegments(segmentCount),
    startTime: 0,
    duration: complete ? segmentCount * 2.5 : Number.POSITIVE_INFINITY,
    codecs: 'avc1.64001f',
  } as unknown as VideoTrack;
}

function makePresentation(videoTrack: VideoTrack, id = 'pres-1'): Presentation {
  return {
    id,
    url: 'https://example.com/playlist.m3u8',
    selectionSets: [{ type: 'video', switchingSets: [{ tracks: [videoTrack] }] }],
  } as unknown as Presentation;
}

function makeActorWithSegments(segmentIds: string[], trackId = 'video-1'): SourceBufferActor {
  return createSourceBufferActor(makeSourceBuffer(), {
    initTrackId: trackId,
    segments: segmentIds.map((id, i) => ({
      id,
      startTime: i * 2.5,
      duration: 2.5,
      trackId,
    })),
  });
}

// ============================================================================
// endOfStream
// ============================================================================

describe('endOfStream', () => {
  it('calls MediaSource.endOfStream() when the last segment is loaded', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource();

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });

  it('calls MediaSource.endOfStream() after back-buffer flushing', async () => {
    const track = makeResolvedVideoTrack(10);
    const mockMs = makeMediaSource();

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        // Back buffer flushed; last segment still present.
        videoBufferActor: makeActorWithSegments(['seg-7', 'seg-8', 'seg-9']),
      }
    );

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });

  it('does not call endOfStream() when MediaSource is not open', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource({ readyState: 'ended' });

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();
    await cleanup();
  });

  it('does not call endOfStream() when currentTime has not reached the last segment', async () => {
    const track = makeResolvedVideoTrack(4); // lastSeg.startTime = 7.5
    const mockMs = makeMediaSource();

    const { cleanup } = setupEndOfStream(
      {
        presentation: makePresentation(track),
        currentTime: 5, // mid-stream
      },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();
    await cleanup();
  });

  it('fires once currentTime reaches the last segment startTime', async () => {
    const track = makeResolvedVideoTrack(4); // lastSeg.startTime = 7.5
    const mockMs = makeMediaSource();

    const { state, cleanup } = setupEndOfStream(
      {
        presentation: makePresentation(track),
        currentTime: 5,
      },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();

    state.currentTime.set(7.5);

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });

  it('does not call endOfStream() when last segment is not yet loaded', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource();

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1']),
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();
    await cleanup();
  });

  it('calls endOfStream() once the actor receives the last segment', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource();
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer, {
      initTrackId: 'video-1',
      segments: [
        { id: 'seg-0', startTime: 0, duration: 2.5, trackId: 'video-1' },
        { id: 'seg-1', startTime: 2.5, duration: 2.5, trackId: 'video-1' },
      ],
    });

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      { mediaSource: mockMs, videoBufferActor: actor }
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();

    actor.send({
      type: 'batch',
      messages: [
        {
          type: 'append-segment',
          data: new ArrayBuffer(8),
          meta: { id: 'seg-2', startTime: 5, duration: 2.5, trackId: 'video-1' },
        },
        {
          type: 'append-segment',
          data: new ArrayBuffer(8),
          meta: { id: 'seg-3', startTime: 7.5, duration: 2.5, trackId: 'video-1' },
        },
      ],
    });

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });

  it('calls endOfStream() only once while MediaSource stays ended', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource();

    // Real MSE: endOfStream() flips readyState to 'ended' synchronously
    // and dispatches `sourceended`.
    (mockMs.endOfStream as ReturnType<typeof vi.fn>).mockImplementation(() => {
      transitionMediaSource(mockMs, 'ended', 'sourceended');
    });

    const { state, cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });

    // Force re-evaluation (presentation replace) while MS stays 'ended'.
    state.presentation.set(makePresentation(track));
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    await cleanup();
  });

  it('calls endOfStream() again after seek-back re-opens the MediaSource', async () => {
    const track = makeResolvedVideoTrack(4);
    const mockMs = makeMediaSource();

    (mockMs.endOfStream as ReturnType<typeof vi.fn>).mockImplementation(() => {
      transitionMediaSource(mockMs, 'ended', 'sourceended');
    });

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      {
        mediaSource: mockMs,
        videoBufferActor: makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']),
      }
    );

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });

    // Seek-back: appendBuffer() re-opens the MediaSource per MSE spec —
    // the `sourceopen` event drives the behavior's local mirror back to
    // 'open' and re-arms the reactor.
    transitionMediaSource(mockMs, 'open', 'sourceopen');

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(2);
    });
    await cleanup();
  });

  it('aborts in-flight wait when presentation is cleared mid-flight', async () => {
    const track = makeResolvedVideoTrack(4);
    const target = Object.assign(new EventTarget(), {
      buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
      updating: true,
    });
    const addEventListener = vi.spyOn(target, 'addEventListener');
    const mockMs = makeMediaSource({ sourceBuffers: [target as unknown as SourceBuffer] });
    const actor = makeActorWithSegments(['seg-0', 'seg-1', 'seg-2', 'seg-3']);
    const { state, cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      { mediaSource: mockMs, videoBufferActor: actor }
    );

    try {
      await vi.waitFor(() =>
        expect(addEventListener).toHaveBeenCalledWith('updateend', expect.any(Function), expect.any(Object))
      );
      const options = addEventListener.mock.calls.find(([type]) => type === 'updateend')![2] as AddEventListenerOptions;
      const signal = options.signal!;

      expect(signal.aborted).toBe(false);
      expect(mockMs.endOfStream).not.toHaveBeenCalled();
      state.presentation.set(undefined);
      await vi.waitFor(() => expect(signal.aborted).toBe(true));

      target.updating = false;
      target.dispatchEvent(new Event('updateend'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockMs.endOfStream).not.toHaveBeenCalled();
    } finally {
      cleanup();
      actor.destroy();
      target.updating = false;
      target.dispatchEvent(new Event('updateend'));
    }
  });

  it('composes against an audio-only configuration', async () => {
    // Audio-only: only audioBufferActor in scope; the behavior iterates
    // whatever's present without per-type-specialized paths.
    const audioTrack = {
      id: 'audio-1',
      type: 'audio',
      url: 'https://example.com/audio.m3u8',
      mimeType: 'audio/mp4',
      // Complete playlist — finite duration opens the completeness gate.
      duration: 10,
      segments: makeSegments(4).map((s) => ({ ...s, id: `audio-${s.id}` })),
    } as unknown as VideoTrack;
    const presentation = {
      id: 'pres-1',
      url: 'https://example.com/playlist.m3u8',
      selectionSets: [{ type: 'audio', switchingSets: [{ tracks: [audioTrack] }] }],
    } as unknown as Presentation;

    const mockMs = makeMediaSource();
    const audioBufferActor = makeActorWithSegments(
      ['audio-seg-0', 'audio-seg-1', 'audio-seg-2', 'audio-seg-3'],
      'audio-1'
    );

    const { cleanup } = setupEndOfStream({ presentation }, { mediaSource: mockMs, audioBufferActor });

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });

  it('does not call endOfStream() for a live (incomplete) playlist even with the last segment appended', async () => {
    // Live: no #EXT-X-ENDLIST. The "last segment" is only the rolling edge, so
    // appending it must NOT end the stream — doing so would pin a finite
    // (live-edge) duration and reopen/re-fire on every reload.
    const track = makeResolvedVideoTrack(2, 'video-1', false);
    const mockMs = makeMediaSource();
    const actor = makeActorWithSegments(['seg-0', 'seg-1']);

    const { cleanup } = setupEndOfStream(
      { presentation: makePresentation(track) },
      { mediaSource: mockMs, videoBufferActor: actor }
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();
    await cleanup();
  });

  it('calls endOfStream() once a live playlist appends #EXT-X-ENDLIST (graceful end)', async () => {
    // A live stream that ends appends #EXT-X-ENDLIST; the guard then opens and
    // end-of-stream fires normally.
    const liveTrack = makeResolvedVideoTrack(2, 'video-1', false);
    const mockMs = makeMediaSource();
    const actor = makeActorWithSegments(['seg-0', 'seg-1']);

    const { state, cleanup } = setupEndOfStream(
      { presentation: makePresentation(liveTrack) },
      { mediaSource: mockMs, videoBufferActor: actor }
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockMs.endOfStream).not.toHaveBeenCalled();

    // Stream ends: a reload patches in the same window now marked complete.
    state.presentation.set(makePresentation(makeResolvedVideoTrack(2, 'video-1', true)));

    await vi.waitFor(() => {
      expect(mockMs.endOfStream).toHaveBeenCalledTimes(1);
    });
    await cleanup();
  });
});
