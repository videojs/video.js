import { describe, expect, it } from 'vite-plus/test';

import { isStoreError, StoreError, type StoreErrorCode, type StoreErrorOptions } from '../errors';

describe('StoreError', () => {
  describe('constructor', () => {
    it('creates error with code only', () => {
      const error = new StoreError('DESTROYED');

      expect(error.code).toBe('DESTROYED');
      expect(error.message).toBe('DESTROYED');
      expect(error.name).toBe('StoreError');
      expect(error).toBeInstanceOf(Error);
    });

    it.each([
      { code: 'DESTROYED', options: { message: 'Store was destroyed' }, message: 'Store was destroyed' },
      { code: 'DESTROYED', options: { cause: new Error('original error') }, message: 'DESTROYED' },
      {
        code: 'NO_TARGET',
        options: { message: 'No target attached', cause: new Error('original') },
        message: 'No target attached',
      },
    ] satisfies { code: StoreErrorCode; options: StoreErrorOptions; message: string }[])(
      'supports constructor options $options for $code',
      ({ code, options, message }) => {
        const error = new StoreError(code, options);

        expect(error.code).toBe(code);
        expect(error.message).toBe(message);
        expect(error.cause).toBe('cause' in options ? options.cause : undefined);
      }
    );
  });

  describe('isStoreError', () => {
    it('isStoreError identifies store errors', () => {
      expect(isStoreError(new StoreError('DESTROYED'))).toBe(true);
      expect(isStoreError(new StoreError('NO_TARGET'))).toBe(true);
      expect(isStoreError(new Error('regular'))).toBe(false);
      expect(isStoreError(null)).toBe(false);
    });
  });
});
