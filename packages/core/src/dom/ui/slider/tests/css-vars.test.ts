import { describe, expect, it } from 'vite-plus/test';

import { createSliderState, createTimeSliderState } from '../../../tests/test-helpers';
import { getSliderCSSVars, getSliderPreviewStyle, getTimeSliderCSSVars } from '../css-vars';

describe('getSliderCSSVars', () => {
  it('returns fill and pointer CSS vars with 3-decimal precision', () => {
    const vars = getSliderCSSVars(createSliderState({ fillPercent: 45.1234, pointerPercent: 67.8 }));

    expect(vars['--media-slider-fill']).toBe('45.123%');
    expect(vars['--media-slider-pointer']).toBe('67.800%');
  });

  it('does not include buffer', () => {
    const vars = getSliderCSSVars(createSliderState());

    expect(vars['--media-slider-buffer']).toBeUndefined();
  });
});

describe('getTimeSliderCSSVars', () => {
  it('includes fill, pointer, and buffer CSS vars', () => {
    const vars = getTimeSliderCSSVars(
      createTimeSliderState({ fillPercent: 50, pointerPercent: 30, bufferPercent: 33.33333 })
    );

    expect(vars['--media-slider-fill']).toBe('50.000%');
    expect(vars['--media-slider-pointer']).toBe('30.000%');
    expect(vars['--media-slider-buffer']).toBe('33.333%');
  });
});

describe('getSliderPreviewStyle', () => {
  it('returns structural positioning properties', () => {
    const style = getSliderPreviewStyle(100, 'clamp');

    expect(style.position).toBe('absolute');
    expect(style.width).toBe('max-content');
    expect(style.pointerEvents).toBe('none');
  });

  it('clamps left within slider bounds by default', () => {
    const style = getSliderPreviewStyle(100, 'clamp');

    expect(style.left).toBe('min(max(0px, calc(var(--media-slider-pointer) - 50px)), calc(100% - 100px))');
  });

  it('uses unclamped calc when overflow is visible', () => {
    const style = getSliderPreviewStyle(100, 'visible');

    expect(style.left).toBe('calc(var(--media-slider-pointer) - 50px)');
    expect(style.left).not.toContain('min(');
  });
});
