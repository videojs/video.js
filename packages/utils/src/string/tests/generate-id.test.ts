import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { generateId } from '../generate-id';

describe('generateId', () => {
  beforeEach(() => {
    let value = 0;

    vi.spyOn(Date, 'now').mockReturnValue(1738423156789);
    vi.spyOn(Math, 'random').mockImplementation(() => ++value / 1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates IDs in consistent format', () => {
    const id = generateId();

    expect(id).toBe('1738423156789-1000');
  });

  it('uses a fresh random value for each ID at the same timestamp', () => {
    const ids = new Set<string>();

    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }

    expect(ids.size).toBe(100);
  });

  it('uses the timestamp when random values repeat', () => {
    vi.mocked(Math.random).mockReturnValue(0.5);
    const first = generateId();

    vi.mocked(Date.now).mockReturnValue(1738423156790);

    expect(generateId()).not.toBe(first);
  });
});
