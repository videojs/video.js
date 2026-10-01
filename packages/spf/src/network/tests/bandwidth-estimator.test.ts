import { describe, expect, it } from 'vite-plus/test';

import type { BandwidthState } from '../bandwidth-estimator';
import { DEFAULT_BANDWIDTH_CONFIG, getBandwidthEstimate, sampleBandwidth } from '../bandwidth-estimator';

// Helper to create initial state (O1 will do this in real usage)
const createInitialState = (): BandwidthState => ({
  fastEstimate: 0,
  fastTotalWeight: 0,
  slowEstimate: 0,
  slowTotalWeight: 0,
  bytesSampled: 0,
});

describe('sampleBandwidth', () => {
  it('should add valid bandwidth sample', () => {
    let state = createInitialState();

    // Sample: 1MB in 1 second = 8 Mbps
    state = sampleBandwidth(state, 1000, 1_000_000);

    expect(state.bytesSampled).toBe(1_000_000);
    expect(state.fastTotalWeight).toBe(1);
    expect(state.slowTotalWeight).toBe(1);
  });

  it('should filter samples below minBytes threshold', () => {
    let state = createInitialState();

    // Sample below default minBytes (16KB)
    state = sampleBandwidth(state, 100, 10_000);

    // Bytes should be tracked but not sampled into EWMA
    expect(state.bytesSampled).toBe(10_000);
    expect(state.fastTotalWeight).toBe(0);
    expect(state.slowTotalWeight).toBe(0);
  });

  it.each([2, -100])('should filter samples below minDuration threshold: %s ms', (duration) => {
    let state = createInitialState();

    // Sample below default minDuration (5ms)
    state = sampleBandwidth(state, duration, 100_000);

    expect(state.fastEstimate).toBe(0);
    expect(state.slowEstimate).toBe(0);
    // Bytes tracked but not sampled (likely cached response)
    expect(state.bytesSampled).toBe(100_000);
    expect(state.fastTotalWeight).toBe(0);
    expect(state.slowTotalWeight).toBe(0);
  });

  it('should accept custom config for filtering', () => {
    let state = createInitialState();

    const config = {
      ...DEFAULT_BANDWIDTH_CONFIG,
      minBytes: 1000, // Lower threshold
    };

    // This would be filtered with default config but not with custom
    state = sampleBandwidth(state, 100, 5_000, config);

    expect(state.bytesSampled).toBe(5_000);
    expect(state.fastTotalWeight).toBeGreaterThan(0);
  });

  it('should calculate bandwidth in bits per second', () => {
    let state = createInitialState();

    // 1MB in 1 second = 8 Mbps
    state = sampleBandwidth(state, 1000, 1_000_000);

    // Both estimates should be around 8_000_000 bps
    const estimate = getBandwidthEstimate(state, 1_000_000);

    expect(estimate).toBeCloseTo(8_000_000, -5);
  });

  it('should weight samples by duration', () => {
    let state = createInitialState();

    // Short download: 100KB in 100ms
    state = sampleBandwidth(state, 100, 100_000);

    // Long download: 1MB in 1000ms (same bandwidth)
    state = sampleBandwidth(state, 1000, 1_000_000);

    // Total weight should reflect longer download more
    expect(state.fastTotalWeight).toBeCloseTo(1.1, 1);
  });

  it('should update both fast and slow EWMA', () => {
    let state = createInitialState();

    state = sampleBandwidth(state, 1000, 1_000_000);

    // Both should have samples
    expect(state.fastEstimate).toBeGreaterThan(0);
    expect(state.slowEstimate).toBeGreaterThan(0);
  });

  it('should accumulate bytesSampled across all samples', () => {
    let state = createInitialState();

    state = sampleBandwidth(state, 1000, 100_000);
    state = sampleBandwidth(state, 1000, 200_000);
    state = sampleBandwidth(state, 1000, 300_000);

    expect(state.bytesSampled).toBe(600_000);
  });
});

