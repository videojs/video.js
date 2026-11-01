import { type Distribution, empiricalDistribution, normalQuantile } from '../distribution.ts';
import type { Predictor } from '../predictors/predictor.ts';
import { bodyRateBps, latencyMs, type TransferRecord } from '../record.ts';
import { replay } from '../scorer/replay.ts';
import { FeatureTracker, seedOffsets, LATENCY_FEATURES, RATE_FEATURES } from './features.ts';
import { type FitOptions, fitGaussianRegression, type GaussianRegression, predictGaussian } from './regression.ts';

/**
 * The learned seed: download time = latency + bytes / rate, each lognormal with a mean and spread learned from
 * features. Serialized as plain JSON; a forecast is two dot products and a small numeric convolution.
 */
export interface LearnedModel {
  version: 1;
  trainedOn: string[];
  samples: { latency: number; rate: number };
  /** Log(latency ms). */
  latency: GaussianRegression;
  /** Log(body rate, bits/ms). */
  rate: GaussianRegression;
}

/** Bodies under this are dominated by latency and say little about rate; mirrors the regime model's cutoff. */
const MIN_RATE_BYTES = 16_000;
/** Grid points per component when combining latency and transfer time. */
const GRID = 25;

export function trainModel(records: readonly TransferRecord[], options: FitOptions = {}): LearnedModel {
  const latencyRows: number[][] = [];
  const latencyTargets: number[] = [];
  const rateRows: number[][] = [];
  const rateTargets: number[] = [];

  replay(records, () => {
    const tracker = new FeatureTracker();

    return {
      observe: (record, weights) => tracker.observe(record, weights),
      target({ record, request, scored }) {
        if (!scored) return;

        const features = tracker.features(request);
        const offsets = seedOffsets(features);
        const latency = latencyMs(record);
        const rate = bodyRateBps(record);

        if (latency !== undefined) {
          latencyRows.push(features.latency);
          latencyTargets.push(Math.log(Math.max(0.5, latency)) - offsets.latency);
        }

        if (rate !== undefined && record.bytes >= MIN_RATE_BYTES) {
          rateRows.push(features.rate);
          rateTargets.push(Math.log(rate / 1000) - offsets.rate);
        }
      },
    };
  });

  return {
    version: 1,
    trainedOn: [...new Set(records.map((r) => r.recording))],
    samples: { latency: latencyTargets.length, rate: rateTargets.length },
    latency: fitGaussianRegression(LATENCY_FEATURES, latencyRows, latencyTargets, options),
    rate: fitGaussianRegression(RATE_FEATURES, rateRows, rateTargets, options),
  };
}

export function createLearned(model: LearnedModel, name = 'learned'): Predictor {
  const tracker = new FeatureTracker();
  const z = Array.from({ length: GRID }, (_, i) => normalQuantile((i + 0.5) / GRID));

  return {
    name,
    observe: (record, weights) => tracker.observe(record, weights),
    forecast(request): Distribution {
      const features = tracker.features(request);
      const offsets = seedOffsets(features);
      const latency = shift(predictGaussian(model.latency, features.latency), offsets.latency);
      const rate = shift(predictGaussian(model.rate, features.rate), offsets.rate);
      const bits = 8 * request.bytes;

      // Latency and rate are treated as independent; every pairing of their grid quantiles is equally likely.
      return empiricalDistribution(
        z.flatMap((zl) =>
          z.map((zr) => Math.exp(latency.mean + latency.sigma * zl) + bits / Math.exp(rate.mean + rate.sigma * zr))
        )
      );
    },
  };
}

/** Moves a log-space prediction from a correction back onto the seed's own estimate. */
function shift(prediction: { mean: number; sigma: number }, offset: number): { mean: number; sigma: number } {
  return { mean: prediction.mean + offset, sigma: prediction.sigma };
}
