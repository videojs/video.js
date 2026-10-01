import { describe, expect, it } from 'vite-plus/test';

import type { BandwidthState } from '../bandwidth-estimator';
import { getBandwidthEstimate, sampleBandwidth } from '../bandwidth-estimator';

// Helper to create initial state
const createInitialState = (): BandwidthState => ({
  fastEstimate: 0,
  fastTotalWeight: 0,
  slowEstimate: 0,
  slowTotalWeight: 0,
  bytesSampled: 0,
});

describe('realistic bandwidth patterns', () => {
  describe('gradual degradation (Wi-Fi signal weakening)', () => {
    it('should track gradual bandwidth decline smoothly', () => {
      let state = createInitialState();

      // Start with good bandwidth
      for (let i = 0; i < 5; i++) {
        state = sampleBandwidth(state, 1000, 100_000); // 800 Kbps
      }

      const initialEstimate = getBandwidthEstimate(state, 500_000);

      // Gradual decline over 10 samples
      const declineSteps = [95_000, 90_000, 85_000, 80_000, 75_000, 70_000, 65_000, 60_000, 55_000, 50_000];
      const estimates: number[] = [];

      for (const bytes of declineSteps) {
        state = sampleBandwidth(state, 1000, bytes);
        estimates.push(getBandwidthEstimate(state, 500_000));
      }

      // Each estimate should be lower than previous (gradual decline)
      for (let i = 1; i < estimates.length; i++) {
        expect(estimates[i]!).toBeLessThan(estimates[i - 1]!);
      }

      // Final estimate should be significantly lower than initial
      expect(estimates[estimates.length - 1]).toBeLessThan(initialEstimate * 0.7);
    });
  });

  describe('network congestion and recovery', () => {
    it('should handle congestion → recovery cycle', () => {
      let state = createInitialState();

      // Normal conditions
      for (let i = 0; i < 8; i++) {
        state = sampleBandwidth(state, 1000, 100_000); // 800 Kbps
      }

      const normalEstimate = getBandwidthEstimate(state, 500_000);

      // Congestion event (3 slow samples)
      for (let i = 0; i < 3; i++) {
        state = sampleBandwidth(state, 1000, 30_000); // 240 Kbps
      }

      const congestedEstimate = getBandwidthEstimate(state, 500_000);

      expect(congestedEstimate).toBeLessThan(normalEstimate * 0.7);

      // Recovery (bandwidth returns to normal)
      for (let i = 0; i < 5; i++) {
        state = sampleBandwidth(state, 1000, 100_000); // 800 Kbps
      }

      const recoveredEstimate = getBandwidthEstimate(state, 500_000);

      // Should recover, but slower than it dropped
      expect(recoveredEstimate).toBeGreaterThan(congestedEstimate);
      expect(recoveredEstimate).toBeLessThan(normalEstimate); // Still conservative
    });
  });

  describe('noisy measurements (real-world variance)', () => {
    it('should smooth out noisy bandwidth measurements', () => {
      let state = createInitialState();

      // Noisy samples around 800 Kbps (±20%)
      const noisySamples = [100_000, 120_000, 90_000, 110_000, 95_000, 105_000, 100_000, 115_000, 85_000, 100_000];

      for (const bytes of noisySamples) {
        state = sampleBandwidth(state, 1000, bytes);
      }

      const estimate = getBandwidthEstimate(state, 500_000);

      // Estimate should be near the mean (800 Kbps), not swinging to extremes
      expect(estimate).toBeGreaterThan(600_000); // Above low outliers
      expect(estimate).toBeLessThan(1_000_000); // Below high outliers
    });

    it('should not be thrown off by single outlier', () => {
      let state = createInitialState();

      // Establish stable estimate
      for (let i = 0; i < 10; i++) {
        state = sampleBandwidth(state, 1000, 100_000); // 800 Kbps
      }

      const beforeOutlier = getBandwidthEstimate(state, 500_000);

      // Single very low outlier
      state = sampleBandwidth(state, 1000, 20_000); // 160 Kbps

      const afterOutlier = getBandwidthEstimate(state, 500_000);

      // Should change, but not dramatically
      // Fast EWMA will react (it's designed to), but slow EWMA provides stability
      expect(afterOutlier).toBeLessThan(beforeOutlier);
      expect(afterOutlier).toBeGreaterThan(beforeOutlier * 0.7); // < 30% drop is reasonable
    });
  });
});

