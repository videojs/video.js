import { createLognormal } from '../predictors/lognormal.ts';
import type { ForecastRequest } from '../predictors/predictor.ts';
import type { TransferRecord } from '../record.ts';
import type { EvidenceWeights, Regime } from '../regime.ts';

export const LATENCY_FEATURES = [
  'seedLogLatencyMs',
  'firstTouchRendition',
  'previousOrigin',
  'previousCdnMiss',
  'previousEdgeHit',
  'logIdleSeconds',
] as const;

/** Inputs to the warm/cold classifier: the latency features plus how warm this asset has been so far. */
export const CLASSIFIER_FEATURES = [...LATENCY_FEATURES, 'sessionMissShare'] as const;

export const RATE_FEATURES = [
  'seedLogRate',
  'seedLogRateSigma',
  'logAgeSeconds',
  'logInFlight',
  'logMegabytes',
] as const;

/**
 * Turns the session so far into model inputs. Used both to build training rows and to forecast, so the two can never
 * disagree on what a feature means. Everything here is known before the request starts.
 */
export class FeatureTracker {
  private readonly seed = createLognormal();
  private readonly lastRegimeByRendition = new Map<string, Regime>();
  /** CDN outcomes of segment transfers seen so far: how warm this asset is at this edge. */
  private misses = 0;
  private hits = 0;

  observe(record: TransferRecord, weights: EvidenceWeights): void {
    this.seed.observe(record, weights);

    if (record.kind === 'segment' && record.renditionId !== undefined) {
      this.lastRegimeByRendition.set(record.renditionId, weights.regime);
    }

    if (record.kind === 'segment' && isCold(weights.regime)) this.misses++;
    else if (record.kind === 'segment' && weights.regime === 'network') this.hits++;
  }

  features(request: ForecastRequest): { latency: number[]; classifier: number[]; rate: number[] } {
    const seed = this.seed.inspect(request);
    const previous =
      request.renditionId === undefined ? undefined : this.lastRegimeByRendition.get(request.renditionId);

    const latency = [
      Math.log(Math.max(1, seed.latencyMs)),
      request.firstTouchRendition ? 1 : 0,
      previous === 'origin' ? 1 : 0,
      previous === 'cdn-miss' ? 1 : 0,
      previous === 'network' ? 1 : 0,
      Math.log1p((request.idleGapMs ?? 0) / 1000),
    ];

    return {
      latency,
      // Smoothed toward an even split, so the first requests of a session don't read as certain either way.
      classifier: [...latency, (this.misses + 0.5) / (this.misses + this.hits + 1)],
      rate: [
        seed.logRateMean,
        seed.logRateSigma,
        Math.log1p(seed.ageMs / 1000),
        Math.log1p(request.inFlight ?? 0),
        Math.log(Math.max(1, request.bytes) / 1e6),
      ],
    };
  }
}

/** A transfer that had to go past the CDN edge. */
export function isCold(regime: Regime): boolean {
  return regime === 'origin' || regime === 'cdn-miss';
}

/**
 * The seed's own log estimates, which the models learn corrections to rather than replace: index 0 of each feature
 * list. A host the models never trained on then starts from its own online estimate instead of the training CDNs'.
 */
export function seedOffsets(features: { latency: readonly number[]; rate: readonly number[] }): {
  latency: number;
  rate: number;
} {
  return { latency: features.latency[0]!, rate: features.rate[0]! };
}
