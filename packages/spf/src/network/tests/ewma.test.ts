import { describe, expect, it } from 'vite-plus/test';

import { applyZeroFactor, calculateAlpha, calculateEwma } from '../ewma';

describe('calculateAlpha', () => {
  it('should calculate correct alpha for 2-second half-life', () => {
    // alpha = exp(ln(0.5) / halfLife)
    // For halfLife = 2: alpha ≈ 0.7071
    const alpha = calculateAlpha(2);

    expect(alpha).toBeCloseTo(Math.SQRT1_2, 4);
  });

  it('should calculate correct alpha for 5-second half-life', () => {
    // For halfLife = 5: alpha ≈ 0.8706
    const alpha = calculateAlpha(5);

    expect(alpha).toBeCloseTo(0.8706, 4);
  });

  it('should produce smaller alpha for shorter half-life', () => {
    // Shorter half-life = faster decay = smaller alpha
    const shortAlpha = calculateAlpha(1);
    const longAlpha = calculateAlpha(10);

    expect(shortAlpha).toBeLessThan(longAlpha);
  });

  it('should handle very short half-life', () => {
    const alpha = calculateAlpha(0.1);

    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);
  });

  it('should handle very long half-life', () => {
    const alpha = calculateAlpha(100);

    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);
    expect(alpha).toBeCloseTo(1, 1); // Should be very close to 1
  });
});

describe('calculateEwma', () => {
  it('should calculate weighted moving average', () => {
    const halfLife = 2;
    const alpha = calculateAlpha(halfLife);
    const weight = 1;

    // Starting from 1M, sample 2M with weight 1
    const result = calculateEwma(1_000_000, 2_000_000, weight, halfLife);

    // Result should be between 1M and 2M
    expect(result).toBeGreaterThan(1_000_000);
    expect(result).toBeLessThan(2_000_000);

    // Manual calculation: adjAlpha = alpha^weight
    const adjAlpha = alpha ** weight;
    const expected = 2_000_000 * (1 - adjAlpha) + adjAlpha * 1_000_000;

    expect(result).toBeCloseTo(expected, 2);
  });

  it('should handle weight of 0', () => {
    // Weight 0 means no influence from new value
    const result = calculateEwma(1_000_000, 2_000_000, 0, 2);

    // With weight 0, adjAlpha = alpha^0 = 1, so estimate stays same
    expect(result).toBeCloseTo(1_000_000, 2);
  });

  it('should increase weight influence with larger weight values', () => {
    // Low weight
    const lowWeight = calculateEwma(1_000_000, 2_000_000, 0.1, 2);

    // High weight
    const highWeight = calculateEwma(1_000_000, 2_000_000, 5, 2);

    // Higher weight should move estimate more toward new value
    expect(highWeight).toBeGreaterThan(lowWeight);
  });

  it('should adapt faster with shorter half-life', () => {
    // Short half-life (fast adaptation)
    const fast = calculateEwma(1_000_000, 2_000_000, 1, 1);

    // Long half-life (slow adaptation)
    const slow = calculateEwma(1_000_000, 2_000_000, 1, 10);

    // Fast should be closer to new value
    expect(fast).toBeGreaterThan(slow);
  });

  it('should converge toward new value with repeated samples', () => {
    let estimate = 1_000_000;

    // Sample 2M repeatedly with half-life 2
    for (let i = 0; i < 20; i++) {
      estimate = calculateEwma(estimate, 2_000_000, 1, 2);
    }

    // Should converge very close to 2M (within 0.5%)
    expect(estimate).toBeCloseTo(2_000_000, -4);
  });

  it('should handle identical previous and new values', () => {
    const result = calculateEwma(1_000_000, 1_000_000, 1, 2);

    // Should remain unchanged
    expect(result).toBeCloseTo(1_000_000, 2);
  });

  it('should handle negative values', () => {
    // While bandwidth is never negative, the math should still work
    const result = calculateEwma(-1_000_000, -2_000_000, 1, 2);

    expect(result).toBeLessThan(-1_000_000);
    expect(result).toBeGreaterThan(-2_000_000);
  });

  it('should return NaN for invalid inputs gracefully', () => {
    const result = calculateEwma(NaN, 1_000_000, 1, 2);

    expect(result).toBeNaN();
  });
});

