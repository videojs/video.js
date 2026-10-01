import { describe, expect, it } from 'vite-plus/test';

import { scaleResolution } from '../resolution';

describe('scaleResolution', () => {
  it('scales both axes', () => {
    expect(scaleResolution({ width: 640, height: 360 }, 2)).toEqual({ width: 1280, height: 720 });
  });

  it('defaults to an unscaled reading', () => {
    expect(scaleResolution({ width: 640, height: 360 })).toEqual({ width: 640, height: 360 });
  });

  it('rounds a fractional result to whole pixels', () => {
    expect(scaleResolution({ width: 321, height: 181 }, 1.5)).toEqual({ width: 482, height: 272 });
  });

  it('reports nothing for a surface with no area', () => {
    expect(scaleResolution({ width: 0, height: 0 }, 2)).toBeUndefined();
    expect(scaleResolution({ width: 640, height: 0 }, 2)).toBeUndefined();
  });

  it('reports nothing for a scale that erases the surface', () => {
    // Rounds to 0 × 0 — a reading of zero is no reading at all.
    expect(scaleResolution({ width: 640, height: 360 }, 0)).toBeUndefined();
  });

  it('reports nothing for a nonsense dimension or scale', () => {
    expect(scaleResolution({ width: Number.NaN, height: 360 })).toBeUndefined();
    expect(scaleResolution({ width: 640, height: 360 }, Number.NaN)).toBeUndefined();
  });

  it('reports nothing for an infinite scaled axis', () => {
    expect.soft(scaleResolution({ width: Infinity, height: 360 })).toBeUndefined();
    expect.soft(scaleResolution({ width: 640, height: Infinity })).toBeUndefined();
    expect.soft(scaleResolution({ width: 640, height: 360 }, Infinity)).toBeUndefined();
    expect.soft(scaleResolution({ width: Number.MAX_VALUE, height: 360 }, 2)).toBeUndefined();
  });
});
