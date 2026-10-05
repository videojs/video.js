/** Tests for segment loading orchestration (F4 + F5) */

import { describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/define-behavior';
import { signal } from '../../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Segment } from '../../../../media/types';
import { type FetchBytes, fetchStream } from '../../../../network/fetch';
import { createSegmentLoaderActor, type SegmentLoaderActor } from '../../../actors/dom/segment-loader';
import { createSourceBufferActor, type SourceBufferActor } from '../../../actors/dom/source-buffer';
import { makeSourceBuffer } from '../../../actors/dom/tests/segment-loader-fixtures';
import type { TextTrackSegmentLoaderActor } from '../../../actors/text-track-segment-loader';
import {
  loadAudioSegments,
  loadVideoSegments,
  type SegmentLoadingContext,
  type SegmentLoadingState,
} from '../load-segments';

function makeState(initial: SegmentLoadingState = {}): StateSignals<SegmentLoadingState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    preload: signal<string | undefined>(initial.preload),
    currentTime: signal<number | undefined>(initial.currentTime),
    loadActivated: signal<boolean | undefined>(initial.loadActivated),
    loadingSuspended: signal<boolean | undefined>(initial.loadingSuspended),
    segmentLoadingBlocked: signal<boolean | undefined>(initial.segmentLoadingBlocked),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
    selectedTextTrackId: signal<string | undefined>(initial.selectedTextTrackId),
  };
}

type TestContext = ContextSignals<SegmentLoadingContext> & {
  videoBufferActor: ReturnType<typeof signal<SourceBufferActor | undefined>>;
  audioBufferActor: ReturnType<typeof signal<SourceBufferActor | undefined>>;
};

