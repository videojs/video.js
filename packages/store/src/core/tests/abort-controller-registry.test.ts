import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { AbortControllerRegistry } from '../abort-controller-registry';

const NativeAbortController = globalThis.AbortController;

/** Counts controller constructions so lazy creation can be asserted. */
function countControllers() {
  const counter = { count: 0 };

  class CountingAbortController extends NativeAbortController {
    constructor() {
      super();
      counter.count++;
    }
  }

  vi.stubGlobal('AbortController', CountingAbortController);

  return counter;
}

describe('AbortControllerRegistry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('does not construct an AbortController', () => {
      const controllers = countControllers();

      new AbortControllerRegistry();

      expect(controllers.count).toBe(0);
    });

    it('constructs an AbortController on first base read', () => {
      const controllers = countControllers();
      const signals = new AbortControllerRegistry();

      void signals.base;
      void signals.base;

      expect(controllers.count).toBe(1);
    });
  });

  describe('base', () => {
    it('is not aborted initially', () => {
      const signals = new AbortControllerRegistry();

      expect(signals.base).toBeInstanceOf(AbortSignal);
      expect(signals.base.aborted).toBe(false);
    });

    it('is not aborted when reset() runs before it is read', () => {
      const signals = new AbortControllerRegistry();

      signals.reset();

      expect(signals.base.aborted).toBe(false);
    });
  });

  describe('clear', () => {
    it('does not abort base', () => {
      const signals = new AbortControllerRegistry();
      const base = signals.base;

      signals.supersede('test');

      signals.clear();

      expect(base.aborted).toBe(false);
    });

    it('clears all keyed signals', () => {
      const signals = new AbortControllerRegistry();
      const signal1 = signals.supersede('key1');
      const signal2 = signals.supersede('key2');

      signals.clear();

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
    });
  });

  describe('reset', () => {
    it('does not construct an AbortController when base was never read', () => {
      const controllers = countControllers();
      const signals = new AbortControllerRegistry();

      signals.reset();

      expect(controllers.count).toBe(0);
    });

    it('aborts base signal', () => {
      const signals = new AbortControllerRegistry();
      const base = signals.base;

      signals.reset();

      expect(base.aborted).toBe(true);
    });

    it('aborts keyed signals', () => {
      const signals = new AbortControllerRegistry();
      const signal = signals.supersede('test');

      signals.reset();

      expect(signal.aborted).toBe(true);
    });

    it('creates new base signal', () => {
      const signals = new AbortControllerRegistry();
      const base1 = signals.base;

      signals.reset();

      const base2 = signals.base;

      expect(base1).not.toBe(base2);
      expect(base2.aborted).toBe(false);
    });
  });

  describe('supersede', () => {
    it('aborts previous signal for same key', () => {
      const signals = new AbortControllerRegistry();
      const signal1 = signals.supersede('seek');

      const signal2 = signals.supersede('seek');

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });

    it('does not abort signals with different keys', () => {
      const signals = new AbortControllerRegistry();
      const signal1 = signals.supersede('key1');
      const signal2 = signals.supersede('key2');

      expect(signal1).toBeInstanceOf(AbortSignal);
      expect(signal2).toBeInstanceOf(AbortSignal);
      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(false);
    });

    it('supports symbol keys', () => {
      const signals = new AbortControllerRegistry();
      const key = Symbol('test');
      const signal1 = signals.supersede(key);
      const signal2 = signals.supersede(key);

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });

    it('allows reusing key after clear()', () => {
      const signals = new AbortControllerRegistry();
      const signal1 = signals.supersede('test');

      signals.clear();

      const signal2 = signals.supersede('test');

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });
  });
});
