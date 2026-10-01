import { describe, expect, it } from 'vite-plus/test';

import { resolutionArea } from '../quality-selection';

describe('resolutionArea', () => {
  it('returns the pixel count (width × height)', () => {
    expect(resolutionArea({ width: 1920, height: 1080 })).toBe(2_073_600);
  });

  it('treats a missing dimension as 0', () => {
    expect(resolutionArea({ width: 1920 })).toBe(0);
    expect(resolutionArea({ height: 1080 })).toBe(0);
    expect(resolutionArea({})).toBe(0);
  });
});
