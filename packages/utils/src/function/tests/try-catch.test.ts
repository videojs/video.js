import { describe, expect, it, vi } from 'vite-plus/test';

import { tryCatch } from '../try-catch';

describe('tryCatch', () => {
  it('returns undefined if fn is undefined', () => {
    expect(tryCatch(undefined)).toBeUndefined();
  });

  it('returns undefined if fn is null', () => {
    // @ts-expect-error - testing null input
    expect(tryCatch(null)).toBeUndefined();
  });

  it('calls the wrapped function with arguments', () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const wrapped = tryCatch(fn);

    const result = wrapped?.(1, 2);

    expect(fn).toHaveBeenCalledWith(1, 2);
    expect(result).toBe(3);
  });

  it('returns the function result when no error', () => {
    const fn = () => 'result';
    const wrapped = tryCatch(fn);

    expect(wrapped?.()).toBe('result');
  });

  it('catches errors and calls onError', () => {
    const error = new Error('test error');
    const fn = () => {
      throw error;
    };
    const onError = vi.fn();

    const wrapped = tryCatch(fn, onError);
    const result = wrapped?.();

    expect(onError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });

  it('uses console.error as default onError', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('test error');
    const fn = () => {
      throw error;
    };

    const wrapped = tryCatch(fn);

    wrapped?.();

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });

  it('preserves function type signature', () => {
    const fn = (name: string, age: number): string => `${name} is ${age}`;
    const wrapped = tryCatch(fn);

    // TypeScript should infer correct types
    const result: string | undefined = wrapped?.('Alice', 30);

    expect(result).toBe('Alice is 30');
  });
});