describe('applyZeroFactor', () => {
  it('should apply zero-factor correction', () => {
    const halfLife = 2;

    // Single sample: estimate before correction
    const rawEstimate = calculateEwma(0, 1_000_000, 1, halfLife);

    // Apply zero-factor correction
    const corrected = applyZeroFactor(rawEstimate, 1, halfLife);

    // Corrected should be closer to actual value (1M)
    expect(corrected).toBeGreaterThan(rawEstimate);
    expect(corrected).toBeCloseTo(1_000_000, -3);
  });

  it('should return estimate unchanged when totalWeight is 0', () => {
    const result = applyZeroFactor(1_000_000, 0, 2);

    // zeroFactor = 1 - alpha^0 = 1 - 1 = 0, so we'd divide by zero
    // Implementation should handle this (return estimate or 0)
    expect(result).toBe(0);
  });

  it('should approach 1x multiplier with high totalWeight', () => {
    const halfLife = 2;
    let estimate = 0;
    let totalWeight = 0;

    // Add many samples
    for (let i = 0; i < 20; i++) {
      estimate = calculateEwma(estimate, 1_000_000, 1, halfLife);
      totalWeight += 1;
    }

    const corrected = applyZeroFactor(estimate, totalWeight, halfLife);
    const uncorrected = estimate;

    // With high weight, correction should be minimal
    const ratio = corrected / uncorrected;

    expect(ratio).toBeCloseTo(1, 1);
  });

  it('should correct bias from starting at zero', () => {
    const halfLife = 5;

    // Simulate a few samples starting from 0
    let estimate = 0;
    let totalWeight = 0;

    estimate = calculateEwma(estimate, 1_000_000, 1, halfLife);
    totalWeight += 1;

    estimate = calculateEwma(estimate, 1_000_000, 1, halfLife);
    totalWeight += 1;

    estimate = calculateEwma(estimate, 1_000_000, 1, halfLife);
    totalWeight += 1;

    const corrected = applyZeroFactor(estimate, totalWeight, halfLife);

    // Corrected should be closer to true value (1M) than uncorrected
    expect(Math.abs(corrected - 1_000_000)).toBeLessThan(Math.abs(estimate - 1_000_000));
  });

  it('should calculate zero factor correctly', () => {
    const halfLife = 2;
    const alpha = calculateAlpha(halfLife);
    const totalWeight = 3;

    // Manual calculation
    const expectedZeroFactor = 1 - alpha ** totalWeight;
    const estimate = 500_000;
    const expectedResult = estimate / expectedZeroFactor;

    const result = applyZeroFactor(estimate, totalWeight, halfLife);

    expect(result).toBeCloseTo(expectedResult, 2);
  });

  it('should handle very small totalWeight', () => {
    const result = applyZeroFactor(1_000_000, 0.001, 2);

    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should handle very large totalWeight', () => {
    const result = applyZeroFactor(1_000_000, 1000, 2);

    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('should match uncorrected estimate with infinite weight', () => {
    // With very high weight, zero factor approaches 1
    const estimate = 1_000_000;
    const corrected = applyZeroFactor(estimate, 10000, 2);

    // Should be very close to uncorrected estimate
    expect(corrected).toBeCloseTo(estimate, 0);
  });
});

describe('EWMA integration', () => {
  it('should converge to stable value with many samples', () => {
    const halfLife = 2;
    let estimate = 0;
    let totalWeight = 0;

    // Many samples at same value
    for (let i = 0; i < 30; i++) {
      estimate = calculateEwma(estimate, 1_000_000, 1, halfLife);
      totalWeight += 1;
    }

    const corrected = applyZeroFactor(estimate, totalWeight, halfLife);

    // Should converge very close to sample value
    expect(corrected).toBeCloseTo(1_000_000, -2);
  });

  it('should handle varying sample values', () => {
    const halfLife = 5;
    let estimate = 0;
    let totalWeight = 0;

    // Alternating values
    const samples = [1_000_000, 2_000_000, 1_500_000, 1_800_000, 1_600_000];

    for (const value of samples) {
      estimate = calculateEwma(estimate, value, 1, halfLife);
      totalWeight += 1;
    }

    const corrected = applyZeroFactor(estimate, totalWeight, halfLife);

    // Should be in reasonable range
    expect(corrected).toBeGreaterThan(1_000_000);
    expect(corrected).toBeLessThan(2_000_000);
  });
});
