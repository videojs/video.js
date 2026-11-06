import { describe, expect, it } from 'vite-plus/test';

import {
  createBelief,
  lognormalDensity,
  observeLowerBound,
  observeReading,
  observeStored,
  quantile,
} from '../belief.ts';

const prior = () => createBelief(5_000_000, 2.5);

describe('observeReading', () => {
  it('pulls the median to a precise reading', () => {
    const belief = observeReading(prior(), 40_000_000, 0.3);

    expect(quantile(belief, 0.5) / 40_000_000).toBeGreaterThan(0.9);
    expect(quantile(belief, 0.5) / 40_000_000).toBeLessThan(1.1);
  });
});

describe('observeLowerBound', () => {
  it('moves almost all weight above the bound', () => {
    const belief = observeLowerBound(prior(), 10_000_000, 0.2);

    expect(quantile(belief, 0.1)).toBeGreaterThan(8_000_000);
  });
});

describe('observeStored', () => {
  it('follows the stored value until another signal contradicts it', () => {
    const stored = 40_000_000;
    const population = lognormalDensity(stored, 5_000_000, 2.5);
    const trusted = observeStored(prior(), stored, 1, 0.8, population);
    const contradicted = observeReading(trusted, 2_000_000, 0.5);

    expect(quantile(trusted, 0.5)).toBeGreaterThan(20_000_000);
    // The playlist-like reading moves weight to the "moved" branch rather than averaging with the stored value.
    expect(quantile(contradicted, 0.5)).toBeLessThan(3_000_000);
  });
});
