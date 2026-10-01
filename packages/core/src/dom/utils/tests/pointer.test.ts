import { describe, expect, it } from 'vite-plus/test';

import { getPercentFromPointerEvent } from '../pointer';

function rect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    top: 0,
    right: 200,
    bottom: 100,
    left: 0,
    toJSON() {},
    ...overrides,
  };
}

function pointer(clientX = 0, clientY = 0) {
  return { clientX, clientY };
}

describe('getPercentFromPointerEvent', () => {
  describe('horizontal', () => {
    it('returns 0 at the left edge', () => {
      expect(getPercentFromPointerEvent(pointer(0), rect(), 'horizontal')).toBe(0);
    });

    it('returns 100 at the right edge', () => {
      expect(getPercentFromPointerEvent(pointer(200), rect(), 'horizontal')).toBe(100);
    });

    it('returns 50 at the midpoint', () => {
      expect(getPercentFromPointerEvent(pointer(100), rect(), 'horizontal')).toBe(50);
    });

    it('clamps below 0', () => {
      expect(getPercentFromPointerEvent(pointer(-10), rect(), 'horizontal')).toBe(0);
    });

    it('clamps above 100', () => {
      expect(getPercentFromPointerEvent(pointer(250), rect(), 'horizontal')).toBe(100);
    });
  });

  describe('vertical', () => {
    it('returns 100 at the top edge', () => {
      expect(getPercentFromPointerEvent(pointer(0, 0), rect(), 'vertical')).toBe(100);
    });

    it('returns 0 at the bottom edge', () => {
      expect(getPercentFromPointerEvent(pointer(0, 100), rect(), 'vertical')).toBe(0);
    });

    it('returns 50 at the midpoint', () => {
      expect(getPercentFromPointerEvent(pointer(0, 50), rect(), 'vertical')).toBe(50);
    });
  });

  describe('zero-sized rect', () => {
    it('returns 0 for zero-width horizontal rect', () => {
      expect(getPercentFromPointerEvent(pointer(50), rect({ width: 0 }), 'horizontal')).toBe(0);
    });

    it('returns 0 for zero-height vertical rect', () => {
      expect(getPercentFromPointerEvent(pointer(0, 0), rect({ height: 0 }), 'vertical')).toBe(0);
    });
  });
});
