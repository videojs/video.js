import { describe, expect, it } from 'vite-plus/test';

import { findLastAtOrBefore } from '../find-last-at-or-before';

const items = [{ start: 0 }, { start: 5 }, { start: 10 }];

describe('findLastAtOrBefore', () => {
  it('finds the last item at or before the value', () => {
    expect(findLastAtOrBefore(items, 0, getStart)).toBe(items[0]);
    expect(findLastAtOrBefore(items, 5, getStart)).toBe(items[1]);
    expect(findLastAtOrBefore(items, 10, getStart)).toBe(items[2]);
    expect(findLastAtOrBefore(items, 7, getStart)).toBe(items[1]);
    expect(findLastAtOrBefore(items, 100, getStart)).toBe(items[2]);
  });

  it('returns undefined for empty input', () => {
    expect(findLastAtOrBefore([], 5, getStart)).toBeUndefined();
  });

  it('finds an interior item in a large ordered list', () => {
    const items = Array.from({ length: 1000 }, (_, start) => ({ start }));

    expect(findLastAtOrBefore(items, 500.5, getStart)).toBe(items[500]);
  });

  it('returns undefined before the first item', () => {
    expect(findLastAtOrBefore(items, -1, getStart)).toBeUndefined();
  });
});

function getStart(item: (typeof items)[number]): number {
  return item.start;
}
