import { describeOrigin, summarizeCache } from '../headers.ts';
import { resourceKey, type ResourceTimingSummary, type TransferRecord } from '../record.ts';

export interface FetchMeta {
  kind: TransferRecord['kind'];
  role: TransferRecord['origin']['role'];
  trackType?: TransferRecord['trackType'] | undefined;
  byteRange?: [number, number] | undefined;
  renditionId?: string | undefined;
  segmentIndex?: number | undefined;
}

const TRANSFER_TIMEOUT_MS = 30_000;
const DEBUG = new URLSearchParams(globalThis.location?.search ?? '').has('debug');

interface NetworkInformationLike {
  effectiveType?: string;
  type?: string;
}

/**
 * Fetches URLs the way a player would (default cache mode, streamed body) and records each as a `TransferRecord`.
 * Overlaps are filled in by `finish`, once every transfer's interval is known.
 */
export class TransferRecorder {
  readonly records: TransferRecord[] = [];
  private lastByteAt: number | undefined;
  private readonly touchedRenditions = new Set<string>();
  private readonly touchedUrls = new Set<string>();

  constructor(readonly recording: string) {
    performance.setResourceTimingBufferSize(100_000);
  }

  async fetch(url: string, meta: FetchMeta): Promise<{ record: TransferRecord; body?: Uint8Array | undefined }> {
    const record = this.begin(url, meta);

    if (DEBUG) console.log(`[abr-lab] start ${record.id} ${meta.kind} ${meta.trackType ?? ''} ${url.slice(-48)}`);

    const keepBody = meta.kind === 'playlist' || meta.kind === 'other';
    const parts: Uint8Array[] = [];

    try {
      const response = await fetch(url, {
        // Bounds the whole transfer, body included: a stalled request is recorded as aborted instead of hanging the run.
        signal: AbortSignal.timeout(TRANSFER_TIMEOUT_MS),
        ...(meta.byteRange ? { headers: { range: `bytes=${meta.byteRange[0]}-${meta.byteRange[1]}` } } : {}),
      });

      record.t.firstByte = performance.now();
      record.status = response.status;
      record.headers = Object.fromEntries([...response.headers].map(([k, v]) => [k.toLowerCase(), v]));
      record.cache = summarizeCache(record.headers);
      record.origin = describeOrigin(url, record.headers, meta.role);

      const reader = response.body!.getReader();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const now = performance.now();

        record.chunks.push([now, value.byteLength]);
        record.bytes += value.byteLength;
        this.lastByteAt = now;

        if (keepBody) parts.push(value);
      }

      record.t.end = performance.now();
    } catch (error) {
      record.status = error instanceof DOMException && error.name === 'TimeoutError' ? 'aborted' : 'error';
      record.error = String(error);
    }

    record.timing = resourceTiming(url);

    if (DEBUG) console.log(`[abr-lab] end ${record.id} ${record.status} ${record.bytes} B ${record.error ?? ''}`);

    return { record, body: keepBody ? concat(parts) : undefined };
  }

  /** Fill in overlaps; call once the session is over. */
  finish(): TransferRecord[] {
    for (const record of this.records) {
      const end = record.t.end ?? record.t.start;

      record.overlapping = this.records
        .filter((other) => other !== record && other.t.start < end && (other.t.end ?? other.t.start) > record.t.start)
        .map((other) => other.id);
    }

    return this.records;
  }

  private begin(url: string, meta: FetchMeta): TransferRecord {
    const start = performance.now();
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const record: TransferRecord = {
      id: `${this.recording}-${this.records.length}`,
      recording: this.recording,
      kind: meta.kind,
      trackType: meta.trackType,
      url,
      byteRange: meta.byteRange,
      origin: describeOrigin(url, {}, meta.role),
      renditionId: meta.renditionId,
      segmentIndex: meta.segmentIndex,
      wall: Date.now(),
      t: { start },
      chunks: [],
      bytes: 0,
      status: 'aborted',
      heldByServer: /[?&]_HLS_(msn|part)=/.test(url),
      firstTouch: {
        rendition: meta.renditionId !== undefined && !this.touchedRenditions.has(meta.renditionId),
        url: !this.touchedUrls.has(resourceKey(url, meta.byteRange)),
      },
      idleGapMs: this.lastByteAt === undefined ? undefined : start - this.lastByteAt,
      overlapping: [],
      env: {
        visibility: document.visibilityState === 'hidden' ? 'hidden' : 'visible',
        effectiveType: connection?.effectiveType,
        connectionType: connection?.type,
      },
    };

    if (meta.renditionId !== undefined) this.touchedRenditions.add(meta.renditionId);

    this.touchedUrls.add(resourceKey(url, meta.byteRange));
    this.records.push(record);

    return record;
  }
}

function resourceTiming(url: string): ResourceTimingSummary | undefined {
  const entry = performance.getEntriesByName(url, 'resource').at(-1) as
    | (PerformanceResourceTiming & { deliveryType?: string })
    | undefined;
  if (!entry) return undefined;

  return {
    dns: entry.domainLookupEnd - entry.domainLookupStart,
    connect: entry.connectEnd - entry.connectStart,
    tls: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
    reused: entry.connectStart === entry.connectEnd,
    protocol: entry.nextHopProtocol || undefined,
    transferSize: entry.transferSize,
    decodedBodySize: entry.decodedBodySize,
    deliveryType: entry.deliveryType,
  };
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }

  return out;
}
