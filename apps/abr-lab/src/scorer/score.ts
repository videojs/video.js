import type { PredictorFactory } from '../predictors/predictor.ts';
import type { TransferRecord } from '../record.ts';
import type { Regime } from '../regime.ts';
import { isCachedByTruth, replay } from './replay.ts';

export const QUANTILES = [0.1, 0.5, 0.9] as const;

export type Bucket = 'all' | 'back-to-back' | 'after-idle' | 'solo' | 'concurrent' | 'edge-hit' | 'cdn-miss' | 'origin';

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
 * Score every predictor on every segment transfer that went over the network. Recordings are scored independently (each
 * is one session), and each predictor only observes transfers that completed before the target started.
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

  replay(records, () => {
    const predictors = factories.map((create) => create());

    return {
      observe(record, weights) {
        for (const predictor of predictors) predictor.observe(record, weights);
      },
      target({ record, regime, request, actualMs, scored }) {
        result.regimes[regime] = (result.regimes[regime] ?? 0) + 1;
        tallyLocalCheck(result, record, regime);

        if (!scored) return;

        result.targets++;
        const buckets = bucketsFor(record, regime, idleThresholdMs);

        for (const predictor of predictors) {
          const forecast = predictor.forecast(request);
          const sample = { actual: actualMs, quantiles: QUANTILES.map((q) => forecast.quantile(q)) };
          const byBucket = samples.get(predictor.name) ?? new Map<Bucket, Sample[]>();

          for (const bucket of buckets) byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), sample]);

          samples.set(predictor.name, byBucket);
        }
      },
    };
  });

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
