import { describe, expect, it, vi } from 'vite-plus/test';

import { defineSlice } from '../slice';

describe('defineSlice', () => {
  it('defers evaluating the state factory until store creation', () => {
    interface Target {
      value: number;
    }

    const factorySpy = vi.fn().mockReturnValue({ count: 0 });

    defineSlice<Target>()({
      state: factorySpy,
    });

    expect(factorySpy).not.toHaveBeenCalled();
  });
});
