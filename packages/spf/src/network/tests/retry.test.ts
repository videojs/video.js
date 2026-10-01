import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { fetchWithRetry } from '../retry';

// Zero backoff keeps the tests instant; the policy's shape is what's under test, not its wall-clock timing.
const FAST = { maxRetries: 2, baseDelayMs: 0, firstByteTimeoutMs: 1000 };
const open = () => new AbortController().signal;

describe('fetchWithRetry', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the first successful response without retrying', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchWithRetry('https://x', {}, open(), FAST)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a 4xx — hands it back for the caller to surface', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 403 }));

    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchWithRetry('https://x', {}, open(), FAST)).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 5xx and returns the eventual success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchWithRetry('https://x', {}, open(), FAST)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns the last 5xx once the retry budget is spent', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 }));

    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchWithRetry('https://x', {}, open(), FAST)).status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(3); // first attempt + maxRetries
  });

  it('retries a network error and rethrows after exhaustion', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('network down');
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithRetry('https://x', {}, open(), FAST)).rejects.toThrow('network down');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('propagates a caller abort without retrying', async () => {
    const controller = new AbortController();
    const reason = new Error('source replaced');
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      controller.abort(reason);

      // SAFETY: fetchWithRetry supplies its combined signal on every attempt.
      throw (init.signal as AbortSignal).reason;
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithRetry('https://x', {}, controller.signal, FAST)).rejects.toBe(reason);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries when the first-byte timeout fires', async () => {
    const policy = { maxRetries: 1, baseDelayMs: 0, firstByteTimeoutMs: 10 };
    const fetchMock = vi
      .fn()
      // First attempt hangs until its (timeout-combined) signal aborts.
      .mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            (init.signal as AbortSignal).addEventListener(
              'abort',
              () => reject(new DOMException('t', 'TimeoutError')),
              {
                once: true,
              }
            );
          })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchWithRetry('https://x', {}, open(), policy)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
