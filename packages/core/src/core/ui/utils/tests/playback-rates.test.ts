import { describe, expect, it } from 'vite-plus/test';

import { insertPlaybackRate, parsePlaybackRates } from '../playback-rates';

describe('parsePlaybackRates', () => {
  it('keeps the author order', () => {
    expect(parsePlaybackRates([2, 1, 0.5])).toEqual([2, 1, 0.5]);
  });

  it('parses a space-separated list', () => {
    expect(parsePlaybackRates(' 0.5  1 1.5 ')).toEqual([0.5, 1, 1.5]);
  });

  it('drops invalid and repeated rates', () => {
    expect(parsePlaybackRates([1, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1, 2])).toEqual([1, 2]);
  });

  it.each([undefined, null, '', '   ', 'fast', [0]])('returns undefined for %j', (value) => {
    expect(parsePlaybackRates(value)).toBeUndefined();
  });
});

describe('insertPlaybackRate', () => {
  it('slots the rate before the first faster rate', () => {
    expect(insertPlaybackRate([0.5, 1, 1.5], 1.1)).toEqual([0.5, 1, 1.1, 1.5]);
  });

  it('appends a rate faster than every rate', () => {
    expect(insertPlaybackRate([0.5, 1], 3)).toEqual([0.5, 1, 3]);
  });

  it('returns the same list when it already holds the rate', () => {
    const rates = [0.5, 1];

    expect(insertPlaybackRate(rates, 1)).toBe(rates);
  });
});
