import { describe, expect, it, vi } from 'vite-plus/test';

import { createSegmentShare } from '../segment-share';

const bytes = (n: number) => new Uint8Array([n]);

describe('createSegmentShare', () => {
  it('hands an in-flight publish to a taker without a second fetch', async () => {
    const share = createSegmentShare();
    let resolve!: (value: Uint8Array) => void;

    share.publish('a', new Promise((r) => (resolve = r)));

    const taken = share.take('a', 0);

    resolve(bytes(1));
    await expect(taken).resolves.toEqual(bytes(1));
  });

  it('waits for a publish that arrives within the window', async () => {
    const share = createSegmentShare();
    const taken = share.take('a', 50);

    share.publish('a', Promise.resolve(bytes(2)));
    await expect(taken).resolves.toEqual(bytes(2));
  });

  it('gives up when nothing is published in time', async () => {
    vi.useFakeTimers();

    try {
      const share = createSegmentShare();
      const taken = share.take('a', 20);

      await vi.advanceTimersByTimeAsync(25);
      await expect(taken).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not wait for a key that was already published and taken', async () => {
    const share = createSegmentShare();

    share.publish('a', Promise.resolve(bytes(3)));
    await share.take('a', 0);

    const start = performance.now();

    await expect(share.take('a', 1000)).resolves.toBeUndefined();
    expect(performance.now() - start).toBeLessThan(100);
    expect(share.published('a')).toBe(true);
  });

  it('withdraws a failed publish', async () => {
    const share = createSegmentShare();
    const failed = Promise.reject(new Error('aborted'));

    failed.catch(() => {});
    share.publish('a', failed);
    await expect(share.take('a', 0)).resolves.toBeUndefined();
  });

  it('keeps only the most recent untaken entries', async () => {
    const share = createSegmentShare({ keep: 1 });

    share.publish('a', Promise.resolve(bytes(1)));
    share.publish('b', Promise.resolve(bytes(2)));
    await expect(share.take('a', 0)).resolves.toBeUndefined();
    await expect(share.take('b', 0)).resolves.toEqual(bytes(2));
  });
});
