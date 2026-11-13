import { describe, expect, it } from 'vite-plus/test';

import { clamp, roundToStep, toPercent } from '../number';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('handles negative ranges', () => {
    expect(clamp(0, -10, -5)).toBe(-5);
    expect(clamp(-20, -10, -5)).toBe(-10);
  });
});

describe('toPercent', () => {
  it('converts a value within a range', () => {
    expect(toPercent(30, 20, 60)).toBe(25);
  });

  it('clamps values outside the range', () => {
    expect(toPercent(10, 20, 60)).toBe(0);
    expect(toPercent(70, 20, 60)).toBe(100);
  });

  it('returns zero for an invalid range', () => {
    expect(toPercent(10, 10, 10)).toBe(0);
    expect(toPercent(10, 20, 10)).toBe(0);
    expect(toPercent(10, 0, Number.POSITIVE_INFINITY)).toBe(0);
    expect(toPercent(10, 0, Number.NaN)).toBe(0);
  });
});

describe('roundToStep', () => {
  it('rounds to nearest step from min', () => {
    expect(roundToStep(7, 5, 0)).toBe(5);
    expect(roundToStep(8, 5, 0)).toBe(10);
  });

  it('respects min offset', () => {
    expect(roundToStep(4, 5, 2)).toBe(2);
    expect(roundToStep(6, 5, 2)).toBe(7);
  });

  it('handles decimal steps', () => {
    expect(roundToStep(0.35, 0.1, 0)).toBe(0.3);
    expect(roundToStep(0.36, 0.1, 0)).toBe(0.4);
    expect(roundToStep(0.14, 0.1, 0)).toBe(0.1);
  });

  it('keeps the decimals of min when it has more than step', () => {
    expect(roundToStep(0.7, 0.5, 0.25)).toBe(0.75);
    expect(roundToStep(0.27, 0.1, 0.05)).toBe(0.25);
  });

  it('returns min when value equals min', () => {
    expect(roundToStep(0, 1, 0)).toBe(0);
    expect(roundToStep(5, 10, 5)).toBe(5);
  });
});
