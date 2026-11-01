import { pointDistribution } from '../distribution.ts';
import { durationMs, type TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';
import { INITIAL_BANDWIDTH_BPS, type Predictor } from './predictor.ts';

/**
 * Robust MPC's estimator: the harmonic mean of the last `window` whole-transfer rates (bytes over start-to-end time, so
 * latency is folded in). Only transfers the regime model treats as network evidence count.
 */
export function createHarmonicMean(window = 5): Predictor {
  const rates: number[] = [];

  return {
    name: `harmonic-mean-${window}`,
    observe(record: TransferRecord, weights: EvidenceWeights) {
      const duration = durationMs(record);
      if (weights.bandwidth < 1 || duration === undefined || duration <= 0) return;

      rates.push((8000 * record.bytes) / duration);

      if (rates.length > window) rates.shift();
    },
    forecast({ bytes }) {
      const bps = rates.length === 0 ? INITIAL_BANDWIDTH_BPS : rates.length / rates.reduce((sum, r) => sum + 1 / r, 0);

      return pointDistribution((8000 * bytes) / bps);
    },
  };
}
