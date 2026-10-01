import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import type { AudioTrack, Segment, VideoTrack } from '../../../../media/types';
import { fetchStream } from '../../../../network/fetch';
import { createSegmentLoaderActor } from '../segment-loader';
import { createSourceBufferActor } from '../source-buffer';
import type {
  SourceBufferActor,
  SourceBufferActorContext,
  SourceBufferActorState,
  SourceBufferMessage,
} from '../source-buffer';
import { makeControllableFetch, makeSourceBuffer } from './segment-loader-fixtures';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

interface MockSourceBufferActor {
  snapshot: ReturnType<typeof signal<{ value: SourceBufferActorState; context: SourceBufferActorContext }>>;
  send: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

function createMockBufferActor(ctx: Partial<SourceBufferActorContext> = {}): MockSourceBufferActor {
  return {
    snapshot: signal<{ value: SourceBufferActorState; context: SourceBufferActorContext }>({
      value: 'idle', // stay idle so waitForIdle resolves immediately
      context: { segments: [], bufferedRanges: [], initTrackId: undefined, ...ctx },
    }),
    send: vi.fn(),
    destroy: vi.fn(),
  };
}

function makeAudioTrack(id: string, overrides: Partial<AudioTrack> = {}): AudioTrack {
  return {
    type: 'audio',
    id,
    url: `http://example.com/${id}.m3u8`,
    bandwidth: 128_000,
    mimeType: 'audio/mp4',
    codecs: ['mp4a.40.2'],
    groupId: 'audio',
    name: id,
    sampleRate: 48000,
    channels: 2,
    startTime: 0,
    duration: 30,
    initialization: { url: `http://example.com/${id}-init.mp4` },
    segments: [
      { id: `${id}-0`, url: `http://example.com/${id}-0.m4s`, startTime: 0, duration: 6 },
      { id: `${id}-1`, url: `http://example.com/${id}-1.m4s`, startTime: 6, duration: 6 },
      { id: `${id}-2`, url: `http://example.com/${id}-2.m4s`, startTime: 12, duration: 6 },
    ],
    ...overrides,
  };
}

// Mock fetchBytes — returns an empty async iterable; segments effectively
// don't append. We only care about which messages the segment-loader
// dispatches to the source-buffer actor, particularly the `remove` for
// cross-rendition flush.
const mockFetchBytes = vi.fn(async () => {
  return (async function* () {})();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createSegmentLoaderActor', () => {
  it('does NOT emit an explicit remove on cross-rendition switch; relies on MSE overwrite-on-append', async () => {
    // Audio renditions share segment IDs and startTimes. Appending the new
    // track's segments at the same timestamps overwrites the old data in
    // the SourceBuffer — no explicit `remove` task needed, and no audible
    // silence-gap during the swap. planTasks emits only the new-track init
    // + new-track segments inside the (formerly-flushed) range.
    const bufferActor = createMockBufferActor({
      initTrackId: 'audio-en',
      initTrackLanguage: 'en',
      segments: [
        { id: 'audio-en-0', startTime: 0, duration: 6, trackId: 'audio-en' },
        { id: 'audio-en-1', startTime: 6, duration: 6, trackId: 'audio-en' },
        { id: 'audio-en-2', startTime: 12, duration: 6, trackId: 'audio-en' },
      ],
      bufferedRanges: [{ start: 0, end: 18 }],
    });

    const loader = createSegmentLoaderActor(bufferActor as unknown as SourceBufferActor, mockFetchBytes);

    const newTrack = makeAudioTrack('audio-es', { language: 'es' });

    // Playhead at 2s (mid-segment-0). currentSegmentStart = 0.
    loader.send({ type: 'load', track: newTrack, range: { start: 2, end: 20 } });

    // Wait for the loader to schedule its work (init + segments).
    await vi.waitFor(() => {
      const initCalls = bufferActor.send.mock.calls.filter((c) => (c[0] as SourceBufferMessage).type === 'append-init');

      expect(initCalls.length).toBeGreaterThan(0);
    });

    // No cross-rendition remove emitted. Forward / back flushes are
    // computed independently and don't fire here (the buffered range is
    // entirely inside the load window, and no back-buffer threshold is
    // crossed at currentTime=2).
    const removeMsgs = bufferActor.send.mock.calls
      .map((c) => c[0] as SourceBufferMessage)
      .filter((m): m is Extract<SourceBufferMessage, { type: 'remove' }> => m.type === 'remove');

    expect(removeMsgs).toHaveLength(0);

    loader.destroy();
  });

  it('does not dispatch cross-rendition flush when languages match (audio-abr-style switch)', async () => {
    // Same language, different track id (e.g., audio bitrate variant in
    // same language group). planTasks should NOT emit a cross-rendition
    // flush — appending new segments overwrites time-aligned ranges.
    const bufferActor = createMockBufferActor({
      initTrackId: 'audio-en-128k',
      initTrackLanguage: 'en',
      segments: [{ id: 'audio-en-128k-0', startTime: 0, duration: 6, trackId: 'audio-en-128k' }],
      bufferedRanges: [{ start: 0, end: 6 }],
    });

    const loader = createSegmentLoaderActor(bufferActor as unknown as SourceBufferActor, mockFetchBytes);

    const newTrack = makeAudioTrack('audio-en-256k', { language: 'en' });

    loader.send({ type: 'load', track: newTrack, range: { start: 2, end: 20 } });

    await vi.waitFor(() => {
      expect(bufferActor.send.mock.calls.map(([message]) => message.type)).toEqual([
        'append-init',
        'append-segment',
        'append-segment',
      ]);
      expect(loader.snapshot.get().value).toBe('idle');
    });
    const messages = bufferActor.send.mock.calls.map(([message]) => message as SourceBufferMessage);

    expect(messages[0]).toMatchObject({ type: 'append-init', meta: { trackId: 'audio-en-256k', language: 'en' } });
    expect(messages.filter((message) => message.type === 'append-segment').map((message) => message.meta.id)).toEqual([
      'audio-en-256k-1',
      'audio-en-256k-2',
    ]);
    expect(messages.filter((message) => message.type === 'remove')).toEqual([]);

    loader.destroy();
  });

  it('does not dispatch cross-rendition flush on initial load (no prior initTrackId)', async () => {
    // No buffered track yet (initTrackId undefined). First load is the
    // initial setup — should emit append-init but no cross-rendition flush.
    const bufferActor = createMockBufferActor();
    const loader = createSegmentLoaderActor(bufferActor as unknown as SourceBufferActor, mockFetchBytes);

    const track = makeAudioTrack('audio-en', { language: 'en' });

    loader.send({ type: 'load', track, range: { start: 0, end: 20 } });

    await vi.waitFor(() => {
      expect(bufferActor.send.mock.calls.map(([message]) => message.type)).toEqual([
        'append-init',
        'append-segment',
        'append-segment',
        'append-segment',
      ]);
      expect(loader.snapshot.get().value).toBe('idle');
    });
    const messages = bufferActor.send.mock.calls.map(([message]) => message as SourceBufferMessage);

    expect(messages[0]).toMatchObject({ type: 'append-init', meta: { trackId: 'audio-en', language: 'en' } });
    expect(messages.filter((message) => message.type === 'append-segment').map((message) => message.meta.id)).toEqual([
      'audio-en-0',
      'audio-en-1',
      'audio-en-2',
    ]);
    expect(messages.filter((message) => message.type === 'remove')).toEqual([]);

    loader.destroy();
  });

  it('schedules new-track segments inside the cross-rendition stale range (including current segment)', async () => {
    // Cross-rendition audio renditions share segment IDs and startTimes
    // (e.g., every variant has its own `segment-1` at startTime=6).
    // planTasks treats the range from `currentSegmentStart` forward as
    // stale (will be overwritten by new appends via MSE
    // overwrite-on-append) and re-schedules every new-track segment in
    // that range — including the segment containing the playhead. The
    // pre-flush `bufferedSegments` snapshot would otherwise mark those
    // same-startTime new-track segments "already buffered" and skip them.
    const bufferActor = createMockBufferActor({
      initTrackId: 'audio-en',
      initTrackLanguage: 'en',
      // Buffered seg-0 (0-6), seg-1 (6-12), seg-2 (12-18).
      segments: [
        { id: 'audio-en-0', startTime: 0, duration: 6, trackId: 'audio-en' },
        { id: 'audio-en-1', startTime: 6, duration: 6, trackId: 'audio-en' },
        { id: 'audio-en-2', startTime: 12, duration: 6, trackId: 'audio-en' },
      ],
      bufferedRanges: [{ start: 0, end: 18 }],
    });

    const loader = createSegmentLoaderActor(bufferActor as unknown as SourceBufferActor, mockFetchBytes);

    const newTrack = makeAudioTrack('audio-es', { language: 'es' });

    // Playhead at 2s (mid-seg-0). currentSegmentStart = 0 → stale range
    // is [0, Infinity). All three segments overlap and must be re-scheduled.
    loader.send({ type: 'load', track: newTrack, range: { start: 2, end: 20 } });

    await vi.waitFor(() => {
      const appendSegmentCalls = bufferActor.send.mock.calls.filter(
        (c) => (c[0] as SourceBufferMessage).type === 'append-segment'
      );

      expect(appendSegmentCalls.length).toBeGreaterThan(0);
    });

    const segmentStartTimes = bufferActor.send.mock.calls
      .map((c) => c[0] as SourceBufferMessage)
      .filter((m): m is Extract<SourceBufferMessage, { type: 'append-segment' }> => m.type === 'append-segment')
      .map((m) => m.meta.startTime);

    // The current segment (startTime 0, containing playhead at 2) is
    // re-scheduled so the audible switch happens within milliseconds
    // of the new-track segment landing rather than waiting for the next
    // boundary.
    expect(segmentStartTimes).toContain(0);
    expect(segmentStartTimes).toContain(6);
    expect(segmentStartTimes).toContain(12);

    loader.destroy();
  });

  it('captures language into append-init meta for downstream tracking', async () => {
    // Verify that planTasks includes `language` in the append-init meta
    // so the SourceBufferActor can capture initTrackLanguage on commit.
    const bufferActor = createMockBufferActor();
    const loader = createSegmentLoaderActor(bufferActor as unknown as SourceBufferActor, mockFetchBytes);

    const track = makeAudioTrack('audio-es', { language: 'es' });

    loader.send({ type: 'load', track, range: { start: 0, end: 20 } });

    await vi.waitFor(() => {
      const initCall = bufferActor.send.mock.calls.find((c) => (c[0] as SourceBufferMessage).type === 'append-init');

      expect(initCall).toBeDefined();
    });

    const initMsg = bufferActor.send.mock.calls
      .map((c) => c[0] as SourceBufferMessage)
      .find((m): m is Extract<SourceBufferMessage, { type: 'append-init' }> => m.type === 'append-init')!;

    expect(initMsg.meta.trackId).toBe('audio-es');
    expect(initMsg.meta.language).toBe('es');

    loader.destroy();
  });
});

function fetchedRequests() {
  // SAFETY: fetchStream constructs a native Request before reaching this network boundary.
  return vi.mocked(fetch).mock.calls.map(([request]) => request as Request);
}

function makeVideoTrack(id: string, segments: Segment[]): VideoTrack {
  return {
    type: 'video',
    id,
    url: `http://example.com/${id}.m3u8`,
    mimeType: 'video/mp4',
    codecs: ['avc1.42E01E'],
    bandwidth: 1_000_000,
    initialization: { url: `http://example.com/${id}-init.mp4` },
    segments,
    startTime: 0,
    duration: segments.reduce((sum, segment) => sum + segment.duration, 0),
  };
}

function segment(id: string, startTime: number, duration = 10): Segment {
  return { id, url: `http://example.com/${id}.m4s`, startTime, duration };
}

function makeLoaderFixture(
  initialContext: Partial<SourceBufferActorContext> = {},
  startingRanges: Array<[number, number]> = [],
  appendRanges: Array<[number, number] | undefined> = []
) {
  const sourceBuffer = makeSourceBuffer(appendRanges, startingRanges);
  const buffer = createSourceBufferActor(sourceBuffer, initialContext);
  const loader = createSegmentLoaderActor(buffer, fetchStream);

  onTestFinished(() => {
    loader.destroy();
    buffer.destroy();
  });

  return { sourceBuffer, buffer, loader };
}

async function committed({ buffer, loader }: ReturnType<typeof makeLoaderFixture>, trackId: string, ids: string[]) {
  await vi.waitFor(() => {
    expect(buffer.snapshot.get().context.initTrackId).toBe(trackId);
    expect(buffer.snapshot.get().context.segments.map(({ id, partial }) => ({ id, partial }))).toEqual(
      ids.map((id) => ({ id, partial: undefined }))
    );
    expect(buffer.snapshot.get().value).toBe('idle');
    expect(loader.snapshot.get().value).toBe('idle');
  });
}

function seedSegments(segments: Segment[], trackId = 'track-1') {
  return segments.map(({ id, startTime, duration }) => ({ id, startTime, duration, trackId }));
}

function posSegment(trackId: string, index: number, startTime: number, duration: number): Segment {
  return { id: `segment-${index}`, url: `http://example.com/${trackId}/segment-${index}.m4s`, startTime, duration };
}

describe('createSegmentLoaderActor', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(new ArrayBuffer(100)));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('only fetches segments within the buffer window', async () => {
    const track = makeVideoTrack('track-1', [
      segment('s1', 0),
      segment('s2', 10),
      segment('s3', 20),
      segment('s4', 30),
    ]);
    const fixture = makeLoaderFixture();

    fixture.loader.send({ type: 'load', track, range: { start: 0, end: 30 } });

    await committed(fixture, 'track-1', ['s1', 's2', 's3']);
    expect(fetchedRequests().map((request) => request.url)).toEqual([
      'http://example.com/track-1-init.mp4',
      'http://example.com/s1.m4s',
      'http://example.com/s2.m4s',
      'http://example.com/s3.m4s',
    ]);
  });

