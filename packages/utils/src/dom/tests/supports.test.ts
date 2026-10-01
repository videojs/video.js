import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { supportsAnimationFrame, supportsConstructableStyleSheets, supportsIdleCallback } from '../supports';

describe('supports', () => {
  describe('supportsAnimationFrame', () => {
    it('returns true in browser environment', () => {
      expect(supportsAnimationFrame()).toBe(true);
    });
  });

  describe('supportsIdleCallback', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('detects whether the native request function is available', () => {
      vi.stubGlobal('requestIdleCallback', vi.fn());
      expect(supportsIdleCallback()).toBe(true);

      vi.stubGlobal('requestIdleCallback', undefined);
      expect(supportsIdleCallback()).toBe(false);
    });
  });

  describe('supportsConstructableStyleSheets', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns true when CSSStyleSheet can be constructed', () => {
      expect(supportsConstructableStyleSheets()).toBe(true);
    });

    it('returns false when CSSStyleSheet is missing', () => {
      vi.stubGlobal('CSSStyleSheet', undefined);

      expect(supportsConstructableStyleSheets()).toBe(false);
    });

    it('returns false when constructing CSSStyleSheet throws', () => {
      vi.stubGlobal(
        'CSSStyleSheet',
        class {
          constructor() {
            throw new TypeError('Illegal constructor');
          }
        }
      );

      expect(supportsConstructableStyleSheets()).toBe(false);
    });
  });
});
