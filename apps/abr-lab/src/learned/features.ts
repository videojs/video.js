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

  observe(record: TransferRecord, weights: EvidenceWeights): void {
    this.seed.observe(record, weights);

    if (record.kind === 'segment' && record.renditionId !== undefined) {
      this.lastRegimeByRendition.set(record.renditionId, weights.regime);
    }
  }

  features(request: ForecastRequest): { latency: number[]; rate: number[] } {
    const seed = this.seed.inspect(request);
    const previous =
      request.renditionId === undefined ? undefined : this.lastRegimeByRendition.get(request.renditionId);

    return {
      latency: [
        Math.log(Math.max(1, seed.latencyMs)),
        request.firstTouchRendition ? 1 : 0,
        previous === 'origin' ? 1 : 0,
        previous === 'cdn-miss' ? 1 : 0,
        previous === 'network' ? 1 : 0,
        Math.log1p((request.idleGapMs ?? 0) / 1000),
      ],
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