describe('threshold boundary conditions', () => {
  describe('minBytes threshold (16KB)', () => {
    it('should filter sample exactly at minBytes - 1', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 1000, 15_999);

      expect(state.bytesSampled).toBe(15_999);
      expect(state.fastTotalWeight).toBe(0); // Filtered
    });

    it('should accept sample exactly at minBytes', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 1000, 16_000);

      expect(state.bytesSampled).toBe(16_000);
      expect(state.fastTotalWeight).toBeGreaterThan(0); // Accepted
    });

    it('should accept sample at minBytes + 1', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 1000, 16_001);

      expect(state.bytesSampled).toBe(16_001);
      expect(state.fastTotalWeight).toBeGreaterThan(0); // Accepted
    });
  });

  describe('minDuration threshold (5ms)', () => {
    it('should filter sample at minDuration - 1', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 4, 100_000);

      expect(state.bytesSampled).toBe(100_000);
      expect(state.fastTotalWeight).toBe(0); // Filtered (cached)
    });

    it('should accept sample at minDuration', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 5, 100_000);

      expect(state.bytesSampled).toBe(100_000);
      expect(state.fastTotalWeight).toBeGreaterThan(0); // Accepted
    });
  });

  describe('minTotalBytes threshold (128KB)', () => {
    it('should use default when at minTotalBytes - 1', () => {
      let state = createInitialState();

      state = sampleBandwidth(state, 1000, 127_999);

      expect(state.bytesSampled).toBe(127_999);

      const estimate = getBandwidthEstimate(state, 500_000);

      expect(estimate).toBe(500_000); // Uses default
    });

    it('should use actual estimate at minTotalBytes', () => {
      let state = createInitialState();

      // Sample exactly 128KB
      for (let i = 0; i < 8; i++) {
        state = sampleBandwidth(state, 1000, 16_000); // Exactly 128KB total
      }

      expect(state.bytesSampled).toBe(128_000);

      const estimate = getBandwidthEstimate(state, 500_000);

      expect(estimate).not.toBe(500_000); // Uses actual estimate
    });

    it('should transition smoothly at threshold', () => {
      let state = createInitialState();

      // Just below threshold
      for (let i = 0; i < 7; i++) {
        state = sampleBandwidth(state, 1000, 18_000);
      }

      const beforeThreshold = getBandwidthEstimate(state, 1_000_000);

      expect(beforeThreshold).toBe(1_000_000); // Default

      // Cross threshold
      state = sampleBandwidth(state, 1000, 18_000);

      const afterThreshold = getBandwidthEstimate(state, 1_000_000);

      expect(afterThreshold).not.toBe(1_000_000); // Actual estimate
    });
  });
});

describe('mixed sample scenarios', () => {
  it('should handle alternating valid and filtered samples', () => {
    let state = createInitialState();

    // Alternate between valid and too-small samples
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        state = sampleBandwidth(state, 1000, 50_000); // Valid
      } else {
        state = sampleBandwidth(state, 1000, 10_000); // Filtered (too small)
      }
    }

    // Should have 10 valid samples (500KB) and 10 filtered (100KB)
    expect(state.bytesSampled).toBe(600_000);
    expect(state.fastTotalWeight).toBeCloseTo(10, 1); // Only valid samples contribute weight
  });

  it('should handle long gap then sudden samples', () => {
    let state = createInitialState();

    // Initial samples
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 1000, 50_000);
    }

    const beforeGap = state.bytesSampled;

    // Long gap (many filtered samples)
    for (let i = 0; i < 100; i++) {
      state = sampleBandwidth(state, 1000, 1_000); // All filtered
    }

    // Bytes tracked but no weight added during gap
    expect(state.bytesSampled).toBe(beforeGap + 100_000);
    expect(state.fastTotalWeight).toBeCloseTo(5, 1);

    // Sudden burst of valid samples
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 1000, 50_000);
    }

    expect(state.fastTotalWeight).toBeCloseTo(10, 1);
  });

  it('should handle mix of small and large segments', () => {
    let state = createInitialState();

    // Mix of different segment sizes (2s, 4s, 6s durations)
    const samples = [
      { duration: 2000, bytes: 200_000 }, // 2s segment
      { duration: 4000, bytes: 400_000 }, // 4s segment
      { duration: 6000, bytes: 600_000 }, // 6s segment
      { duration: 2000, bytes: 200_000 },
      { duration: 4000, bytes: 400_000 },
    ];

    for (const { duration, bytes } of samples) {
      state = sampleBandwidth(state, duration, bytes);
    }

    // Longer segments should have more weight
    // Total weight = 2 + 4 + 6 + 2 + 4 = 18 seconds
    expect(state.fastTotalWeight).toBeCloseTo(18, 1);
  });
});

