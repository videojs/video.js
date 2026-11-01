/**
 * The per-request log format: what the logger writes and the scorer reads. One JSON object per line.
 *
 * Times under `t` and in `chunks` are `performance.now()` milliseconds within one recording; `wall` is `Date.now()` at
 * request start, so recordings can be aligned across sessions.
 */
export interface TransferRecord {
  id: string;
  recording: string;
  kind: 'segment' | 'part' | 'init' | 'playlist' | 'key' | 'other';
  trackType?: 'video' | 'audio' | 'text' | undefined;
  url: string;
  /** Inclusive byte range, when the playlist addresses part of a file. */
  byteRange?: [number, number] | undefined;
  origin: TransferOrigin;
  renditionId?: string | undefined;
  segmentIndex?: number | undefined;
  wall: number;
  t: { start: number; firstByte?: number | undefined; end?: number | undefined };
  /** Body arrivals as `[time, bytes]`, in arrival order. */
  chunks: Array<[number, number]>;
  bytes: number;
  status: number | 'aborted' | 'error';
  /** Why the transfer failed, when it did. */
  error?: string | undefined;
  /** LL-HLS blocking reloads and preload hints wait on purpose; their first byte is not latency. */
  heldByServer?: boolean | undefined;
  timing?: ResourceTimingSummary | undefined;
  cache?: CacheSummary | undefined;
  firstTouch: { rendition: boolean; url: boolean };
  /** Milliseconds since the last body byte on any host; `undefined` for the first request of a recording. */
  idleGapMs?: number | undefined;
  /** Ids of transfers active at any point during this one. */
  overlapping: string[];
  env: { visibility: 'visible' | 'hidden'; effectiveType?: string | undefined; connectionType?: string | undefined };
  /** Exposed response headers, lower-cased, kept raw so features can be derived later. */
  headers?: Record<string, string> | undefined;
  /** DevTools throttling in force when the request started, when the recording was throttled. */
  throttle?: { profile: string; capacityBps: number; latencyMs: number } | undefined;
  /** Ground truth from the Chrome DevTools Protocol, when recorded under Playwright. */
  truth?: {
    fromDiskCache?: boolean | undefined;
    fromMemoryCache?: boolean | undefined;
    fromServiceWorker?: boolean | undefined;
  };
}

/** A host as a hierarchy, coarse to fine. */
export interface TransferOrigin {
  site: string;
  cdn?: string | undefined;
  host: string;
  pop?: string | undefined;
  role: 'multivariant' | 'playlist' | 'segment' | 'key' | 'other';
}

export interface ResourceTimingSummary {
  dns?: number | undefined;
  connect?: number | undefined;
  tls?: number | undefined;
  reused?: boolean | undefined;
  protocol?: string | undefined;
  transferSize?: number | undefined;
  decodedBodySize?: number | undefined;
  deliveryType?: string | undefined;
}

export interface CacheSummary {
  tiers: string[];
  hits?: number[] | undefined;
  servedBy?: string[] | undefined;
}

/** What a cache keys on: the URL, plus the byte range when only part of the file was requested. */
export function resourceKey(url: string, byteRange?: [number, number]): string {
  return byteRange ? `${url}#${byteRange[0]}-${byteRange[1]}` : url;
}

/** Request latency (start to first byte) in ms, when the transfer got that far. */
export function latencyMs(record: TransferRecord): number | undefined {
  const { start, firstByte } = record.t;

  return firstByte === undefined ? undefined : firstByte - start;
}

/** Total time from request start to the last byte, in ms. */
export function durationMs(record: TransferRecord): number | undefined {
  const { start, end } = record.t;

  return end === undefined ? undefined : end - start;
}

/** Body rate in bits/s from first byte to last byte. */
export function bodyRateBps(record: TransferRecord): number | undefined {
  const { firstByte, end } = record.t;
  if (firstByte === undefined || end === undefined || end <= firstByte) return undefined;

  return (8000 * record.bytes) / (end - firstByte);
}

export function parseRecords(jsonl: string): TransferRecord[] {
  return jsonl
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as TransferRecord);
}
