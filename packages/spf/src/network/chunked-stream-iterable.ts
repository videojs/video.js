const DEFAULT_MIN_CHUNK_SIZE = 2 ** 17; // 128 KB

export interface ChunkedStreamIterableOptions {
  minChunkSize?: number;
}

/**
 * Adapts a `ReadableStream<Uint8Array>` (e.g. `response.body`) into an `AsyncIterable<Uint8Array>` that yields chunks
 * no smaller than `minChunkSize` bytes. Smaller network chunks are accumulated and yielded together once the threshold
 * is met. Any remainder is flushed on stream end.
 *
 * Errors from the underlying stream propagate naturally — the reader lock is always released via `finally`.
 */
export class ChunkedStreamIterable implements AsyncIterable<Uint8Array> {
  readonly #minChunkSize: number;
  #readableStream: ReadableStream<Uint8Array>;

  constructor(
    readableStream: ReadableStream<Uint8Array>,
    { minChunkSize = DEFAULT_MIN_CHUNK_SIZE }: ChunkedStreamIterableOptions = {}
  ) {
    this.#readableStream = readableStream;
    this.#minChunkSize = minChunkSize;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<Uint8Array> {
    let pending: Uint8Array | undefined;
    const reader = this.#readableStream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (pending) yield pending;

          break;
        }

        pending = pending ? concat(pending, value) : value;

        if (pending.length >= this.#minChunkSize) {
          yield pending;
          pending = undefined;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);

  result.set(a);
  result.set(b, a.length);
  return result;
}
