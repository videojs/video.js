import { downloadTimeDistribution } from '../distribution.ts';
import { bodyRateBps, latencyMs, type TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';
import { INITIAL_BANDWIDTH_BPS, type Predictor } from './predictor.ts';

export interface LognormalConfig {
  /** Prior spread of log-throughput before any evidence. */
  priorSigma: number;
  /** Smallest weight a new sample gets once evidence has accumulated, so the estimate keeps tracking. */
  minAlpha: number;
  /** Extra log-throughput spread that stale evidence approaches as it ages. */
  driftSigma: number;
  /** Time constant (ms) of that approach. */
  driftTimeMs: number;
  /** Prior request latency before any evidence. */
  priorLatencyMs: number;
  latencyAlpha: number;
  /** Pseudo-count a host needs before its own latency outweighs the pooled one. */
  hostPoolingCount: number;
}

export const DEFAULT_LOGNORMAL_CONFIG: LognormalConfig = {
  priorSigma: 1,
  minAlpha: 0.15,
  driftSigma: 0.6,
  driftTimeMs: 20_000,
  priorLatencyMs: 100,
  latencyAlpha: 0.3,
  hostPoolingCount: 2,
};

/**
 * The seed predictor: download time = latency + bytes / throughput, with log-throughput normal. Throughput level and
 * spread come from an exponentially weighted mean and variance of body rates; the spread widens as evidence ages.
 * Latency is tracked per host and pooled toward the all-host estimate until a host has its own evidence.
 */
export function createLognormal(config: Partial<LognormalConfig> = {}): Predictor {
  const c = { ...DEFAULT_LOGNORMAL_CONFIG, ...config };

  let mean = Math.log(INITIAL_BANDWIDTH_BPS / 1000);
  let variance = c.priorSigma ** 2;
  let count = 1;
  let lastEvidenceAt: number | undefined;

  let pooledLatency = c.priorLatencyMs;
  const hostLatency = new Map<string, { value: number; count: number }>();

  return {
    name: 'lognormal-seed',
    observe(record: TransferRecord, weights: EvidenceWeights) {
      const rate = bodyRateBps(record);

      if (weights.bandwidth > 0 && rate !== undefined) {
        const x = Math.log(rate / 1000);
        const alpha = Math.min(
          1,
          Math.max(weights.bandwidth / (count + weights.bandwidth), c.minAlpha * weights.bandwidth)
        );
        const delta = x - mean;

        mean += alpha * delta;
        variance = Math.max(0.02, (1 - alpha) * (variance + alpha * delta * delta));
        count = Math.min(20, count + weights.bandwidth);
        lastEvidenceAt = record.t.end;
      }

      const latency = latencyMs(record);

      if (weights.latency > 0 && latency !== undefined) {
        const a = c.latencyAlpha * weights.latency;
        const host = hostLatency.get(record.origin.host) ?? { value: pooledLatency, count: 0 };

        pooledLatency += a * (latency - pooledLatency);
        hostLatency.set(record.origin.host, {
          value: host.value + a * (latency - host.value),
          count: host.count + weights.latency,
        });
      }
    },
    forecast({ bytes, host, at }) {
      const age = lastEvidenceAt === undefined ? 0 : Math.max(0, at - lastEvidenceAt);
      const drift = c.driftSigma ** 2 * (1 - Math.exp(-age / c.driftTimeMs));

      const own = hostLatency.get(host);
      const share = own ? own.count / (own.count + c.hostPoolingCount) : 0;
      const latency = share * (own?.value ?? 0) + (1 - share) * pooledLatency;

      return downloadTimeDistribution({
        latencyMs: latency,
        bytes,
        logRateMean: mean,
        logRateSigma: Math.sqrt(variance + drift),
      });
    },
  };
}