describe('getBandwidthEstimate', () => {
  it('should return default estimate when state is undefined', () => {
    const estimate = getBandwidthEstimate(undefined, 5_000_000);

    expect(estimate).toBe(5_000_000);
  });

  it('should return default estimate when insufficient data', () => {
    const state = createInitialState();

    const estimate = getBandwidthEstimate(state, 5_000_000);

    expect(estimate).toBe(5_000_000);
  });

  it('should keep startup fallback when cached samples exceed the byte threshold', () => {
    const state = sampleBandwidth(createInitialState(), 2, 200_000);

    const estimate = getBandwidthEstimate(state, 5_000_000);

    expect(estimate).toBe(5_000_000);
  });

  it('should return actual estimate when sufficient data', () => {
    let state = createInitialState();

    // Sample enough data (default minTotalBytes is 128KB)
    for (let i = 0; i < 10; i++) {
      state = sampleBandwidth(state, 1000, 20_000); // 20KB each = 200KB total
    }

    const estimate = getBandwidthEstimate(state, 1_000_000);

    // Should not return default
    expect(estimate).not.toBe(1_000_000);
    expect(estimate).toBeGreaterThan(0);
  });

  it.each([
    { fastEstimate: 1_937_500, slowEstimate: 3_000_000 },
    { fastEstimate: 3_875_000, slowEstimate: 1_500_000 },
  ])('should return minimum of fast and slow estimates: %o', (estimates) => {
    const state: BandwidthState = {
      ...estimates,
      fastTotalWeight: 10,
      slowTotalWeight: 10,
      bytesSampled: 200_000,
    };

    expect(getBandwidthEstimate(state, 500_000)).toBeCloseTo(2_000_000, 5);
  });

  it('should use custom minTotalBytes threshold', () => {
    let state = createInitialState();

    // Sample 50KB (below default 128KB threshold)
    state = sampleBandwidth(state, 1000, 50_000);

    const config = {
      ...DEFAULT_BANDWIDTH_CONFIG,
      minTotalBytes: 40_000, // Lower threshold
    };

    const estimate = getBandwidthEstimate(state, 1_000_000, config);

    // Should use actual estimate, not default
    expect(estimate).not.toBe(1_000_000);
  });

  it('should handle zero-factor correction properly', () => {
    let state = createInitialState();

    // Single sample
    state = sampleBandwidth(state, 1000, 200_000);

    const estimate = getBandwidthEstimate(state, 500_000);

    // With zero-factor correction, estimate should match actual bandwidth
    // 200KB in 1s = 1.6 Mbps
    expect(estimate).toBeCloseTo(1_600_000, -4);

    for (let i = 0; i < 20; i++) state = sampleBandwidth(state, 1000, 200_000);

    expect(state.fastTotalWeight).toBe(21);
    expect(state.slowTotalWeight).toBe(21);
    expect(getBandwidthEstimate(state, 500_000)).toBeCloseTo(1_600_000, -4);
  });
});

describe('dual EWMA behavior', () => {
  it.each([
    { warmups: 5, initialBytes: 100_000, samples: 2, nextBytes: 25_000, bound: 0.7 },
    { warmups: 8, initialBytes: 100_000, samples: 2, nextBytes: 50_000, bound: 0.8 },
    { warmups: 10, initialBytes: 200_000, samples: 3, nextBytes: 50_000, bound: 0.6 },
  ])('should adapt down quickly when bandwidth drops: %o', ({ warmups, initialBytes, samples, nextBytes, bound }) => {
    let state = createInitialState();

    for (let i = 0; i < warmups; i++) state = sampleBandwidth(state, 1000, initialBytes);

    const highEstimate = getBandwidthEstimate(state, 500_000);

    for (let i = 0; i < samples; i++) state = sampleBandwidth(state, 1000, nextBytes);

    expect(getBandwidthEstimate(state, 500_000)).toBeLessThan(highEstimate * bound);
  });

  it.each([
    { warmups: 8, initialBytes: 20_000, nextBytes: 100_000, ceiling: 800_000 },
    { warmups: 10, initialBytes: 50_000, nextBytes: 200_000, ceiling: 1_600_000 },
  ])('should adapt up slowly when bandwidth rises: %o', ({ warmups, initialBytes, nextBytes, ceiling }) => {
    let state = createInitialState();

    for (let i = 0; i < warmups; i++) state = sampleBandwidth(state, 1000, initialBytes);

    const lowEstimate = getBandwidthEstimate(state, 500_000);

    for (let i = 0; i < 3; i++) state = sampleBandwidth(state, 1000, nextBytes);

    const risingEstimate = getBandwidthEstimate(state, 500_000);

    expect(risingEstimate).toBeGreaterThan(lowEstimate);
    expect(risingEstimate).toBeLessThan(ceiling);
  });

  it('should converge to stable value with consistent bandwidth', () => {
    let state = createInitialState();

    // Many samples at same bandwidth
    for (let i = 0; i < 20; i++) {
      state = sampleBandwidth(state, 1000, 100_000); // 800 Kbps
    }

    const estimate = getBandwidthEstimate(state, 500_000);

    // Should converge to actual bandwidth
    expect(estimate).toBeCloseTo(800_000, -4);
  });
});

describe('edge cases', () => {
  it('should handle very large downloads', () => {
    let state = createInitialState();

    // 10MB in 5 seconds
    state = sampleBandwidth(state, 5000, 10_000_000);

    expect(state.bytesSampled).toBe(10_000_000);
    expect(state.fastTotalWeight).toBeGreaterThan(0);
  });

  it('should handle zero bytes gracefully', () => {
    let state = createInitialState();

    state = sampleBandwidth(state, 1000, 0);

    expect(state.bytesSampled).toBe(0);
    expect(state.fastTotalWeight).toBe(0);
  });
});
