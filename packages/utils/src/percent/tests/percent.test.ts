import { describe, expect, it } from 'vite-plus/test';

import { formatPercent } from '../percent';

describe('formatPercent', () => {
  it('uses Intl percent style', () => {
    expect(formatPercent(0.75)).toMatch(/75/);
    expect(formatPercent(0.75)).toMatch(/%/);
  });

  it('clamps to 0-100%', () => {
    expect(formatPercent(-1, 'en')).toBe('0%');
    expect(formatPercent(0, 'en')).toBe('0%');
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(formatPercent(2, 'en')).toBe('100%');
  });

  it('handles invalid fraction', () => {
    expect(formatPercent(Number.NaN, 'en')).toBe('0%');
  });

  it('falls back when locale is invalid', () => {
    expect(formatPercent(0.75, 'not-a-invalid-bcp47-tag!!!')).toBe('75%');
  });
});
