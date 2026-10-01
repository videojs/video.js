import { vi } from 'vite-plus/test';

/** Event-capable MSE boundary; ranges follow the fixture's append order and physical removals. */
export function makeSourceBuffer(
  appendRanges: Array<[number, number] | undefined> = [],
  startingRanges: Array<[number, number]> = []
): SourceBuffer {
  let appendIndex = 0;
  let ranges: Array<[number, number]> = [...startingRanges];

  class FakeSourceBuffer extends EventTarget implements SourceBuffer {
    mode: AppendMode = 'segments';
    updating = false;
    timestampOffset = 0;
    appendWindowStart = 0;
    appendWindowEnd = Infinity;
    onabort = null;
    onerror = null;
    onupdate = null;
    onupdateend = null;
    onupdatestart = null;
    abort = vi.fn();
    changeType = vi.fn();

    get buffered(): TimeRanges {
      return {
        length: ranges.length,
        start: (index) => ranges[index]![0],
        end: (index) => ranges[index]![1],
      };
    }

    appendBuffer = vi.fn((_data: BufferSource) => {
      const range = appendRanges[appendIndex++];

      if (range) ranges.push(range);

      this.completeUpdate();
    });

    remove = vi.fn((start: number, end: number) => {
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
      this.completeUpdate();
    });

    private completeUpdate() {
      this.updating = true;
      setTimeout(() => {
        this.updating = false;
        this.dispatchEvent(new Event('updateend'));
      }, 0);
    }
  }

  return new FakeSourceBuffer();
}

/** Holds requests until release, and rejects obsolete requests through their actual Request signals. */
export function makeControllableFetch() {
  const resolvers = new Map<string, () => void>();
  const fetchedUrls: string[] = [];
  const signals = new Map<string, AbortSignal>();
  const fetch = vi.fn((input: RequestInfo | URL) => {
    // SAFETY: fetchStream constructs a native Request before reaching this network boundary.
    const request = input as Request;

    fetchedUrls.push(request.url);
    signals.set(request.url, request.signal);
    return new Promise<Response>((resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true });
      resolvers.set(request.url, () => resolve(new Response(new ArrayBuffer(100))));
    });
  });

  return { fetch, fetchedUrls, signals, resolve: (url: string) => resolvers.get(url)?.() };
}