  it('skips init segment when already loaded for the track', async () => {
    const fixture = makeLoaderFixture({ initTrackId: 'track-1' });

    fixture.loader.send({
      type: 'load',
      track: makeVideoTrack('track-1', [segment('s1', 0)]),
      range: { start: 0, end: 30 },
    });

    await committed(fixture, 'track-1', ['s1']);
    expect(fetchedRequests().map((request) => request.url)).toEqual(['http://example.com/s1.m4s']);
  });

  it('aborts current task and loads seek destination when seek is detected', async () => {
    const track = makeVideoTrack('track-1', [
      segment('s1', 0),
      segment('s2', 10),
      segment('s3', 20),
      segment('s60', 60),
      segment('s70', 70),
      segment('s80', 80),
    ]);
    const network = makeControllableFetch();

    vi.mocked(fetch).mockImplementation(network.fetch);
    const fixture = makeLoaderFixture();

    fixture.loader.send({ type: 'load', track, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain(track.initialization.url));
    network.resolve(track.initialization.url);
    await vi.waitFor(() => expect(network.fetchedUrls).toContain('http://example.com/s1.m4s'));
    const obsolete = network.signals.get('http://example.com/s1.m4s')!;

    fixture.loader.send({ type: 'load', track, range: { start: 60, end: 90 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain('http://example.com/s60.m4s'));
    expect(obsolete.aborted).toBe(true);

    for (const id of ['s60', 's70', 's80']) {
      const url = `http://example.com/${id}.m4s`;

      await vi.waitFor(() => expect(network.fetchedUrls).toContain(url));
      network.resolve(url);
    }

    await committed(fixture, 'track-1', ['s60', 's70', 's80']);
  });

  it('uses only the latest pending state when multiple seeks occur during loading', async () => {
    const track = makeVideoTrack('track-1', [
      segment('s1', 0),
      segment('s30', 30),
      segment('s60', 60),
      segment('s90', 90),
    ]);
    const network = makeControllableFetch();

    vi.mocked(fetch).mockImplementation(network.fetch);
    const fixture = makeLoaderFixture();
    const send = vi.spyOn(fixture.loader, 'send');

    fixture.loader.send({ type: 'load', track, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain(track.initialization.url));

    fixture.loader.send({ type: 'load', track, range: { start: 60, end: 90 } });
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'load', track, range: { start: 60, end: 90 } }));
    fixture.loader.send({ type: 'load', track, range: { start: 90, end: 120 } });
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: 'load', track, range: { start: 90, end: 120 } }));
    expect(network.signals.get(track.initialization.url)!.aborted).toBe(false);
    network.resolve(track.initialization.url);
    await vi.waitFor(() => expect(network.fetchedUrls).toContain('http://example.com/s90.m4s'));
    network.resolve('http://example.com/s90.m4s');

