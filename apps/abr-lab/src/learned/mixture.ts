import { type Distribution, normalQuantile, weightedEmpiricalDistribution } from '../distribution.ts';
import type { Predictor } from '../predictors/predictor.ts';
import { bodyRateBps, latencyMs, type TransferRecord } from '../record.ts';
import { replay } from '../scorer/replay.ts';
import {
  CLASSIFIER_FEATURES,
  FeatureTracker,
  seedOffsets,
  isCold,
  LATENCY_FEATURES,
  RATE_FEATURES,
} from './features.ts';
import {
  type FitOptions,
  fitGaussianRegression,
  fitLogisticRegression,
  type GaussianRegression,
  type LogisticRegression,
  predictGaussian,
  predictProbability,
} from './regression.ts';

/**
 * Latency as two populations, not one: requests the CDN edge answered (warm) and requests that went past it (cold). A
 * logistic classifier, trained on the cache-status labels in response headers, forecasts which population the next
 * request falls in; each population has its own lognormal. Rate is the same lognormal as the single model.
 */
export interface MixtureModel {
  version: 2;
  trainedOn: string[];
  samples: { warm: number; cold: number; rate: number };
  coldProbability: LogisticRegression;
  warm: GaussianRegression;
  cold: GaussianRegression;
  rate: GaussianRegression;
}

const MIN_RATE_BYTES = 16_000;
const GRID = 25;
/** Below this many rows a population's own regression is unreliable; it borrows the pooled one instead. */
const MIN_COMPONENT_ROWS = 8;

export function trainMixtureModel(records: readonly TransferRecord[], options: FitOptions = {}): MixtureModel {
  const rows: number[][] = [];
  const classifierRows: number[][] = [];
  const targets: number[] = [];
  const labels: (0 | 1)[] = [];
  const rateRows: number[][] = [];
  const rateTargets: number[] = [];

  replay(records, () => {
    const tracker = new FeatureTracker();

    return {
      observe: (record, weights) => tracker.observe(record, weights),
      target({ record, regime, request, scored }) {
        if (!scored) return;

        const features = tracker.features(request);
        const offsets = seedOffsets(features);
        const latency = latencyMs(record);
        const rate = bodyRateBps(record);

        if (latency !== undefined) {
          rows.push(features.latency);
          classifierRows.push(features.classifier);
          targets.push(Math.log(Math.max(0.5, latency)) - offsets.latency);
          labels.push(isCold(regime) ? 1 : 0);
        }

        if (rate !== undefined && record.bytes >= MIN_RATE_BYTES) {
          rateRows.push(features.rate);
          rateTargets.push(Math.log(rate / 1000) - offsets.rate);
        }
      },
    };
  });

  const pooled = fitGaussianRegression(LATENCY_FEATURES, rows, targets, options);
  const component = (label: 0 | 1) => {
    const picked = rows.flatMap((row, i) => (labels[i] === label ? [[row, targets[i]!] as const] : []));

    return picked.length < MIN_COMPONENT_ROWS
      ? pooled
      : fitGaussianRegression(
          LATENCY_FEATURES,
          picked.map(([row]) => row),
          picked.map(([, y]) => y),
          options
        );
  };

  return {
    version: 2,
    trainedOn: [...new Set(records.map((r) => r.recording))],
    samples: {
      warm: labels.filter((y) => y === 0).length,
      cold: labels.filter((y) => y === 1).length,
      rate: rateTargets.length,
    },
    coldProbability: fitLogisticRegression(CLASSIFIER_FEATURES, classifierRows, labels, options),
    warm: component(0),
    cold: component(1),
    rate: fitGaussianRegression(RATE_FEATURES, rateRows, rateTargets, options),
  };
}

export function createLearnedMixture(model: MixtureModel, name = 'learned-mix'): Predictor {
  const tracker = new FeatureTracker();
  const z = Array.from({ length: GRID }, (_, i) => normalQuantile((i + 0.5) / GRID));

  return {
    name,
    observe: (record, weights) => tracker.observe(record, weights),
    forecast(request): Distribution {
      const features = tracker.features(request);
      const offsets = seedOffsets(features);
      const pCold = predictProbability(model.coldProbability, features.classifier);
      const warm = shift(predictGaussian(model.warm, features.latency), offsets.latency);
      const cold = shift(predictGaussian(model.cold, features.latency), offsets.latency);
      const rate = shift(predictGaussian(model.rate, features.rate), offsets.rate);
      const bits = 8 * request.bytes;
      const latencies = [
        ...z.map((zl) => [Math.exp(warm.mean + warm.sigma * zl), 1 - pCold] as const),
        ...z.map((zl) => [Math.exp(cold.mean + cold.sigma * zl), pCold] as const),
      ];
      const transfers = z.map((zr) => bits / Math.exp(rate.mean + rate.sigma * zr));
      const values: number[] = [];
      const weights: number[] = [];

      // Latency and rate are independent: their measured residual correlation is ≈ 0.1.
      for (const [latency, weight] of latencies) {
        for (const transfer of transfers) {
          values.push(latency + transfer);
          weights.push(weight);
        }
      }

      return weightedEmpiricalDistribution(values, weights);
    },
  };
}

/** Moves a log-space prediction from a correction back onto the seed's own estimate. */
function shift(prediction: { mean: number; sigma: number }, offset: number): { mean: number; sigma: number } {
  return { mean: prediction.mean + offset, sigma: prediction.sigma };
}
