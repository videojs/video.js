import { describe, expect, it } from 'vite-plus/test';

import { omit } from '../omit';

describe('omit', () => {
  it('removes specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3 };

    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('removes multiple keys', () => {
    const obj = { a: 1, b: 2, c: 3 };

    expect(omit(obj, ['a', 'c'])).toEqual({ b: 2 });
  });

  it('returns copy of object for empty keys array', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, []);

    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(obj);
  });

  it('ignores non-existent keys', () => {
    const obj = { a: 1, b: 2 };

    expect(omit(obj, ['nonexistent' as keyof typeof obj])).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object when all keys are removed', () => {
    const obj = { a: 1, b: 2 };

    expect(omit(obj, ['a', 'b'])).toEqual({});
  });

  it('handles nested objects (shallow copy)', () => {
    const nested = { a: { x: 1 }, b: { y: 2 }, c: 3 };
    const result = omit(nested, ['c']);

    expect(result).toEqual({ a: { x: 1 }, b: { y: 2 } });
    expect((result as any).a).toBe(nested.a);
  });

  it('preserves value types', () => {
    const obj = {
      str: 'hello',
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      nil: null,
      undef: undefined,
    };

    const result = omit(obj, ['str']);

    expect(result).toEqual({
      num: 42,
      bool: true,
      arr: [1, 2, 3],
      nil: null,
      undef: undefined,
    });
  });

  it('works with readonly keys array', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const keys = ['a', 'c'] as const;

    expect(omit(obj, keys)).toEqual({ b: 2 });
  });
});