    await committed(fixture, 'track-1', ['s90']);
    expect(network.fetchedUrls).toEqual([track.initialization.url, 'http://example.com/s90.m4s']);
  });

  it('flushes back buffer before loading new segments when currentTime advances', async () => {
    const segments = [
      segment('s1', 0),
      segment('s2', 10),
      segment('s3', 20),
      segment('s4', 30),
      segment('s5', 40),
      segment('s6', 50),
    ];
    const fixture = makeLoaderFixture(
      { initTrackId: 'track-1', segments: seedSegments(segments.slice(0, 4)) },
      [[0, 40]],
      [
        [40, 50],
        [50, 60],
      ]
    );
    const send = vi.spyOn(fixture.buffer, 'send');

    fixture.loader.send({ type: 'load', track: makeVideoTrack('track-1', segments), range: { start: 40, end: 70 } });

    await committed(fixture, 'track-1', ['s3', 's4', 's5', 's6']);
    expect(fixture.sourceBuffer.remove).toHaveBeenCalledWith(0, 20);
    expect(send.mock.calls.map(([message]) => message.type)).toEqual(['remove', 'append-segment', 'append-segment']);
    expect(fixture.buffer.snapshot.get().context.bufferedRanges[0]).toEqual({ start: 20, end: 40 });
  });

  it('does not flush when back buffer is within the keep threshold', async () => {
    const segments = [segment('s1', 0), segment('s2', 10), segment('s3', 20)];
    const fixture = makeLoaderFixture(
      { initTrackId: 'track-1', segments: seedSegments(segments.slice(0, 1)) },
      [[0, 10]],
      [
        [10, 20],
        [20, 30],
      ]
    );

    fixture.loader.send({ type: 'load', track: makeVideoTrack('track-1', segments), range: { start: 10, end: 40 } });

    await committed(fixture, 'track-1', ['s1', 's2', 's3']);
    expect(fixture.sourceBuffer.remove).not.toHaveBeenCalled();
    expect(fixture.buffer.snapshot.get().context.segments[0]).toEqual({
      id: 's1',
      startTime: 0,
      duration: 10,
      trackId: 'track-1',
    });
  });

  it('flushes SourceBuffer content beyond the forward buffer window', async () => {
    const segments = [segment('s1', 0), segment('s2', 10), segment('s3', 20), segment('s4', 30), segment('s5', 40)];
    const fixture = makeLoaderFixture({ initTrackId: 'track-1', segments: seedSegments(segments) }, [[0, 50]]);

    fixture.loader.send({ type: 'load', track: makeVideoTrack('track-1', segments), range: { start: 0, end: 30 } });

    await committed(fixture, 'track-1', ['s1', 's2', 's3']);
    expect(fixture.sourceBuffer.remove).toHaveBeenCalledWith(30, Infinity);
    expect(fixture.buffer.snapshot.get().context.bufferedRanges).toEqual([{ start: 0, end: 30 }]);
  });

  it('sends Range headers for byte-range init and media segments', async () => {
    const track = makeVideoTrack('track-1', [
      { ...segment('s0', 0, 6), url: 'http://example.com/video.mp4', byteRange: { start: 1000, end: 2999 } },
      { ...segment('s1', 6, 6), url: 'http://example.com/video.mp4', byteRange: { start: 3000, end: 4999 } },
    ]);

    track.initialization = { url: 'http://example.com/video.mp4', byteRange: { start: 0, end: 999 } };
    const fixture = makeLoaderFixture();

    fixture.loader.send({ type: 'load', track, range: { start: 0, end: 30 } });

    await committed(fixture, 'track-1', ['s0', 's1']);
    expect(fetchedRequests().map((request) => [request.url, request.headers.get('Range')])).toEqual([
      ['http://example.com/video.mp4', 'bytes=0-999'],
      ['http://example.com/video.mp4', 'bytes=1000-2999'],
      ['http://example.com/video.mp4', 'bytes=3000-4999'],
    ]);
  });

  it('does not send Range header for non-byte-range segments', async () => {
    const fixture = makeLoaderFixture();

    fixture.loader.send({
      type: 'load',
      track: makeVideoTrack('track-1', [segment('s0', 0)]),
      range: { start: 0, end: 30 },
    });

    await committed(fixture, 'track-1', ['s0']);
    expect(fetchedRequests().map((request) => [request.url, request.headers.get('Range')])).toEqual([
      ['http://example.com/track-1-init.mp4', null],
      ['http://example.com/s0.m4s', null],
    ]);
  });

  it('appended data matches the concatenated streaming chunks', async () => {
    vi.mocked(fetch).mockImplementation(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array([1, 2, 3, 4]));
              controller.enqueue(new Uint8Array([5, 6, 7, 8]));
              controller.close();
            },
          })
        )
    );
    const fixture = makeLoaderFixture();

    fixture.loader.send({
      type: 'load',
      track: makeVideoTrack('track-1', [segment('s1', 0)]),
      range: { start: 0, end: 30 },
    });

    await committed(fixture, 'track-1', ['s1']);
    const calls = vi.mocked(fixture.sourceBuffer.appendBuffer).mock.calls;

    expect(calls).toHaveLength(2);

    for (const [data] of calls) {
      // SAFETY: the chunked fetch pipeline emits Uint8Array data for both init and media appends.
      expect(Array.from(data as Uint8Array)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });

  it('does not flush or refetch already-buffered aligned positions on ABR switch', async () => {
    const segments = [segment('segment-0', 0), segment('segment-1', 10)];
    const fixture = makeLoaderFixture({ initTrackId: 'track-a', segments: seedSegments(segments, 'track-a') }, [
      [0, 20],
    ]);

    fixture.loader.send({ type: 'load', track: makeVideoTrack('track-a', segments), range: { start: 5, end: 35 } });
    await committed(fixture, 'track-a', ['segment-0', 'segment-1']);
    fixture.loader.send({ type: 'load', track: makeVideoTrack('track-b', segments), range: { start: 5, end: 35 } });

    await committed(fixture, 'track-b', ['segment-0', 'segment-1']);
    expect(fixture.sourceBuffer.remove).not.toHaveBeenCalled();
    expect(fetchedRequests().map((request) => request.url)).toEqual(['http://example.com/track-b-init.mp4']);
    expect(fixture.buffer.snapshot.get().context.segments.map(({ startTime }) => startTime)).toEqual([0, 10]);
  });

  it('loads the bridging segment when switching to a misaligned rendition (no gap)', async () => {
    const low = makeVideoTrack('low', [posSegment('low', 0, 0, 7.13333), posSegment('low', 1, 7.13333, 8)]);
    const high = makeVideoTrack('high', [
      posSegment('high', 0, 0, 7.98333),
      posSegment('high', 1, 7.98333, 8),
      posSegment('high', 2, 15.98333, 8),
    ]);
    const fixture = makeLoaderFixture(
      { initTrackId: 'low', segments: seedSegments(low.segments, 'low') },
      [[0, 15.13333]],
      [undefined, [7.98333, 15.98333], [15.98333, 23.98333]]
    );

    fixture.loader.send({ type: 'load', track: low, range: { start: 5, end: 35 } });
    await committed(fixture, 'low', ['segment-0', 'segment-1']);
    fixture.loader.send({ type: 'load', track: high, range: { start: 5, end: 35 } });

    await committed(fixture, 'high', ['segment-0', 'segment-1', 'segment-1', 'segment-2']);
    expect(fetchedRequests().map((request) => request.url)).toEqual([
      'http://example.com/high-init.mp4',
      'http://example.com/high/segment-1.m4s',
      'http://example.com/high/segment-2.m4s',
    ]);
  });

  it('loads the leading bridge segment on a shallow-buffer misaligned switch (no gap)', async () => {
    const low = makeVideoTrack('low', [posSegment('low', 0, 0, 7.13333)]);
    const high = makeVideoTrack('high', [
      posSegment('high', 0, 0, 7.98333),
      posSegment('high', 1, 7.98333, 8),
      posSegment('high', 2, 15.98333, 8),
    ]);
    const fixture = makeLoaderFixture(
      { initTrackId: 'low', segments: seedSegments(low.segments, 'low') },
      [[0, 7.13333]],
      [undefined, [0, 7.98333], [7.98333, 15.98333], [15.98333, 23.98333]]
    );

    fixture.loader.send({ type: 'load', track: low, range: { start: 5, end: 35 } });
    await committed(fixture, 'low', ['segment-0']);
    fixture.loader.send({ type: 'load', track: high, range: { start: 5, end: 35 } });

    await committed(fixture, 'high', ['segment-0', 'segment-1', 'segment-2']);
    expect(fetchedRequests().map((request) => request.url)).toContain('http://example.com/high/segment-0.m4s');
    expect(fixture.buffer.snapshot.get().context.segments[0]).toMatchObject({ trackId: 'high', duration: 7.98333 });
  });

  it('loads HIGH bridge when the switch preempts an in-flight same-id LOW segment (misaligned)', async () => {
    const low = {
      ...makeVideoTrack('low', [posSegment('low', 0, 0, 7.13333), posSegment('low', 1, 7.13333, 8)]),
      bandwidth: 582820,
    };
    const high = {
      ...makeVideoTrack('high', [
        posSegment('high', 0, 0, 7.98333),
        posSegment('high', 1, 7.98333, 8),
        posSegment('high', 2, 15.98333, 8),
      ]),
      bandwidth: 9873268,
    };
    const network = makeControllableFetch();

    vi.mocked(fetch).mockImplementation(network.fetch);
    const fixture = makeLoaderFixture(
      { initTrackId: 'low' },
      [],
      [undefined, [0, 7.98333], [7.98333, 15.98333], [15.98333, 23.98333]]
    );

    fixture.loader.send({ type: 'load', track: low, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain('http://example.com/low/segment-0.m4s'));

    fixture.loader.send({ type: 'load', track: high, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain(high.initialization.url));
    expect(network.signals.get('http://example.com/low/segment-0.m4s')!.aborted).toBe(true);
    network.resolve(high.initialization.url);

    for (const index of [0, 1, 2]) {
      const url = `http://example.com/high/segment-${index}.m4s`;

      await vi.waitFor(() => expect(network.fetchedUrls).toContain(url));
      network.resolve(url);
    }

    await committed(fixture, 'high', ['segment-0', 'segment-1', 'segment-2']);
    expect(fixture.buffer.snapshot.get().context.segments.every(({ trackId }) => trackId === 'high')).toBe(true);
  });

  it('preempts in-flight fetch when track switches; loads new track init', async () => {
    const a = makeVideoTrack('track-a', [segment('a1', 0), segment('a2', 10)]);
    const b = makeVideoTrack('track-b', [segment('b1', 0), segment('b2', 10)]);
    const network = makeControllableFetch();

    vi.mocked(fetch).mockImplementation(network.fetch);
    const fixture = makeLoaderFixture();

    fixture.loader.send({ type: 'load', track: a, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain(a.initialization.url));

    fixture.loader.send({ type: 'load', track: b, range: { start: 0, end: 30 } });
    await vi.waitFor(() => expect(network.fetchedUrls).toContain(b.initialization.url));
    expect(network.signals.get(a.initialization.url)!.aborted).toBe(true);
    network.resolve(b.initialization.url);

    for (const id of ['b1', 'b2']) {
      const url = `http://example.com/${id}.m4s`;

      await vi.waitFor(() => expect(network.fetchedUrls).toContain(url));
      network.resolve(url);
    }

    await committed(fixture, 'track-b', ['b1', 'b2']);
  });

  it('does NOT flush on first init load (no prior track)', async () => {
    const fixture = makeLoaderFixture();

    fixture.loader.send({
      type: 'load',
      track: makeVideoTrack('track-a', [segment('a1', 0)]),
      range: { start: 0, end: 30 },
    });

    await committed(fixture, 'track-a', ['a1']);
    expect(fixture.sourceBuffer.appendBuffer).toHaveBeenCalledTimes(2);
    expect(fixture.sourceBuffer.remove).not.toHaveBeenCalled();
  });
});
