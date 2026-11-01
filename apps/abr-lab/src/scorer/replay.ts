import type { ForecastRequest } from '../predictors/predictor.ts';
import { durationMs, resourceKey, type TransferRecord } from '../record.ts';
import { classifyTransfer, type EvidenceWeights, type Regime } from '../regime.ts';

/** Regimes whose arrival time is a network question: everything except local replays, held and failed requests. */
export const SCORED_REGIMES: ReadonlySet<Regime> = new Set(['network', 'cdn-miss', 'origin']);

export interface ReplayTarget {
  record: TransferRecord;
  regime: Regime;
  /** Everything a predictor may know before the request starts. */
  request: ForecastRequest;
  actualMs: number;
  /** Excluded from scoring: a local hit, or a regime that isn't a network question. */
  scored: boolean;
}

export interface ReplaySession {
  observe(record: TransferRecord, weights: EvidenceWeights): void;
  target(target: ReplayTarget): void;
}

/**
 * Replays each recording in time order. Every segment request becomes a target, offered after — and only after — every
 * transfer that completed before it started has been observed. Scoring and training both go through here, so a model
 * trains on exactly the inputs it will see when forecasting.
 */
export function replay(records: readonly TransferRecord[], begin: (recording: string) => ReplaySession): void {
  for (const [name, recording] of groupBy(records, (r) => r.recording)) {
    const session = begin(name);
    const byStart = [...recording].sort((a, b) => a.t.start - b.t.start);
    const byEnd = recording.filter((r) => r.t.end !== undefined).sort((a, b) => a.t.end! - b.t.end!);
    const lastByUrl = new Map<string, TransferRecord>();
    let next = 0;

    for (const target of byStart) {
      for (; next < byEnd.length && byEnd[next]!.t.end! <= target.t.start; next++) {
        const done = byEnd[next]!;

        session.observe(done, classifyTransfer(done, lastByUrl.get(keyOf(done))));
        lastByUrl.set(keyOf(done), done);
      }

      const actualMs = durationMs(target);
      if (target.kind !== 'segment' || actualMs === undefined) continue;

      const { regime } = classifyTransfer(target, lastByUrl.get(keyOf(target)));
      const at = target.t.start;
      const inFlight = recording.filter(
        (r) => r !== target && r.t.start < at && (r.t.end === undefined || r.t.end > at)
      ).length;

      session.target({
        record: target,
        regime,
        actualMs,
        scored: SCORED_REGIMES.has(regime) && !isCachedByTruth(target),
        request: {
          bytes: target.bytes,
          host: target.origin.host,
          at,
          url: target.url,
          renditionId: target.renditionId,
          firstTouchRendition: target.firstTouch.rendition,
          idleGapMs: target.idleGapMs,
          inFlight,
        },
      });
    }
  }
}

function keyOf(record: TransferRecord): string {
  return resourceKey(record.url, record.byteRange);
}

export function isCachedByTruth(record: TransferRecord): boolean {
  const truth = record.truth;

  return !!(truth?.fromDiskCache || truth?.fromMemoryCache || truth?.fromServiceWorker);
}

function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);

  return groups;
}
