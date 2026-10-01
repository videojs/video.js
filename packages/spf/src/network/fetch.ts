/**
 * HTTP Fetch Wrapper
 *
 * Composable building blocks: - fetchResolvable() — fetch a Resource (handles byte ranges); returns Response -
 * getResponseText() — extract text from Response - fetchStream() — two-stage: await connection establishment, then
 * lazily iterate body chunks. Use when timing the connection start independently of body consumption matters (e.g.,
 * observable fetch timing for ABR). - createTrackedFetch() — factory for a fetchStream-shape function that samples
 * bandwidth (via EWMA) per chunk and notifies via callback.
 */

import { type BandwidthState, sampleBandwidth } from './bandwidth-estimator';
import { ChunkedStreamIterable, type ChunkedStreamIterableOptions } from './chunked-stream-iterable';

/** Structural response contract for text extraction. */
interface ResponseLike {
  text(): Promise<string>;
}

/**
 * An HTTP-addressable resource — URL plus optional byte range. Media's `AddressableObject` (and anything else with the
 * same shape) is structurally compatible; kept local so this module stays domain-agnostic.
 */
export interface Resource {
  url: string;
  byteRange?: {
    start: number;
    end: number;
  };
}

/**
 * Fetch resolvable from a Resource.
 *
 * Handles byte range requests if byteRange is present. Returns native fetch Response for composability (can extract
 * text, stream, etc.).
 *
 * @example
 *   const response = await fetchResolvable({ url: 'https://example.com/segment.m4s' });
 *   const text = await getResponseText(response);
 *
 * @example
 *   // With byte range
 *   const response = await fetchResolvable({
 *     url: 'https://example.com/file.mp4',
 *     byteRange: { start: 1000, end: 1999 },
 *   });
 *
 * @param addressable - Resource to fetch (url + optional byteRange)
 * @returns Promise resolving to Response
 */
export async function fetchResolvable(addressable: Resource, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);

  // Add Range header for byte range requests
  if (addressable.byteRange) {
    const { start, end } = addressable.byteRange;

    headers.set('Range', `bytes=${start}-${end}`);
  }

  const request = new Request(addressable.url, {
    method: 'GET',
    ...options,
    headers,
  });

  return fetch(request);
}

/**
 * Extract text from Response.
 *
 * Accepts minimal Response-like object (just needs text() method). Returns promise from response.text().
 *
 * @example
 *   const response = await fetchResolvable(addressable);
 *   const text = await getResponseText(response);
 *
 * @param response - Response-like object with text() method
 * @returns Promise resolving to text content
 */
export function getResponseText(response: ResponseLike): Promise<string> {
  return response.text();
}

/**
 * Fetch a resource and resolve its text body — the text analog of {@link FetchBytes}. A non-OK status rejects, so HTTP
 * failures surface as rejections that callers (and decorators like the failover tracker) handle uniformly with network
 * errors.
 */
export type FetchText = (addressable: Resource, options?: RequestInit) => Promise<string>;

/** Default {@link FetchText}: fetch the resource, reject on non-OK, return text. */
export const fetchResolvableText: FetchText = async (addressable, options) => {
  const response = await fetchResolvable(addressable, options);

  if (!response.ok) {
    throw new Error(`fetchResolvableText: ${response.status} ${response.statusText} for ${addressable.url}`);
  }

  return getResponseText(response);
};

/**
 * Two-stage fetch helper: eagerly starts the HTTP request (TTFB is awaited), then returns a lazy iterable over the
 * response body. Separating connection start from body iteration makes fetch timing predictable and observable
 * regardless of when downstream consumers begin pulling chunks.
 *
 * Connection establishment is observable separately from body consumption. Non-OK responses reject before body
 * iteration.
 */
export type FetchOptions = RequestInit & ChunkedStreamIterableOptions;

export type FetchBytes = (addressable: Resource, options?: FetchOptions) => Promise<AsyncIterable<Uint8Array>>;

export async function fetchStream(addressable: Resource, options?: FetchOptions): Promise<AsyncIterable<Uint8Array>> {
  const { minChunkSize, ...fetchOptions } = options ?? {};
  const response = await fetchResolvable(addressable, fetchOptions);
  if (!response.ok) throw new Error(`fetchStream: ${response.status} ${response.statusText} for ${addressable.url}`);

  if (!response.body) throw new Error('Response has no body');

  return new ChunkedStreamIterable(response.body, ...(minChunkSize !== undefined ? [{ minChunkSize }] : []));
}

/**
 * Returns a {@link FetchBytes} function that samples bandwidth via EWMA per body chunk. The factory captures the
 * running bandwidth state internally; per chunk it computes the next state and notifies the supplied `onSample`
 * callback.
 *
 * The factory's internal accumulator is seeded from `initial` and updated on every chunk; callers don't need to thread
 * it back in. `onSample` receives the _new_ state after each chunk — typical use is to bridge samples back into engine
 * state for ABR consumers.
 *
 * @param initial - Starting `BandwidthState` (commonly zeros or the engine's current accumulator).
 * @param onSample - Called with the new `BandwidthState` after each chunk.
 */
export function createTrackedFetch(initial: BandwidthState, onSample: (next: BandwidthState) => void): FetchBytes {
  let state = initial;

  return async (addressable, options) => {
    const body = await fetchStream(addressable, options);

    return {
      [Symbol.asyncIterator]: async function* () {
        let chunkStart = performance.now();

        for await (const chunk of body) {
          const elapsed = performance.now() - chunkStart;

          state = sampleBandwidth(state, elapsed, chunk.byteLength);
          onSample(state);
          yield chunk;
          chunkStart = performance.now();
        }
      },
    };
  };
}
