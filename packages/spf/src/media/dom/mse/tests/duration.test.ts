import { describe, expect, it, vi } from 'vite-plus/test';

import type { Presentation } from '../../../types';
import { getMaxBufferedEnd, getMinBufferedEnd, shouldUpdateDuration, waitForSourceBuffersReady } from '../duration';

function makeUpdatingSourceBuffer() {
  const updateEndListeners: Array<() => void> = [];

  const buffer = {
    updating: true,
    buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
    addEventListener: (_event: string, handler: () => void, options?: { once?: boolean; signal?: AbortSignal }) => {
      const wrapped = () => {
        if (options?.signal?.aborted) return;

        handler();
      };

      updateEndListeners.push(wrapped);

      if (options?.signal) {
        options.signal.addEventListener(
          'abort',
          () => {
            const idx = updateEndListeners.indexOf(wrapped);

            if (idx >= 0) updateEndListeners.splice(idx, 1);
          },
          { once: true }
        );
      }
    },
    removeEventListener: vi.fn(),
  } as unknown as SourceBuffer;

  const finishUpdating = () => {
    (buffer as unknown as { updating: boolean }).updating = false;

    for (const h of updateEndListeners.slice()) h();
  };

  return { buffer, finishUpdating };
}

const openMs = { readyState: 'open' } as MediaSource;

describe('shouldUpdateDuration', () => {
  it('returns true when the basics + a valid positive duration are present', () => {
    expect(shouldUpdateDuration({ duration: 60 } as Presentation, openMs)).toBe(true);
  });

  it.each([
    ['mediaSource', { duration: 60 } as Presentation, undefined],
    ['presentation', undefined, openMs],
    ['presentation.duration', {} as Presentation, openMs],
  ])('returns false when %s is missing', (_name, presentation, mediaSource) => {
    expect(shouldUpdateDuration(presentation, mediaSource)).toBe(false);
  });

  it('returns false when duration is NaN', () => {
    expect(shouldUpdateDuration({ duration: NaN } as Presentation, openMs)).toBe(false);
  });

  it('returns true when duration is Infinity (live)', () => {
    // Per the MSE spec, `mediaSource.duration = Number.POSITIVE_INFINITY` is
    // how live playback signals an indefinite duration.
    expect(shouldUpdateDuration({ duration: Number.POSITIVE_INFINITY } as Presentation, openMs)).toBe(true);
  });

  it('returns false when duration is 0', () => {
    expect(shouldUpdateDuration({ duration: 0 } as Presentation, openMs)).toBe(false);
  });

  it('returns false when duration is negative', () => {
    expect(shouldUpdateDuration({ duration: -10 } as Presentation, openMs)).toBe(false);
  });

  it("returns true regardless of MediaSource readyState — readyState is the caller's concern", () => {
    // The predicate is purely signal-driven preconditions. MediaSource
    // readyState is a non-reactive DOM property the caller resolves at
    // write time (e.g., via `waitForMediaSourceOpen` inside an entry).
    const closedMs = { readyState: 'closed' } as MediaSource;

    expect(shouldUpdateDuration({ duration: 60 } as Presentation, closedMs)).toBe(true);
  });

  it("returns true even when mediaSource.duration is already set (idempotency is the caller's concern)", () => {
    // Same rationale as the readyState case above — non-reactive DOM
    // properties stay out of the signal-driven predicate.
    const ms = { readyState: 'open', duration: 60 } as MediaSource;

    expect(shouldUpdateDuration({ duration: 60 } as Presentation, ms)).toBe(true);
  });
});

describe('getMaxBufferedEnd', () => {
  it('returns 0 when the buffer list is empty', () => {
    expect(getMaxBufferedEnd([])).toBe(0);
  });

  it('returns the highest end across all buffers in the list', () => {
    const video = {
      buffered: { length: 1, start: () => 0, end: () => 40 } as TimeRanges,
    } as unknown as SourceBuffer;
    const audio = {
      buffered: { length: 1, start: () => 0, end: () => 60 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMaxBufferedEnd([video, audio])).toBe(60);
  });

  it('ignores buffers with zero-length buffered ranges', () => {
    const empty = {
      buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
    } as unknown as SourceBuffer;
    const buffered = {
      buffered: { length: 1, start: () => 0, end: () => 30 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMaxBufferedEnd([empty, buffered])).toBe(30);
  });

  it('works against a single-buffer audio-only configuration', () => {
    const audio = {
      buffered: { length: 1, start: () => 0, end: () => 25 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMaxBufferedEnd([audio])).toBe(25);
  });
});

describe('getMinBufferedEnd', () => {
  it('returns 0 when the buffer list is empty', () => {
    expect(getMinBufferedEnd([])).toBe(0);
  });

  it('returns the min last-range end across buffers (the reachable/intersection end)', () => {
    // Skewed A/V: video buffered slightly past audio; reachable end is the audio (min).
    const video = {
      buffered: { length: 1, start: () => 0, end: () => 600.044 } as TimeRanges,
    } as unknown as SourceBuffer;
    const audio = {
      buffered: { length: 1, start: () => 0, end: () => 600.0 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMinBufferedEnd([video, audio])).toBe(600.0);
  });

  it('skips buffers with no ranges (min across the buffers that have ranges)', () => {
    const empty = {
      buffered: { length: 0, start: () => 0, end: () => 0 } as TimeRanges,
    } as unknown as SourceBuffer;
    const buffered = {
      buffered: { length: 1, start: () => 0, end: () => 30 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMinBufferedEnd([empty, buffered])).toBe(30);
  });

  it('uses the last range end when a buffer has multiple (gapped) ranges', () => {
    const gapped = {
      buffered: { length: 2, start: (i: number) => (i === 0 ? 0 : 12), end: (i: number) => (i === 0 ? 10 : 30) },
    } as unknown as SourceBuffer;

    expect(getMinBufferedEnd([gapped])).toBe(30);
  });

  it('works against a single-buffer audio-only configuration', () => {
    const audio = {
      buffered: { length: 1, start: () => 0, end: () => 42 } as TimeRanges,
    } as unknown as SourceBuffer;

    expect(getMinBufferedEnd([audio])).toBe(42);
  });
});

describe('waitForSourceBuffersReady', () => {
  it('resolves immediately when the buffer list is empty', async () => {
    const controller = new AbortController();

    await waitForSourceBuffersReady([], controller.signal);
  });

  it('resolves on abort even if buffers never finish updating', async () => {
    const { buffer: video } = makeUpdatingSourceBuffer();
    const controller = new AbortController();

    const ready = waitForSourceBuffersReady([video], controller.signal);

    controller.abort();

    await ready;
  });

  it('returns an already-resolved promise when signal is pre-aborted', async () => {
    const { buffer: video } = makeUpdatingSourceBuffer();
    const controller = new AbortController();

    controller.abort();

    await waitForSourceBuffersReady([video], controller.signal);
  });
});
