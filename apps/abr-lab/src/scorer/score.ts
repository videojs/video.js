import type { PredictorFactory } from '../predictors/predictor.ts';
import { durationMs, type TransferRecord } from '../record.ts';
import { classifyTransfer, type Regime } from '../regime.ts';

export const QUANTILES = [0.1, 0.5, 0.9] as const;

export type Bucket = 'all' | 'back-to-back' | 'after-idle' | 'solo' | 'concurrent' | 'edge-hit' | 'cdn-miss' | 'origin';

/** Regimes whose arrival time is a network question: everything except local replays, held and failed requests. */
const SCORED_REGIMES: ReadonlySet<Regime> = new Set(['network', 'cdn-miss', 'origin']);

export interface ScoreOptions {
  /** An idle gap at least this long puts a target in `after-idle`. */
  idleThresholdMs?: number;
}

export interface BucketScore {
  n: number;
  /** Share of targets whose actual time fell at or below each forecast quantile; calibrated means ≈ the quantile. */
  coverage: number[];
  /** Median of |ln(actual / forecast median)|. */
  medianAbsLogError: number;
  /** Mean pinball loss across `QUANTILES`, relative to the actual time, so large and small requests weigh alike. */
  relativePinball: number;
}

export interface ScoreResult {
  predictors: Record<string, Partial<Record<Bucket, BucketScore>>>;
  regimes: Partial<Record<Regime, number>>;
  /** Local-cache heuristic vs CDP ground truth, for targets that carry truth. */
  localCheck: { truePositive: number; falsePositive: number; falseNegative: number; trueNegative: number };
  targets: number;
}

interface Sample {
  actual: number;
  quantiles: number[];
}

/**
 * Replay recordings and score every predictor on every network-limited segment transfer. Recordings are scored
 * independently (each is one session), and each predictor only observes transfers that completed before the target
 * started.
 */
export function scoreRecords(
  records: readonly TransferRecord[],
  factories: readonly PredictorFactory[],
  options: ScoreOptions = {}
): ScoreResult {
  const idleThresholdMs = options.idleThresholdMs ?? 1000;
  const samples = new Map<string, Map<Bucket, Sample[]>>();
  const result: ScoreResult = {
    predictors: {},
    regimes: {},
    localCheck: { truePositive: 0, falsePositive: 0, falseNegative: 0, trueNegative: 0 },
    targets: 0,
  };

  for (const recording of groupBy(records, (r) => r.recording).values()) {
    const predictors = factories.map((create) => create());
    const byStart = [...recording].sort((a, b) => a.t.start - b.t.start);
    const byEnd = recording.filter((r) => r.t.end !== undefined).sort((a, b) => a.t.end! - b.t.end!);
    const lastByUrl = new Map<string, TransferRecord>();
    let next = 0;

    for (const target of byStart) {
      for (; next < byEnd.length && byEnd[next]!.t.end! <= target.t.start; next++) {
        const done = byEnd[next]!;
        const weights = classifyTransfer(done, lastByUrl.get(done.url));

        lastByUrl.set(done.url, done);

        for (const predictor of predictors) predictor.observe(done, weights);
      }

      const actual = durationMs(target);
      if (target.kind !== 'segment' || actual === undefined) continue;

      const { regime } = classifyTransfer(target, lastByUrl.get(target.url));

      result.regimes[regime] = (result.regimes[regime] ?? 0) + 1;
      tallyLocalCheck(result, target, regime);

      if (!SCORED_REGIMES.has(regime) || isCachedByTruth(target)) continue;

      result.targets++;
      const buckets = bucketsFor(target, regime, idleThresholdMs);

      for (const predictor of predictors) {
        const forecast = predictor.forecast({ bytes: target.bytes, host: target.origin.host, at: target.t.start });
        const sample = { actual, quantiles: QUANTILES.map((q) => forecast.quantile(q)) };
        const byBucket = samples.get(predictor.name) ?? new Map<Bucket, Sample[]>();

        for (const bucket of buckets) byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), sample]);

        samples.set(predictor.name, byBucket);
      }
    }
  }

  for (const [name, byBucket] of samples) {
    result.predictors[name] = Object.fromEntries([...byBucket].map(([bucket, list]) => [bucket, summarize(list)]));
  }

  return result;
}

function bucketsFor(target: TransferRecord, regime: Regime, idleThresholdMs: number): Bucket[] {
  return [
    'all',
    (target.idleGapMs ?? 0) >= idleThresholdMs ? 'after-idle' : 'back-to-back',
    target.overlapping.length > 0 ? 'concurrent' : 'solo',
    regime === 'network' ? 'edge-hit' : (regime as 'cdn-miss' | 'origin'),
  ];
}

function summarize(samples: readonly Sample[]): BucketScore {
  const coverage = QUANTILES.map((_, i) => samples.filter((s) => s.actual <= s.quantiles[i]!).length / samples.length);
  const logErrors = samples.map((s) => Math.abs(Math.log(s.actual / s.quantiles[1]!))).sort((a, b) => a - b);
  const pinball =
    samples.reduce(
      (sum, s) =>
        sum +
        QUANTILES.reduce((inner, q, i) => {
          const diff = s.actual - s.quantiles[i]!;

          return inner + Math.max(q * diff, (q - 1) * diff) / s.actual;
        }, 0) /
          QUANTILES.length,
      0
    ) / samples.length;

  return {
    n: samples.length,
    coverage,
    medianAbsLogError: logErrors[Math.floor(logErrors.length / 2)] ?? 0,
    relativePinball: pinball,
  };
}

function isCachedByTruth(record: TransferRecord): boolean {
  const truth = record.truth;

  return !!(truth?.fromDiskCache || truth?.fromMemoryCache || truth?.fromServiceWorker);
}

function tallyLocalCheck(result: ScoreResult, record: TransferRecord, regime: Regime): void {
  if (!record.truth) return;

  const predicted = regime === 'local';
  const actual = isCachedByTruth(record);
  const check = result.localCheck;

  if (predicted && actual) check.truePositive++;
  else if (predicted) check.falsePositive++;
  else if (actual) check.falseNegative++;
  else check.trueNegative++;
}

function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);

  return groups;
}
