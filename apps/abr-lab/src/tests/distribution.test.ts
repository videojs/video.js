import { describe, expect, it } from 'vite-plus/test';

import { downloadTimeDistribution, normalCdf, normalQuantile } from '../distribution.ts';

describe('normalQuantile', () => {
  it('inverts normalCdf', () => {
    for (const p of [0.01, 0.1, 0.5, 0.9, 0.99]) expect(normalCdf(normalQuantile(p))).toBeCloseTo(p, 6);
  });
});

describe('downloadTimeDistribution', () => {
  const distribution = downloadTimeDistribution({
    latencyMs: 50,
    bytes: 1_000_000,
    logRateMean: Math.log(10_000),
    logRateSigma: 0.5,
  });

  it('puts the median at latency plus bytes over the median rate', () => {
    expect(distribution.quantile(0.5)).toBeCloseTo(50 + 8_000_000 / 10_000, 6);
  });

  it('has a cdf consistent with its quantiles', () => {
    for (const p of [0.1, 0.5, 0.9]) expect(distribution.cdf(distribution.quantile(p))).toBeCloseTo(p, 5);
  });

  it('never finishes before the latency', () => {
    expect(distribution.cdf(49)).toBe(0);
  });
});