function makeContext(
  initial: {
    videoBufferActor?: SourceBufferActor;
    audioBufferActor?: SourceBufferActor;
    videoSegmentLoaderActor?: SegmentLoaderActor;
    audioSegmentLoaderActor?: SegmentLoaderActor;
    textTrackSegmentLoaderActor?: TextTrackSegmentLoaderActor;
  } = {}
): TestContext {
  return {
    videoBufferActor: signal<SourceBufferActor | undefined>(initial.videoBufferActor),
    audioBufferActor: signal<SourceBufferActor | undefined>(initial.audioBufferActor),
    videoSegmentLoaderActor: signal<SegmentLoaderActor | undefined>(initial.videoSegmentLoaderActor),
    audioSegmentLoaderActor: signal<SegmentLoaderActor | undefined>(initial.audioSegmentLoaderActor),
    textTrackSegmentLoaderActor: signal<TextTrackSegmentLoaderActor | undefined>(initial.textTrackSegmentLoaderActor),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSegment(id: string, startTime: number, duration = 10): Segment {
  return { id, url: `http://example.com/${id}.m4s`, startTime, duration };
}

function makeResolvedVideoTrack(segments: Segment[]) {
  return {
    type: 'video' as const,
    id: 'track-1',
    url: 'http://example.com/video.m3u8',
    mimeType: 'video/mp4',
    codecs: ['avc1.42E01E'],
    bandwidth: 1_000_000,
    initialization: { url: 'http://example.com/init.mp4' },
    segments,
    startTime: 0,
    duration: segments.reduce((acc, s) => acc + s.duration, 0),
  };
}

/**
 * Creates a SourceBuffer + SourceBufferActor pair.
 *
 * `preloadedRanges` — initial `buffered` ranges (present before any appends). Use when the actor context is pre-seeded
 * with segments that are already "in" the SourceBuffer without going through the append path. `initialSegments` — seeds
 * the actor context with pre-existing segments.
 */
function makeSourceBufferWithActor(
  preloadedRanges: Array<[number, number]> = [],
  initialSegments: Array<{ id: string; startTime: number; duration: number; trackId: string }> = [],
  initTrackId?: string
) {
  const sourceBuffer = makeSourceBuffer([], preloadedRanges);
  const actor = createSourceBufferActor(
    sourceBuffer,
    initialSegments.length > 0 || initTrackId !== undefined ? { initTrackId, segments: initialSegments } : undefined
  );

  return { sourceBuffer, actor };
}

/**
 * Test driver: composes a per-type segment-loader-actor against the supplied SourceBufferActor and wires it to the
 * per-type `load{Video,Audio}Segments` dispatcher. Production code creates the loader inside
 * `setup{Video,Audio}BufferActors`; tests do the wiring directly to keep the dispatcher under test isolated.
 */
function setupLoadSegments(
  initialState: SegmentLoadingState,
  bufferActor: SourceBufferActor,
  type: 'video' | 'audio',
  fetchFn: FetchBytes = fetchStream
) {
  const state = makeState(initialState);
  const loaderActor = createSegmentLoaderActor(bufferActor, fetchFn);
  const send = vi.spyOn(loaderActor, 'send');
  const context = makeContext(
    type === 'video'
      ? { videoBufferActor: bufferActor, videoSegmentLoaderActor: loaderActor }
      : { audioBufferActor: bufferActor, audioSegmentLoaderActor: loaderActor }
  );
  const reactor =
    type === 'video' ? loadVideoSegments.setup({ state, context }) : loadAudioSegments.setup({ state, context });
  const cleanup = () => {
    reactor.destroy();
    loaderActor.destroy();
    bufferActor.destroy();
  };

  return { state, context, bufferActor, loaderActor, send, cleanup };
}

// ---------------------------------------------------------------------------
// loadSegments orchestration — forward buffer behaviour
// ---------------------------------------------------------------------------

describe('loadVideoSegments', () => {
  it('loads additional segments when currentTime advances', async () => {
    const segments = [
      makeSegment('s1', 0, 10),
      makeSegment('s2', 10, 10),
      makeSegment('s3', 20, 10),
      makeSegment('s4', 30, 10),
    ];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const track = makeResolvedVideoTrack(segments);
    // s1 already loaded — actor pre-seeded with s1 and init
    const { actor } = makeSourceBufferWithActor(
      [[0, 10]],
      [{ id: 's1', startTime: 0, duration: 10, trackId: 'track-1' }],
      'track-1'
    );
    const { state, loaderActor, cleanup } = setupLoadSegments(
      {
        preload: 'auto',
        selectedVideoTrackId: 'track-1',
        currentTime: 0,
        presentation: {
          id: 'p1',
          url: 'http://example.com/playlist.m3u8',
          startTime: 0,
          duration: 40,
          selectionSets: [{ id: 'ss1', type: 'video', switchingSets: [{ id: 'sw1', type: 'video', tracks: [track] }] }],
        },
      },
      actor,
      'video'
    );

    await vi.waitFor(() => {
      expect(fetchedUrls).toContain('http://example.com/s2.m4s');
      expect(fetchedUrls).toContain('http://example.com/s3.m4s');
      expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');
      expect(actor.snapshot.get().context.segments.map(({ id, partial }) => ({ id, partial }))).toEqual([
        { id: 's1', partial: undefined },
        { id: 's2', partial: undefined },
        { id: 's3', partial: undefined },
      ]);
      expect(actor.snapshot.get().value).toBe('idle');
      expect(loaderActor.snapshot.get().value).toBe('idle');
      expect(fetchedUrls).not.toContain('http://example.com/init.mp4');
    });

    expect(fetchedUrls).not.toContain('http://example.com/s4.m4s');

    state.currentTime.set(10);
    await vi.waitFor(() => {
      expect(actor.snapshot.get().context.segments).toHaveLength(4);
      expect(actor.snapshot.get().context.segments.every((segment) => !segment.partial)).toBe(true);
      expect(loaderActor.snapshot.get().value).toBe('idle');
    });
    expect(fetchedUrls).toEqual([
      'http://example.com/s2.m4s',
      'http://example.com/s3.m4s',
      'http://example.com/s4.m4s',
    ]);

    cleanup();
  });
});

// ---------------------------------------------------------------------------
// preload="metadata" — init segment only, no media segments
// ---------------------------------------------------------------------------

describe('loadVideoSegments', () => {
  function makePresentation(segments: Segment[]) {
    return {
      id: 'p1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      duration: segments.reduce((acc, s) => acc + s.duration, 0),
      selectionSets: [
        {
          id: 'ss1',
          type: 'video' as const,
          switchingSets: [{ id: 'sw1', type: 'video' as const, tracks: [makeResolvedVideoTrack(segments)] }],
        },
      ],
    };
  }

  it('loads init segment but not media segments for preload="metadata"', async () => {
    const segments = [makeSegment('s1', 0, 10), makeSegment('s2', 10, 10)];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { cleanup } = setupLoadSegments(
      { preload: 'metadata', selectedVideoTrackId: 'track-1', presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await vi.waitFor(
      () => {
        expect(fetchedUrls).toContain('http://example.com/init.mp4');
      },
      { timeout: 2000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');
    expect(fetchedUrls).not.toContain('http://example.com/s2.m4s');

    cleanup();
  });

  it('sets initTrackId in actor context after metadata init load', async () => {
    const segments = [makeSegment('s1', 0, 10)];

    globalThis.fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(new ArrayBuffer(100))));

    const { actor } = makeSourceBufferWithActor();
    const { bufferActor, cleanup } = setupLoadSegments(
      { preload: 'metadata', selectedVideoTrackId: 'track-1', presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await vi.waitFor(
      () => {
        expect(bufferActor.snapshot.get().context.initTrackId).toBe('track-1');
      },
      { timeout: 2000 }
    );

    expect(bufferActor.snapshot.get().context.segments.length ?? 0).toBe(0);

    cleanup();
  });

  it('loads media segments after loadActivated becomes true', async () => {
    const segments = [makeSegment('s1', 0, 10)];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { state, bufferActor, cleanup } = setupLoadSegments(
      { preload: 'metadata', selectedVideoTrackId: 'track-1', presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await vi.waitFor(
      () => {
        expect(bufferActor.snapshot.get().context.initTrackId).toBe('track-1');
      },
      { timeout: 2000 }
    );

    expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');

    state.loadActivated.set(true);

    await vi.waitFor(
      () => {
        expect(fetchedUrls).toContain('http://example.com/s1.m4s');
      },
      { timeout: 2000 }
    );

    cleanup();
  });
});

// ---------------------------------------------------------------------------
// Forward buffer flushing
// ---------------------------------------------------------------------------

describe('loadVideoSegments', () => {
  function makePresentationFwd(segments: Segment[]) {
    return {
      id: 'p1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      duration: segments.reduce((acc, s) => acc + s.duration, 0),
      selectionSets: [
        {
          id: 'ss1',
          type: 'video' as const,
          switchingSets: [{ id: 'sw1', type: 'video' as const, tracks: [makeResolvedVideoTrack(segments)] }],
        },
      ],
    };
  }

  it('does not flush when all buffered segments are within the buffer window', async () => {
    const segments = [makeSegment('s1', 0, 10), makeSegment('s2', 10, 10), makeSegment('s3', 20, 10)];

    globalThis.fetch = vi.fn();

    const { sourceBuffer, actor } = makeSourceBufferWithActor(
      [[0, 30]],
      segments.map((s) => ({ id: s.id, startTime: s.startTime, duration: s.duration, trackId: 'track-1' })),
      'track-1'
    );
    const { loaderActor, send, cleanup } = setupLoadSegments(
      { preload: 'auto', selectedVideoTrackId: 'track-1', currentTime: 0, presentation: makePresentationFwd(segments) },
      actor,
      'video'
    );

    await vi.waitFor(() => {
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load', range: { start: 0, end: 30 } }));
      expect(loaderActor.snapshot.get().value).toBe('idle');
      expect(actor.snapshot.get().value).toBe('idle');
    });
    expect(actor.snapshot.get().context.segments).toEqual(
      segments.map(({ id, startTime, duration }) => ({ id, startTime, duration, trackId: 'track-1' }))
    );
    expect(sourceBuffer.buffered.length).toBe(1);
    expect(sourceBuffer.buffered.start(0)).toBe(0);
    expect(sourceBuffer.buffered.end(0)).toBe(30);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    expect(sourceBuffer.remove).not.toHaveBeenCalled();

    cleanup();
  });
});

// ---------------------------------------------------------------------------
// load-mode FSM transitions — dormant / metadata-only / full-range
// ---------------------------------------------------------------------------

describe('loadVideoSegments', () => {
  function makePresentation(segments: Segment[]) {
    return {
      id: 'p1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      duration: segments.reduce((acc, s) => acc + s.duration, 0),
      selectionSets: [
        {
          id: 'ss1',
          type: 'video' as const,
          switchingSets: [{ id: 'sw1', type: 'video' as const, tracks: [makeResolvedVideoTrack(segments)] }],
        },
      ],
    };
  }

  it("dormant — preload='none' && !loadActivated: no init or media fetches", async () => {
    const segments = [makeSegment('s1', 0, 10)];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { cleanup } = setupLoadSegments(
      { preload: 'none', selectedVideoTrackId: 'track-1', presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchedUrls).not.toContain('http://example.com/init.mp4');
    expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');

    cleanup();
  });

  it("transitions dormant → metadata-only when preload flips 'none' → 'metadata'", async () => {
    const segments = [makeSegment('s1', 0, 10)];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { state, cleanup } = setupLoadSegments(
      { preload: 'none', selectedVideoTrackId: 'track-1', presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchedUrls).not.toContain('http://example.com/init.mp4');

    state.preload.set('metadata');

    await vi.waitFor(() => {
      expect(fetchedUrls).toContain('http://example.com/init.mp4');
    });
    expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');

    cleanup();
  });

  it("transitions dormant → full-range when loadActivated flips true (preload='none')", async () => {
    const segments = [makeSegment('s1', 0, 10)];

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { state, cleanup } = setupLoadSegments(
      { preload: 'none', selectedVideoTrackId: 'track-1', currentTime: 0, presentation: makePresentation(segments) },
      actor,
      'video'
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchedUrls).not.toContain('http://example.com/init.mp4');

    state.loadActivated.set(true);

    await vi.waitFor(() => {
      expect(fetchedUrls).toContain('http://example.com/init.mp4');
      expect(fetchedUrls).toContain('http://example.com/s1.m4s');
    });

    cleanup();
  });

  it('metadata-only — selection change within state does not re-dispatch (entry, not effects)', async () => {
    // Two video tracks. Start with track-1 + preload='metadata'; the entry
    // body fires once and fetches track-1's init. Switching selection to
    // track-2 while still in `'metadata-only'` (pre-play edge case) is
    // intentionally not followed — track-2's init must not fetch. The
    // eventual `'full-range'` entry would handle whichever track is
    // selected at playback start.
    const segments1 = [makeSegment('s1', 0, 10)];
    const segments2 = [makeSegment('t1', 0, 10)];

    const track1 = makeResolvedVideoTrack(segments1);
    const track2 = {
      ...makeResolvedVideoTrack(segments2),
      id: 'track-2',
      url: 'http://example.com/track-2.m3u8',
      initialization: { url: 'http://example.com/init-2.mp4' },
    };

    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      fetchedUrls.push(url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });

    const { actor } = makeSourceBufferWithActor();
    const { state, cleanup } = setupLoadSegments(
      {
        preload: 'metadata',
        selectedVideoTrackId: 'track-1',
        presentation: {
          id: 'p1',
          url: 'http://example.com/playlist.m3u8',
          startTime: 0,
          duration: 10,
          selectionSets: [
            { id: 'ss1', type: 'video', switchingSets: [{ id: 'sw1', type: 'video', tracks: [track1, track2] }] },
          ],
        },
      },
      actor,
      'video'
    );

    await vi.waitFor(() => {
      expect(fetchedUrls).toContain('http://example.com/init.mp4');
    });

    state.selectedVideoTrackId.set('track-2');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchedUrls).not.toContain('http://example.com/init-2.mp4');
    // No segment fetches either — we're still in `'metadata-only'`.
    expect(fetchedUrls).not.toContain('http://example.com/s1.m4s');
    expect(fetchedUrls).not.toContain('http://example.com/t1.m4s');

    cleanup();
  });

  it('loads segments at currentTime position when track switches mid-playback', async () => {
    const trackA = makeResolvedVideoTrack([makeSegment('a1', 0), makeSegment('a2', 10)]);
    const trackB = {
      ...makeResolvedVideoTrack([
        makeSegment('b1', 0),
        makeSegment('b2', 10),
        makeSegment('b3', 20),
        makeSegment('b4', 30),
        makeSegment('b5', 40),
        makeSegment('b6', 50),
      ]),
      id: 'track-2',
      initialization: { url: 'http://example.com/init-2.mp4' },
    };
    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((request: Request) => {
      fetchedUrls.push(request.url);
      return Promise.resolve(new Response(new ArrayBuffer(100)));
    });
    const { actor } = makeSourceBufferWithActor(
      [[0, 20]],
      [
        { id: 'a1', startTime: 0, duration: 10, trackId: 'track-1' },
        { id: 'a2', startTime: 10, duration: 10, trackId: 'track-1' },
      ],
      'track-1'
    );
    const { state, loaderActor, send, cleanup } = setupLoadSegments(
      {
        preload: 'auto',
        loadActivated: true,
        currentTime: 25,
        selectedVideoTrackId: 'track-1',
        presentation: {
          id: 'p1',
          url: 'http://example.com/playlist.m3u8',
          startTime: 0,
          duration: 60,
          selectionSets: [
            { id: 'ss1', type: 'video', switchingSets: [{ id: 'sw1', type: 'video', tracks: [trackA, trackB] }] },
          ],
        },
      },
      actor,
      'video'
    );

    await vi.waitFor(() =>
      expect(send).toHaveBeenCalledWith({ type: 'load', track: trackA, range: { start: 25, end: 55 } })
    );
    state.selectedVideoTrackId.set('track-2');
    await vi.waitFor(() => {
      expect(send).toHaveBeenCalledWith({ type: 'load', track: trackB, range: { start: 25, end: 55 } });
      expect(actor.snapshot.get().context.initTrackId).toBe('track-2');
      expect(actor.snapshot.get().context.segments.map(({ id, partial }) => ({ id, partial }))).toEqual(
        ['a1', 'a2', 'b3', 'b4', 'b5', 'b6'].map((id) => ({ id, partial: undefined }))
      );
      expect(loaderActor.snapshot.get().value).toBe('idle');
    });
    expect(fetchedUrls).toEqual([
      'http://example.com/init-2.mp4',
      'http://example.com/b3.m4s',
      'http://example.com/b4.m4s',
      'http://example.com/b5.m4s',
      'http://example.com/b6.m4s',
    ]);

    cleanup();
  });

  it('does not re-dispatch on currentTime ticks within the same segment', async () => {
    // 5 segments of 10s — full-range with `loadActivated` true. After initial
    // dispatch fetches the buffer window, ticking currentTime within segment 0
    // (boundary stays at 0) should not produce new fetches.
    const segments = [
      makeSegment('s1', 0, 10),
      makeSegment('s2', 10, 10),
      makeSegment('s3', 20, 10),
      makeSegment('s4', 30, 10),
      makeSegment('s5', 40, 10),
    ];

    const fetchedUrls: string[] = [];
    let heldSignal: AbortSignal | undefined;
    let release: () => void = () => {};

    globalThis.fetch = vi.fn().mockImplementation((request: Request) => {
      fetchedUrls.push(request.url);

      if (!request.url.endsWith('/s1.m4s')) return Promise.resolve(new Response(new ArrayBuffer(100)));

      heldSignal = request.signal;
      return new Promise<Response>((resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true });
        release = () => resolve(new Response(new ArrayBuffer(100)));
      });
    });

    const { actor } = makeSourceBufferWithActor();
    const { state, loaderActor, send, cleanup } = setupLoadSegments(
      {
        preload: 'auto',
        loadActivated: true,
        selectedVideoTrackId: 'track-1',
        currentTime: 0,
        presentation: makePresentation(segments),
      },
      actor,
      'video'
    );

    await vi.waitFor(() => {
      expect(fetchedUrls).toContain('http://example.com/init.mp4');
      expect(fetchedUrls).toContain('http://example.com/s1.m4s');
    });

    const assignments = send.mock.calls.length;

    for (const time of [1, 2, 3, 5, 8]) {
      state.currentTime.set(time);
      // The real dispatcher flushes its boundary computed on a microtask.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(send).toHaveBeenCalledTimes(assignments);
      expect(heldSignal!.aborted).toBe(false);
      expect(fetchedUrls.filter((url) => url.endsWith('/s1.m4s'))).toHaveLength(1);
    }

    release();
    await vi.waitFor(() => {
      expect(actor.snapshot.get().context.segments.map(({ id, partial }) => ({ id, partial }))).toEqual([
        { id: 's1', partial: undefined },
        { id: 's2', partial: undefined },
        { id: 's3', partial: undefined },
      ]);
      expect(actor.snapshot.get().value).toBe('idle');
      expect(loaderActor.snapshot.get().value).toBe('idle');
    });

    cleanup();
  });
});

// ---------------------------------------------------------------------------
// loadingSuspended — observed policy 'dormant' gate (uniform across variants)
// ---------------------------------------------------------------------------

describe('loadVideoSegments', () => {
  function makePresentation(segments: Segment[]) {
    return {
      id: 'p1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      duration: segments.reduce((acc, s) => acc + s.duration, 0),
      selectionSets: [
        {
          id: 'ss1',
          type: 'video' as const,
          switchingSets: [{ id: 'sw1', type: 'video' as const, tracks: [makeResolvedVideoTrack(segments)] }],
        },
      ],
    };
  }

  it('goes dormant while suspended, even with preload="auto"', async () => {
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const state = makeState({
      preload: 'auto',
      loadingSuspended: true,
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state, context });

    // Give the (dormant) dispatcher ample time to prove it stays quiet.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(send).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('parks while suspended and re-dispatches when the policy lifts', async () => {
    // Parking the dispatcher is a policy 'dormant', not a distinct state:
    // no stop message is sent — already-queued loader work drains (v/a
    // actors are torn down by sourceclose moments later anyway; text
    // fetches are small and bounded).
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const state = makeState({
      preload: 'auto',
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state, context });

    // preload:'auto' → 'full-range' → an initial load dispatch.
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));
    send.mockClear();

    state.loadingSuspended.set(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(send).not.toHaveBeenCalled();

    state.loadingSuspended.set(false);
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));

    reactor.destroy();
  });

  it('treats an absent loadingSuspended slot as never suspended', async () => {
    // No variant declares the key, so compositions without a writer have no
    // slot at all — the dispatcher must behave exactly as if unsuspended.
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const { loadingSuspended: _omitted, ...state } = makeState({
      preload: 'auto',
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state: state as ReturnType<typeof makeState>, context });

    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));

    reactor.destroy();
  });

  // segmentLoadingBlocked — observed DRM key-readiness 'dormant' gate. Same
  // observed-slot contract as loadingSuspended: only DRM-composed variants
  // declare a writer (setupMediaKeys), so every other composition is
  // structurally unchanged.
  it('goes dormant while awaiting MediaKeys, even with preload="auto"', async () => {
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const state = makeState({
      preload: 'auto',
      segmentLoadingBlocked: true,
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state, context });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(send).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('parks while awaiting MediaKeys and re-dispatches once they attach', async () => {
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const state = makeState({
      preload: 'auto',
      segmentLoadingBlocked: true,
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state, context });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(send).not.toHaveBeenCalled();

    state.segmentLoadingBlocked.set(false);
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));

    reactor.destroy();
  });

  // Every dispatch carries a resolved track. `planTasks` reads `track.segments`
  // straight off the message, so a track-less `'load'` throws inside the loader
  // actor and takes segment loading down with it — nothing appends and
  // `readyState` never leaves 0.
  //
  // The state's own precondition is not enough on its own: `monitor` and the
  // per-state effect are separate effects over the same signals, and the
  // scheduler flushes them in dirty-notification order, so the effect can re-fire
  // on the change that should be transitioning the machine out of the state. DRM
  // makes that likely by moving the gate, the selection and the presentation
  // together.
  it('never dispatches a load without a resolved track', async () => {
    const send = vi.fn();
    const fakeLoader = { send } as unknown as SegmentLoaderActor;
    const state = makeState({
      preload: 'auto',
      loadActivated: true,
      segmentLoadingBlocked: true,
      selectedVideoTrackId: 'track-1',
      currentTime: 0,
      presentation: makePresentation([makeSegment('s1', 0, 10)]),
    });
    const context = makeContext({ videoSegmentLoaderActor: fakeLoader });
    const reactor = loadVideoSegments.setup({ state, context });

    state.segmentLoadingBlocked.set(false);
    await vi.waitFor(() => expect(send).toHaveBeenCalled());

    // The shapes that un-resolve a selection: the id going away, and the
    // presentation being replaced by one that no longer carries it.
    state.selectedVideoTrackId.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 20));
    state.selectedVideoTrackId.set('track-1');
    state.presentation.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 20));

    for (const [message] of send.mock.calls) {
      expect(message.track).toBeDefined();
    }

    reactor.destroy();
  });
});
