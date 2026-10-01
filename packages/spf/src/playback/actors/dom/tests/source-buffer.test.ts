import { describe, expect, it, vi } from 'vite-plus/test';

import { effect } from '../../../../core/signals/effect';
import { createSourceBufferActor } from '../source-buffer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal SourceBuffer mock.
 *
 * Pass `appendRanges` to simulate realistic buffered state: each entry is added to `buffered` in sequence as
 * `appendBuffer` is called. `remove()` clips the ranges to match what a real SourceBuffer would report, enabling the
 * midpoint-based segment model logic in removeTask to be tested correctly.
 */
function makeSourceBuffer(appendRanges: Array<[number, number]> = []): SourceBuffer {
  const listeners: Record<string, EventListener[]> = {};
  let appendIndex = 0;
  let ranges: Array<[number, number]> = [];

  const clipRanges = (start: number, end: number) => {
    const next: Array<[number, number]> = [];

    for (const [s, e] of ranges) {
      if (e <= start || s >= end) {
        next.push([s, e]);
      } else {
        if (s < start) next.push([s, start]);

        if (e > end) next.push([end, e]);
      }
    }

    ranges = next;
  };

  return {
    get buffered() {
      return {
        get length() {
          return ranges.length;
        },
        start: (i: number) => ranges[i]![0],
        end: (i: number) => ranges[i]![1],
      } as TimeRanges;
    },
    updating: false,
    appendBuffer: vi.fn(() => {
      const range = appendRanges[appendIndex++];

      if (range) ranges.push(range);

      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) {
          listener(new Event('updateend'));
        }
      }, 0);
    }),
    remove: vi.fn((start: number, end: number) => {
      clipRanges(start, end);
      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) {
          listener(new Event('updateend'));
        }
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

function makeControlledSourceBuffer() {
  const target = Object.assign(new EventTarget(), {
    updating: false,
    buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
    abort: vi.fn(),
  });
  const sourceBuffer = Object.assign(target, {
    appendBuffer: vi.fn(() => {
      if (target.updating) throw new DOMException('Buffer is updating', 'InvalidStateError');

      target.updating = true;
    }),
  }) as unknown as SourceBuffer;
  const finishUpdating = () => {
    target.updating = false;
    target.dispatchEvent(new Event('updateend'));
  };

  return { sourceBuffer, finishUpdating };
}

describe('createSourceBufferActor', () => {
  // ---------------------------------------------------------------------------
  // State guard — messages rejected when not idle
  // ---------------------------------------------------------------------------

  it('silently drops send() when actor is updating', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    // state transitions to 'updating' synchronously, so the second send() in
    // the same tick sees 'updating' and is dropped.
    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } });
    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-2' } });

    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
    expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1);
    expect(actor.snapshot.get().context.initTrackId).toBe('track-1');

    actor.destroy();
  });

  it('accepts send() again once idle', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-2' } });
    await vi.waitFor(() => expect(actor.snapshot.get().context.initTrackId).toBe('track-2'));

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // Batch — individual tasks, context threading
  // ---------------------------------------------------------------------------

  it('batch message executes all messages in order as individual tasks', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);
    const init = new Uint8Array([1, 2]).buffer;
    const media = new Uint8Array([3, 4, 5]).buffer;

    try {
      actor.send({
        type: 'batch',
        messages: [
          { type: 'append-init', data: init, meta: { trackId: 'track-1' } },
          { type: 'append-segment', data: media, meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' } },
        ],
      });
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(
        vi.mocked(sourceBuffer.appendBuffer).mock.calls.map(([data]) => [...new Uint8Array(data as ArrayBuffer)])
      ).toEqual([[1, 2]]);

      finishUpdating();
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(2));
      expect(
        vi.mocked(sourceBuffer.appendBuffer).mock.calls.map(([data]) => [...new Uint8Array(data as ArrayBuffer)])
      ).toEqual([
        [1, 2],
        [3, 4, 5],
      ]);

      finishUpdating();
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
      expect(actor.snapshot.get().context.initTrackId).toBe('track-1');
      expect(actor.snapshot.get().context.segments.map((segment) => segment.id)).toEqual(['s1']);
    } finally {
      actor.destroy();
    }
  });

  it('batch message threads context between tasks so overlap detection works', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    // Two segments at the same time range — the second should replace the first
    actor.send({
      type: 'batch',
      messages: [
        {
          type: 'append-segment',
          data: new ArrayBuffer(8),
          meta: { id: 's1-low', startTime: 0, duration: 10, trackId: 'track-low' },
        },
        {
          type: 'append-segment',
          data: new ArrayBuffer(8),
          meta: { id: 's1-high', startTime: 0, duration: 10, trackId: 'track-high' },
        },
      ],
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    const ids = actor.snapshot.get().context.segments.map((s) => s.id);

    expect(ids).not.toContain('s1-low');
    expect(ids).toContain('s1-high');
    expect(actor.snapshot.get().context.segments).toHaveLength(1);

    actor.destroy();
  });

  it('batch message status stays updating until after last task completes', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);
    const stateValues: string[] = [];
    const cleanup = effect(() => {
      stateValues.push(actor.snapshot.get().value);
    });

    try {
      actor.send({
        type: 'batch',
        messages: [
          { type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } },
          {
            type: 'append-segment',
            data: new ArrayBuffer(8),
            meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
          },
        ],
      });
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1));
      expect(actor.snapshot.get().value).toBe('updating');

      finishUpdating();
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(2));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(actor.snapshot.get().context.initTrackId).toBe('track-1');
      expect(actor.snapshot.get().context.segments).toEqual([]);
      expect(actor.snapshot.get().value).toBe('updating');
      expect(stateValues.slice(1)).not.toContain('idle');

      finishUpdating();
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
      expect(actor.snapshot.get().context.segments.map((segment) => segment.id)).toEqual(['s1']);
    } finally {
      cleanup();
      actor.destroy();
    }
  });

  // ---------------------------------------------------------------------------
  // Abort: before start
  // ---------------------------------------------------------------------------

  it('cancel during batch skips tasks not yet started', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    // Intercept appendBuffer to send cancel after the first task starts,
    // before the second task has a chance to run.
    const appendMock = vi.mocked(sourceBuffer.appendBuffer);
    const origImpl = appendMock.getMockImplementation();
    let firstCall = true;

    appendMock.mockImplementation((data: BufferSource) => {
      if (firstCall) {
        firstCall = false;
        actor.send({ type: 'cancel' });
      }

      return origImpl?.(data);
    });

    actor.send({
      type: 'batch',
      messages: [
        { type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } },
        {
          type: 'append-segment',
          data: new ArrayBuffer(8),
          meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
        },
      ],
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1);

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // append-init
  // ---------------------------------------------------------------------------

  it('sets initTrackId in context and transitions back to idle after append-init', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    expect(actor.snapshot.get().context.initTrackId).toBe('track-1');

    actor.destroy();
  });

  it('captures initTrackLanguage from append-init meta for downstream cross-rendition flush detection', async () => {
    // Multi-language-audio Tier 2 prerequisite: the segment-loader's
    // planTasks compares `actorCtx.initTrackLanguage` against the
    // newly-selected track's language to decide whether to flush the
    // ahead-buffer on track switch. The actor captures language alongside
    // trackId from the append-init meta.
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'audio-en', language: 'en' } });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    expect(actor.snapshot.get().context.initTrackId).toBe('audio-en');
    expect(actor.snapshot.get().context.initTrackLanguage).toBe('en');

    actor.destroy();
  });

  it('leaves initTrackLanguage undefined when append-init meta omits language (video)', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'audio-en', language: 'en' } });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
    expect(actor.snapshot.get().context.initTrackLanguage).toBe('en');

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'video-1' } });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    expect(actor.snapshot.get().context.initTrackId).toBe('video-1');
    expect(actor.snapshot.get().context.initTrackLanguage).toBeUndefined();

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // append-segment
  // ---------------------------------------------------------------------------

  it('adds entry to context.segments and transitions back to idle after append-segment', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({
      type: 'append-segment',
      data: new ArrayBuffer(8),
      meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    expect(actor.snapshot.get().context.segments).toHaveLength(1);
    expect(actor.snapshot.get().context.segments[0]).toMatchObject({
      id: 's1',
      startTime: 0,
      duration: 10,
      trackId: 'track-1',
    });
    expect(actor.snapshot.get().value).toBe('idle');

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // append-segment: quality replacement
  // ---------------------------------------------------------------------------

  it('removes overlapping segment from context on quality replacement', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({
      type: 'append-segment',
      data: new ArrayBuffer(8),
      meta: { id: 's1-low', startTime: 0, duration: 10, trackId: 'track-low' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    actor.send({
      type: 'append-segment',
      data: new ArrayBuffer(8),
      meta: { id: 's1-high', startTime: 0, duration: 10, trackId: 'track-high' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    const ids = actor.snapshot.get().context.segments.map((s) => s.id);

    expect(ids).not.toContain('s1-low');
    expect(ids).toContain('s1-high');
    expect(actor.snapshot.get().context.segments).toHaveLength(1);

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------

  it.each([
    { end: 20, ids: ['s3'], ranges: [{ start: 20, end: 30 }] },
    {
      end: 4,
      ids: ['s1', 's2', 's3'],
      ranges: [
        { start: 4, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 },
      ],
    },
    {
      end: 6,
      ids: ['s2', 's3'],
      ranges: [
        { start: 6, end: 10 },
        { start: 10, end: 20 },
        { start: 20, end: 30 },
      ],
    },
  ])(
    'removes segments whose midpoint falls outside the post-flush buffered ranges (end=$end)',
    async ({ end, ids, ranges }) => {
      // Provide append ranges so the mock can simulate realistic buffered state.
      const sourceBuffer = makeSourceBuffer([
        [0, 10],
        [10, 20],
        [20, 30],
      ]);
      const actor = createSourceBufferActor(sourceBuffer);

      actor.send({
        type: 'batch',
        messages: [
          {
            type: 'append-segment',
            data: new ArrayBuffer(8),
            meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
          },
          {
            type: 'append-segment',
            data: new ArrayBuffer(8),
            meta: { id: 's2', startTime: 10, duration: 10, trackId: 'track-1' },
          },
          {
            type: 'append-segment',
            data: new ArrayBuffer(8),
            meta: { id: 's3', startTime: 20, duration: 10, trackId: 'track-1' },
          },
        ],
      });
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

      actor.send({ type: 'remove', start: 0, end });
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

      expect(sourceBuffer.remove).toHaveBeenCalledWith(0, end);
      expect(actor.snapshot.get().context.segments.map((segment) => segment.id)).toEqual(ids);
      expect(actor.snapshot.get().context.bufferedRanges).toEqual(ranges);

      actor.destroy();
    }
  );

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  it('transitions to "updating" during send and back to "idle" after', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    try {
      actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } });
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledOnce());
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(actor.snapshot.get().value).toBe('updating');
      expect(actor.snapshot.get().context.initTrackId).toBeUndefined();

      finishUpdating();
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
      expect(actor.snapshot.get().context.initTrackId).toBe('track-1');
    } finally {
      actor.destroy();
    }
  });

  // ---------------------------------------------------------------------------
  // subscribe
  // ---------------------------------------------------------------------------

  it('snapshot.get() returns the current snapshot', () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    expect(actor.snapshot.get()).toMatchObject({ value: 'idle', context: { segments: [], bufferedRanges: [] } });

    actor.destroy();
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Partial segment state — streaming AsyncIterable appends
  // ---------------------------------------------------------------------------

  it('does not emit a partial snapshot for ArrayBuffer appends', async () => {
    const sourceBuffer = makeSourceBuffer([[0, 10]]);
    const actor = createSourceBufferActor(sourceBuffer);

    const snapshots: ReturnType<typeof actor.snapshot.get>[] = [];
    const cleanup = effect(() => {
      snapshots.push(actor.snapshot.get());
    });

    actor.send({
      type: 'append-segment',
      data: new ArrayBuffer(8),
      meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
    cleanup();

    const hadPartial = snapshots.some((s) => s.context.segments.some((seg) => seg.partial));

    expect(hadPartial).toBe(false);

    actor.destroy();
  });

  it('emits a partial:true snapshot before completing a streaming append', async () => {
    const sourceBuffer = makeSourceBuffer([[0, 10]]);
    const actor = createSourceBufferActor(sourceBuffer);

    const snapshots: ReturnType<typeof actor.snapshot.get>[] = [];
    const cleanup = effect(() => {
      const s = actor.snapshot.get();

      snapshots.push({ ...s, context: { ...s.context, segments: [...s.context.segments] } });
    });

    async function* twoChunks() {
      yield new Uint8Array(4);
      yield new Uint8Array(4);
    }

    actor.send({
      type: 'append-segment',
      data: twoChunks(),
      meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
    cleanup();

    const partialSnapshot = snapshots.find((s) =>
      s.context.segments.some((seg) => seg.id === 's1' && seg.partial === true)
    );

    expect(partialSnapshot).toBeDefined();

    actor.destroy();
  });

  it('clears partial flag on segment after streaming append completes', async () => {
    const sourceBuffer = makeSourceBuffer([[0, 10]]);
    const actor = createSourceBufferActor(sourceBuffer);

    async function* oneChunk() {
      yield new Uint8Array(8);
    }

    actor.send({
      type: 'append-segment',
      data: oneChunk(),
      meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
    });
    await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));

    const seg = actor.snapshot.get().context.segments.find((s) => s.id === 's1');

    expect(seg).toBeDefined();
    expect(seg?.partial).toBeUndefined();

    actor.destroy();
  });

  it('leaves partial:true entry in context when streaming append is cancelled', async () => {
    let releaseNext!: () => void;
    let waitingForNext = false;
    const nextChunk = new Promise<void>((resolve) => {
      releaseNext = resolve;
    });
    const resumed = vi.fn();

    async function* pausingStream() {
      yield new Uint8Array(4);
      waitingForNext = true;
      await nextChunk;
      resumed();
      yield new Uint8Array(4);
    }

    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    try {
      actor.send({
        type: 'append-segment',
        data: pausingStream(),
        meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
      });
      await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledOnce());
      finishUpdating();
      await vi.waitFor(() => expect(waitingForNext).toBe(true));
      expect(actor.snapshot.get().value).toBe('updating');
      expect(actor.snapshot.get().context.segments[0]?.partial).toBe(true);

      actor.send({ type: 'cancel' });
      releaseNext();
      await vi.waitFor(() => {
        expect(resumed).toHaveBeenCalledOnce();
        expect(actor.snapshot.get().value).toBe('idle');
      });
      expect(sourceBuffer.appendBuffer).toHaveBeenCalledOnce();
      expect(actor.snapshot.get().context.segments).toEqual([
        { id: 's1', startTime: 0, duration: 10, trackId: 'track-1', partial: true },
      ]);
    } finally {
      releaseNext();
      actor.destroy();
    }
  });

  it('replaces a partial:true entry when the same segment is fully re-appended', async () => {
    const sourceBuffer = makeSourceBuffer([[0, 10]]);
    const actor = createSourceBufferActor(sourceBuffer);

    // First: put a partial segment in context via initialContext shortcut
    const actorWithPartial = createSourceBufferActor(sourceBuffer, {
      segments: [{ id: 's1', startTime: 0, duration: 10, trackId: 'track-1', partial: true }],
    });

    // Now fully append the same segment (ArrayBuffer path — atomic, no partial)
    actorWithPartial.send({
      type: 'append-segment',
      data: new ArrayBuffer(8),
      meta: { id: 's1', startTime: 0, duration: 10, trackId: 'track-1' },
    });
    await vi.waitFor(() => expect(actorWithPartial.snapshot.get().value).toBe('idle'));

    const seg = actorWithPartial.snapshot.get().context.segments.find((s) => s.id === 's1');

    expect(seg).toBeDefined();
    expect(seg?.partial).toBeUndefined();

    actorWithPartial.destroy();
    actor.destroy();
  });

  it('destroy() transitions actor to destroyed and silently drops subsequent sends', async () => {
    const sourceBuffer = makeSourceBuffer();
    const actor = createSourceBufferActor(sourceBuffer);

    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-1' } });

    await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1));

    actor.destroy();

    expect(actor.snapshot.get().value).toBe('destroyed');

    // After destroy, send() is silently dropped — state stays destroyed
    actor.send({ type: 'append-init', data: new ArrayBuffer(4), meta: { trackId: 'track-2' } });
    expect(actor.snapshot.get().value).toBe('destroyed');
  });
});
