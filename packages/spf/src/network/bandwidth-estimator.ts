/**
 * Dual EWMA Bandwidth Estimator
 *
 * Estimates available bandwidth using two EWMA calculations with different half-lives, taking the minimum of both. This
 * approach (from Shaka Player):
 *
 * - **Fast EWMA** (2s half-life): Reacts quickly to bandwidth drops
 * - **Slow EWMA** (5s half-life): Provides stability during fluctuations
 * - **min(fast, slow)**: Adapts down quickly, up slowly
 *
 * This naturally provides asymmetric behavior needed for good QoE: avoiding stalls (quick downgrade) while preventing
 * oscillation (slow upgrade).
 */

import { applyZeroFactor, calculateEwma } from './ewma';

/**
 * Bandwidth estimator state.
 *
 * This state structure will be managed by O1 (State Container). Functions in this module operate on this state
 * immutably.
 */
export interface BandwidthState {
  /** Fast-moving EWMA estimate (raw, uncorrected). */
  fastEstimate: number;
  /** Total weight accumulated in fast EWMA. */
  fastTotalWeight: number;
  /** Slow-moving EWMA estimate (raw, uncorrected). */
  slowEstimate: number;
  /** Total weight accumulated in slow EWMA. */
  slowTotalWeight: number;
  /** Total bytes sampled across all valid samples. */
  bytesSampled: number;
}

/** Configuration for bandwidth estimation. */
export interface BandwidthConfig {
  /** Half-life for fast EWMA in seconds. */
  fastHalfLife: number;
  /** Half-life for slow EWMA in seconds. */
  slowHalfLife: number;
  /** Minimum total bytes before trusting the estimate. */
  minTotalBytes: number;
  /** Minimum bytes per sample to count (filters TTFB-dominated samples). */
  minBytes: number;
  /** Minimum sample duration in ms (filters cached responses). */
  minDuration: number;
}

/**
 * Default bandwidth estimator configuration.
 *
 * Values match Shaka Player defaults based on experimentation.
 */
export const DEFAULT_BANDWIDTH_CONFIG: BandwidthConfig = {
  fastHalfLife: 2, // 2 seconds
  slowHalfLife: 5, // 5 seconds
  minTotalBytes: 128_000, // 128 KB
  minBytes: 16_000, // 16 KB
  minDuration: 5, // 5 ms
};

/**
 * Add a bandwidth sample from a segment download.
 *
 * Samples are filtered based on: - Minimum bytes (filters TTFB-dominated small segments) - Minimum duration (filters
 * cached responses)
 *
 * Valid samples update both fast and slow EWMA estimates.
 *
 * @example
 *   let state = { fastEstimate: 0, fastTotalWeight: 0, ... };
 *   // Sample: 1MB in 1 second
 *   state = sampleBandwidth(state, 1000, 1_000_000);
 *
 * @param state - Current estimator state
 * @param durationMs - Download duration in milliseconds
 * @param numBytes - Number of bytes downloaded
 * @param config - Optional estimator configuration (uses defaults if not provided)
 * @returns New estimator state with sample incorporated (or unchanged if filtered)
 */
export function sampleBandwidth(
  state: BandwidthState,
  durationMs: number,
  numBytes: number,
  config: BandwidthConfig = DEFAULT_BANDWIDTH_CONFIG
): BandwidthState {
  // Always track bytes for startup phase calculation
  const updatedBytesSampled = state.bytesSampled + numBytes;

  // Filter: Ignore samples below minimum bytes (TTFB-dominated)
  // Small segments' download time is mostly connection setup latency,
  // which would artificially lower our bandwidth estimate
  if (numBytes < config.minBytes) {
    return { ...state, bytesSampled: updatedBytesSampled };
  }

  // Filter: Ignore samples faster than minimum duration (cached responses)
  // Cached responses load nearly instantly and would artificially inflate
  // our bandwidth estimate
  if (durationMs < config.minDuration) {
    return { ...state, bytesSampled: updatedBytesSampled };
  }

  // Calculate bandwidth in bits per second
  // Formula: (bytes * 8 bits/byte * 1000 ms/s) / ms = bits/s
  const bandwidth = (8000 * numBytes) / durationMs;

  // Weight by duration in seconds
  // Longer downloads are more reliable indicators of true bandwidth
  const weight = durationMs / 1000;

  return {
    fastEstimate: calculateEwma(state.fastEstimate, bandwidth, weight, config.fastHalfLife),
    fastTotalWeight: state.fastTotalWeight + weight,
    slowEstimate: calculateEwma(state.slowEstimate, bandwidth, weight, config.slowHalfLife),
    slowTotalWeight: state.slowTotalWeight + weight,
    bytesSampled: updatedBytesSampled,
  };
}

/**
 * Get the current bandwidth estimate.
 *
 * Returns the **minimum** of the fast and slow EWMA estimates. This provides the key asymmetric behavior:
 *
 * - When bandwidth drops, fast EWMA reacts first and dominates (quick adaptation)
 * - When bandwidth rises, slow EWMA lags behind and dominates (slow adaptation)
 *
 * Uses default estimate until enough data has been sampled — and when no estimator state exists at all (`state ===
 * undefined`).
 *
 * @example
 *   const estimate = getBandwidthEstimate(state, 5_000_000); // 5 Mbps default
 *
 * @param state - Current estimator state, or `undefined` before any samples have been collected
 * @param defaultEstimate - Fallback estimate before sufficient samples (bps)
 * @param config - Optional estimator configuration (uses defaults if not provided)
 * @returns Bandwidth estimate in bits per second
 */
export function getBandwidthEstimate(
  state: BandwidthState | undefined,
  defaultEstimate: number,
  config: BandwidthConfig = DEFAULT_BANDWIDTH_CONFIG
): number {
  // Use default until we have enough samples to trust our estimate
  if (!state || state.bytesSampled < config.minTotalBytes) {
    return defaultEstimate;
  }

  // Apply zero-factor correction to both estimates
  const fastEstimate = applyZeroFactor(state.fastEstimate, state.fastTotalWeight, config.fastHalfLife);

  const slowEstimate = applyZeroFactor(state.slowEstimate, state.slowTotalWeight, config.slowHalfLife);

  // Take the minimum - this is the key insight from Shaka Player
  // It naturally provides "down quickly, up slowly" behavior
  return Math.min(fastEstimate, slowEstimate);
}

/**
 * Check if the estimator has enough data to provide a reliable estimate.
 *
 * Requires both: - Enough total bytes sampled (minTotalBytes threshold) - At least one valid EWMA sample (totalWeight > 0)
 *
 * @example
 *   if (hasGoodEstimate(state)) {
 *     const estimate = getBandwidthEstimate(state, 5_000_000);
 *   }
 *
 * @param state - Current estimator state
 * @param config - Optional estimator configuration (uses defaults if not provided)
 * @returns True if we've sampled enough bytes to trust the estimate
 */
export function hasGoodEstimate(state: BandwidthState, config: BandwidthConfig = DEFAULT_BANDWIDTH_CONFIG): boolean {
  // Need enough total bytes AND at least one valid EWMA sample
  return state.bytesSampled >= config.minTotalBytes && state.fastTotalWeight > 0 && state.slowTotalWeight > 0;
}
