import { describe, expect, it } from 'vite-plus/test';

import { ChunkedStreamIterable } from '../chunked-stream-iterable';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStream(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  let i = 0;

  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(chunks[i++]!);
      } else {
        controller.close();
      }
    },
  });
}

function bytes(size: number, fill = 1): Uint8Array {
  return new Uint8Array(size).fill(fill);
}

async function collect(iterable: AsyncIterable<Uint8Array>): Promise<Uint8Array[]> {
  const result: Uint8Array[] = [];

  for await (const chunk of iterable) {
    result.push(chunk);
  }

  return result;
}

function totalBytes(chunks: Uint8Array[]): number {
  return chunks.reduce((sum, c) => sum + c.length, 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChunkedStreamIterable', () => {
  it.each([
    { threshold: 64, options: { minChunkSize: 64 } },
    { threshold: 131_072, options: undefined },
  ])('yields a single chunk when it meets minChunkSize exactly: $threshold', async ({ threshold, options }) => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
    });
    const iterator = new ChunkedStreamIterable(stream, options)[Symbol.asyncIterator]();
    let output: IteratorResult<Uint8Array> | undefined;
    const next = iterator.next().then((value) => {
      output = value;
      return value;
    });

    try {
      controller.enqueue(bytes(threshold - 1));
      // A macrotask lets the reader consume input without closing the stream.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(output).toBeUndefined();

      controller.enqueue(bytes(1));
      await expect.poll(() => output).toBeDefined();
      expect(output?.done).toBe(false);
      expect(output?.value).toEqual(bytes(threshold));
    } finally {
      controller.close();
      await next;
      await iterator.return(undefined);
    }
  });

  it('accumulates small chunks until minChunkSize is met', async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
    });
    const iterator = new ChunkedStreamIterable(stream, { minChunkSize: 64 })[Symbol.asyncIterator]();
    let output: IteratorResult<Uint8Array> | undefined;
    const next = iterator.next().then((value) => {
      output = value;
      return value;
    });

    try {
      controller.enqueue(bytes(30, 1));
      controller.enqueue(bytes(30, 2));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(output).toBeUndefined();

      controller.enqueue(bytes(30, 3));
      await expect.poll(() => output).toBeDefined();
      expect(output?.done).toBe(false);
      expect(output?.value).toHaveLength(90);
    } finally {
      controller.close();
      await next;
      await iterator.return(undefined);
    }
  });

  it('flushes remaining bytes on stream end even if below minChunkSize', async () => {
    const minChunkSize = 128;
    const stream = makeStream(bytes(50));
    const chunks = await collect(new ChunkedStreamIterable(stream, { minChunkSize }));

    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.length).toBe(50);
  });

  it('preserves all bytes across multiple yielded chunks', async () => {
    const minChunkSize = 50;
    // 3 × 40-byte chunks → first two accumulate to 80 (≥50, yield), third is remainder
    const stream = makeStream(bytes(40, 1), bytes(40, 2), bytes(40, 3));
    const chunks = await collect(new ChunkedStreamIterable(stream, { minChunkSize }));

    expect(totalBytes(chunks)).toBe(120);
    expect(chunks.flatMap((chunk) => Array.from(chunk))).toEqual([
      ...Array(40).fill(1),
      ...Array(40).fill(2),
      ...Array(40).fill(3),
    ]);
  });

  it('concatenates chunk bytes correctly', async () => {
    const minChunkSize = 4;
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3, 4]);
    const stream = makeStream(a, b);
    const chunks = await collect(new ChunkedStreamIterable(stream, { minChunkSize }));

    expect(chunks).toHaveLength(1);
    expect(Array.from(chunks[0]!)).toEqual([1, 2, 3, 4]);
  });

  it('yields nothing for an empty stream', async () => {
    const stream = makeStream();
    const chunks = await collect(new ChunkedStreamIterable(stream, { minChunkSize: 64 }));

    expect(chunks).toHaveLength(0);
  });

  it('propagates errors from the underlying stream', async () => {
    const errorStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('network failure'));
      },
    });

    await expect(collect(new ChunkedStreamIterable(errorStream, { minChunkSize: 64 }))).rejects.toThrow(
      'network failure'
    );
  });

  it('releases the reader lock after normal completion', async () => {
    const stream = makeStream(bytes(10));
    const iterable = new ChunkedStreamIterable(stream, { minChunkSize: 64 });

    await collect(iterable);
    // If lock was not released, getReader() would throw
    expect(() => stream.getReader()).not.toThrow();
  });

  it('releases the reader lock after an error', async () => {
    const errorStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('fail'));
      },
    });

    const iterable = new ChunkedStreamIterable(errorStream, { minChunkSize: 64 });

    await expect(collect(iterable)).rejects.toThrow();
    // Lock should be released even though we errored
    expect(errorStream.locked).toBe(false);
  });

  it('handles multiple large chunks correctly', async () => {
    const minChunkSize = 50;
    // Each chunk already meets minChunkSize → each yielded individually
    const stream = makeStream(bytes(60, 1), bytes(70, 2), bytes(80, 3));
    const chunks = await collect(new ChunkedStreamIterable(stream, { minChunkSize }));

    expect(chunks).toHaveLength(3);
    expect(chunks[0]!.length).toBe(60);
    expect(chunks[1]!.length).toBe(70);
    expect(chunks[2]!.length).toBe(80);
  });
});
