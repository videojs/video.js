import { describe, expect, it } from 'vite-plus/test';

import { pick } from '../pick';

describe('pick', () => {
  it('picks specified keys from object', () => {
    const obj = { a: 1, b: 2, c: 3 };

    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('picks single key', () => {
    const obj = { a: 1, b: 2, c: 3 };

    expect(pick(obj, ['b'])).toEqual({ b: 2 });
  });

  it('returns empty object for empty keys array', () => {
    const obj = { a: 1, b: 2 };

    expect(pick(obj, [])).toEqual({});
  });

  it('ignores non-existent keys', () => {
    const obj = { a: 1, b: 2 };

    expect(pick(obj, ['a', 'nonexistent' as keyof typeof obj])).toEqual({ a: 1 });
  });

  it('handles nested objects (shallow copy)', () => {
    const nested = { a: { x: 1 }, b: { y: 2 } };
    const result = pick(nested, ['a']);

    expect(result).toEqual({ a: { x: 1 } });
    expect(result.a).toBe(nested.a); // Same reference (shallow)
  });

  it('handles all keys', () => {
    const obj = { a: 1, b: 2 };

    expect(pick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
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

    const result = pick(obj, ['str', 'num', 'bool', 'arr', 'nil', 'undef']);

    expect(result).toEqual(obj);
  });

  it('works with readonly keys array', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const keys = ['a', 'c'] as const;

    expect(pick(obj, keys)).toEqual({ a: 1, c: 3 });
  });

  it('does not include non-existent keys as undefined properties', () => {
    const obj = { a: 1 };
    const result = pick(obj, ['a', 'b' as keyof typeof obj]);

    expect(Object.keys(result)).toEqual(['a']);
    expect(result).not.toHaveProperty('b');
  });
});