describe('zero-factor correction reliability', () => {
  it('should show zero-factor correction diminishes over time', () => {
    let state = createInitialState();

    const corrections: number[] = [];

    // Track correction factor over many samples
    for (let i = 0; i < 20; i++) {
      state = sampleBandwidth(state, 1000, 200_000);

      // Ratio of corrected to uncorrected (approximation)
      const estimate = getBandwidthEstimate(state, 500_000);
      const rawEstimate = state.fastEstimate;
      const correctionRatio = estimate / (rawEstimate || 1);

      corrections.push(correctionRatio);
    }

    expect(corrections[0]).toBeCloseTo(3.41421356, 7);
    // Early corrections should be larger
    expect(corrections[0]!).toBeGreaterThan(corrections[corrections.length - 1]!);

    // Should converge toward 1 (no correction needed)
    expect(corrections[corrections.length - 1]!).toBeCloseTo(1, 0);
  });
});

describe('real-world segment patterns', () => {
  it('should handle startup → steady state → congestion → recovery', () => {
    let state = createInitialState();
    const history: Array<{ phase: string; estimate: number }> = [];

    // Phase 1: Startup (using default estimate, stay below 128KB threshold)
    for (let i = 0; i < 3; i++) {
      state = sampleBandwidth(state, 2000, 30_000); // 3 × 30KB = 90KB < 128KB
    }

    history.push({ phase: 'startup', estimate: getBandwidthEstimate(state, 2_000_000) });

    // Phase 2: Steady state (enough data for real estimate)
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 2000, 30_000); // Now > 128KB total
    }

    history.push({ phase: 'steady', estimate: getBandwidthEstimate(state, 2_000_000) });

    // Phase 3: Congestion (bandwidth drops significantly)
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 4000, 16_000); // Accepted sample at 32 Kbps
    }

    history.push({ phase: 'congestion', estimate: getBandwidthEstimate(state, 2_000_000) });

    // Phase 4: Recovery (bandwidth returns)
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 2000, 30_000); // Back to normal
    }

    history.push({ phase: 'recovery', estimate: getBandwidthEstimate(state, 2_000_000) });

    // Verify phase transitions
    expect(history[0]!.estimate).toBe(2_000_000); // Startup uses default
    expect(history[1]!.estimate).toBeLessThan(2_000_000); // Steady state has real estimate
    expect(history[2]!.estimate).toBeLessThan(history[1]!.estimate);
    expect(history[3]!.estimate).toBeGreaterThan(history[2]!.estimate);
    expect(history[3]!.estimate).toBeLessThanOrEqual(history[1]!.estimate); // Still conservative (or equals)
  });

  it('should handle variable bitrate stream (ABR switching)', () => {
    let state = createInitialState();

    // Simulate ABR ladder switching based on bandwidth
    // High quality segments
    for (let i = 0; i < 5; i++) {
      state = sampleBandwidth(state, 2000, 500_000); // 2 Mbps
    }

    const highEstimate = getBandwidthEstimate(state, 1_000_000);

    // Switch to medium quality (bandwidth dropped)
    for (let i = 0; i < 3; i++) {
      state = sampleBandwidth(state, 2000, 250_000); // 1 Mbps
    }

    const mediumEstimate = getBandwidthEstimate(state, 1_000_000);

    // Switch to low quality (bandwidth dropped more)
    for (let i = 0; i < 2; i++) {
      state = sampleBandwidth(state, 2000, 125_000); // 500 Kbps
    }

    const lowEstimate = getBandwidthEstimate(state, 1_000_000);

    // Estimates should track the quality ladder
    expect(mediumEstimate).toBeLessThan(highEstimate);
    expect(lowEstimate).toBeLessThan(mediumEstimate);
  });

  it('should handle live stream with consistent segment timing', () => {
    let state = createInitialState();

    // Live stream: 2-second segments arriving regularly
    const segmentDuration = 2000;
    const estimates: number[] = [];

    // Deterministic variance pattern (realistic but predictable)
    const variancePattern = [10_000, -5_000, 15_000, -10_000, 8_000, -3_000, 12_000, -8_000, 5_000, -12_000];

    // Simulate 30 segments (1 minute of playback)
    for (let i = 0; i < 30; i++) {
      // Slight variance in bytes (realistic network conditions)
      const baseBytes = 250_000;
      const variance = variancePattern[i % variancePattern.length]!; // ±10% pattern
      const bytes = baseBytes + variance;

      state = sampleBandwidth(state, segmentDuration, bytes);

      if (i % 5 === 0) {
        estimates.push(getBandwidthEstimate(state, 1_000_000));
      }
    }

    // Estimates should stabilize over time
    const earlyVariance = Math.abs(estimates[1]! - estimates[0]!);
    const lateVariance = Math.abs(estimates[estimates.length - 1]! - estimates[estimates.length - 2]!);

    expect(lateVariance).toBeLessThan(earlyVariance); // More stable later
  });
});
