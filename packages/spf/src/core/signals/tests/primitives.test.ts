import { describe, expect, it } from 'vite-plus/test';

import { signal, update } from '../primitives';

describe('update', () => {
  it('merges a partial object into current state', () => {
    const s = signal({ a: 1, b: 2 });

    update(s, { b: 3 });
    expect(s.get()).toEqual({ a: 1, b: 3 });
  });

  it('applies an updater function with the current state', () => {
    const s = signal({ count: 0 });

    update(s, (current) => ({ ...current, count: current.count + 1 }));
    expect(s.get().count).toBe(1);

    update(s, (current) => ({ ...current, count: current.count + 1 }));
    expect(s.get().count).toBe(2);
  });

  it('empty partial leaves state unchanged', () => {
    const s = signal({ a: 1 });

    update(s, {});
    expect(s.get()).toEqual({ a: 1 });
  });
});
