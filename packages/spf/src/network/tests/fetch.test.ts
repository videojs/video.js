import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Resource } from '../fetch';
import { createTrackedFetch, fetchResolvable, fetchStream, getResponseText } from '../fetch';

describe('fetchResolvable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches from Resource URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('content'));

    const addressable: Resource = {
      url: 'https://example.com/playlist.m3u8',
    };

    const response = await fetchResolvable(addressable);

    expect(fetchSpy).toHaveBeenCalledWith(expect.any(Request));
    // SAFETY: fetchResolvable passes a native Request to fetch.
    const request = fetchSpy.mock.calls[0]![0] as Request;

    expect(request.url).toBe('https://example.com/playlist.m3u8');
    expect(request.method).toBe('GET');
    expect(request.headers.has('Range')).toBe(false);
    expect(response).toBeInstanceOf(Response);
  });

  it('returns Response from fetch', async () => {
    const mockResponse = new Response('test content');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const response = await fetchResolvable({ url: 'https://example.com/test.m3u8' });

    expect(response).toBe(mockResponse);
  });

  it('accepts Resource with byteRange', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(''));

    const addressable: Resource = {
      url: 'https://example.com/segment.m4s',
      byteRange: { start: 1000, end: 1999 },
    };

    await fetchResolvable(addressable);
    // SAFETY: fetchResolvable passes a native Request to fetch.
    const request = fetchSpy.mock.calls[0]![0] as Request;

    expect(request.url).toBe('https://example.com/segment.m4s');
    expect(request.headers.get('Range')).toBe('bytes=1000-1999');
  });

  it('preserves byte ranges alongside caller headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bytes'));

    await fetchResolvable(
      { url: 'https://example.com/file.mp4', byteRange: { start: 10, end: 19 } },
      { headers: { Authorization: 'test-token' } }
    );

    // SAFETY: fetchResolvable passes a native Request to fetch.
    const request = fetchSpy.mock.calls[0]![0] as Request;

    expect(request.headers.get('Authorization')).toBe('test-token');
    expect(request.headers.get('Range')).toBe('bytes=10-19');
  });

  it('handles zero-offset byte range', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(''));

    const addressable: Resource = {
      url: 'https://example.com/init.mp4',
      byteRange: { start: 0, end: 999 },
    };

    await fetchResolvable(addressable);
    // SAFETY: fetchResolvable passes a native Request to fetch.
    const request = fetchSpy.mock.calls[0]![0] as Request;

    expect(request.url).toBe('https://example.com/init.mp4');
    expect(request.headers.get('Range')).toBe('bytes=0-999');
  });
});

describe('createTrackedFetch', () => {
  it('samples every emitted chunk with cumulative byte totals', async () => {
    const totals: number[] = [];
    const trackedFetch = createTrackedFetch(
      { fastEstimate: 0, slowEstimate: 0, fastTotalWeight: 0, slowTotalWeight: 0, bytesSampled: 0 },
      ({ bytesSampled }) => totals.push(bytesSampled)
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const size of [150_000, 150_000, 50_000]) controller.enqueue(new Uint8Array(size));

        controller.close();
      },
    });
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body));

    try {
      const sizes: number[] = [];

      for await (const chunk of await trackedFetch({ url: 'https://example.com/media.m4s' })) {
        sizes.push(chunk.byteLength);
      }

      expect(sizes).toEqual([150_000, 150_000, 50_000]);
      expect(totals).toEqual([150_000, 300_000, 350_000]);
    } finally {
      fetch.mockRestore();
    }
  });
});

describe('getResponseText', () => {
  it('extracts text from ResponseLike', async () => {
    const response = {
      text: async () => '#EXTM3U\n#EXT-X-VERSION:7',
    };

    const text = await getResponseText(response);

    expect(text).toBe('#EXTM3U\n#EXT-X-VERSION:7');
  });

  it('works with actual Response object', async () => {
    const response = new Response('#EXTM3U');
    const text = await getResponseText(response);

    expect(text).toBe('#EXTM3U');
  });
});

describe('fetchStream', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('establishes the connection before returning a lazy body iterable', async () => {
    let connect!: (response: Response) => void;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((resolve) => {
          connect = resolve;
        })
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    let connected = false;
    const pending = fetchStream({ url: 'https://example.com/segment.m4s' }, { minChunkSize: 4 }).then((body) => {
      connected = true;
      return body;
    });

    try {
      expect(fetchSpy).toHaveBeenCalledOnce();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(connected).toBe(false);
    } finally {
      connect(new Response(stream));
    }

    const body = await pending;

    expect(stream.locked).toBe(false);
    const chunks: number[][] = [];

    for await (const chunk of body) chunks.push(Array.from(chunk));

    expect(chunks).toEqual([[1, 2, 3, 4]]);
    expect(stream.locked).toBe(false);
  });

  it('rejects a response without a body before returning an iterable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await expect(fetchStream({ url: 'https://example.com/segment.m4s' })).rejects.toThrow('Response has no body');
  });
});

describe('createTrackedFetch', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('accumulates exact bytes and elapsed weights once per emitted chunk across requests', async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(value) {
              controller = value;
            },
          })
        )
    );
    let time = 0;

    vi.spyOn(performance, 'now').mockImplementation(() => time);

    const onSample = vi.fn();
    const trackedFetch = createTrackedFetch(
      {
        fastEstimate: 0,
        slowEstimate: 0,
        fastTotalWeight: 0,
        slowTotalWeight: 0,
        bytesSampled: 0,
      },
      onSample
    );

    for (const url of ['https://example.com/init.mp4', 'https://example.com/segment.m4s']) {
      const callsBeforeRequest = onSample.mock.calls.length;
      const body = await trackedFetch({ url }, { minChunkSize: 20_000 });

      expect(onSample).toHaveBeenCalledTimes(callsBeforeRequest);
      const iterator = body[Symbol.asyncIterator]();

      try {
        const first = iterator.next();

        time += 1000;
        controller.enqueue(new Uint8Array(20_000).fill(1));
        expect(await first).toEqual({ done: false, value: new Uint8Array(20_000).fill(1) });
        expect(onSample).toHaveBeenCalledTimes(callsBeforeRequest + 1);

        // Consumer work and gaps between requests do not count as download time.
        time += 10_000;
        const second = iterator.next();

        time += 2000;
        controller.enqueue(new Uint8Array(40_000).fill(2));
        expect(await second).toEqual({ done: false, value: new Uint8Array(40_000).fill(2) });
        expect(onSample).toHaveBeenCalledTimes(callsBeforeRequest + 2);
      } finally {
        controller.close();
        await iterator.return?.();
      }

      time += 20_000;
    }

    expect(onSample).toHaveBeenCalledTimes(4);
    expect(onSample.mock.calls.map(([state]) => state.bytesSampled)).toEqual([20_000, 60_000, 80_000, 120_000]);
    expect(onSample.mock.calls.map(([state]) => state.fastTotalWeight)).toEqual([1, 3, 4, 6]);
    expect(onSample.mock.calls.map(([state]) => state.slowTotalWeight)).toEqual([1, 3, 4, 6]);
  });
});
