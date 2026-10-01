import { describe, expect, it } from 'vite-plus/test';

import { SliderCore, type SliderInput } from '../core';

function createInput(overrides: Partial<SliderInput> = {}): SliderInput {
  return {
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
    ...overrides,
  };
}

describe('SliderCore', () => {
  describe('defaultProps', () => {
    it('has expected defaults', () => {
      expect(SliderCore.defaultProps).toEqual({
        label: '',
        value: 0,
        min: 0,
        max: 100,
        step: 1,
        largeStep: 10,
        orientation: 'horizontal',
        disabled: false,
        thumbAlignment: 'center',
      });
    });
  });

  describe('getSliderState', () => {
    it('returns state with defaults', () => {
      const core = new SliderCore();

      core.setInput(createInput());
      const state = core.getSliderState(50);

      expect(state.value).toBe(50);
      expect(state.fillPercent).toBe(50);
      expect(state.pointerPercent).toBe(0);
      expect(state.dragging).toBe(false);
      expect(state.pointing).toBe(false);
      expect(state.interactive).toBe(false);
      expect(state.orientation).toBe('horizontal');
      expect(state.disabled).toBe(false);
      expect(state.thumbAlignment).toBe('center');
    });

    it('computes fillPercent from value', () => {
      const core = new SliderCore({ min: 0, max: 200 });

      core.setInput(createInput());
      const state = core.getSliderState(100);

      expect(state.fillPercent).toBe(50);
    });

    it('passes through input state', () => {
      const core = new SliderCore();

      core.setInput(createInput({ dragging: true, pointing: true, pointerPercent: 75 }));
      const state = core.getSliderState(30);

      expect(state.dragging).toBe(true);
      expect(state.pointing).toBe(true);
      expect(state.pointerPercent).toBe(75);
      expect(state.interactive).toBe(true);
    });

    it('interactive is true when only dragging', () => {
      const core = new SliderCore();

      core.setInput(createInput({ dragging: true }));
      const state = core.getSliderState(0);

      expect(state.interactive).toBe(true);
    });

    it('interactive is true when only pointing', () => {
      const core = new SliderCore();

      core.setInput(createInput({ pointing: true }));
      const state = core.getSliderState(0);

      expect(state.interactive).toBe(true);
    });

    it('interactive is true when only focused', () => {
      const core = new SliderCore();

      core.setInput(createInput({ focused: true }));
      const state = core.getSliderState(0);

      expect(state.interactive).toBe(true);
    });

    it('uses custom orientation and disabled', () => {
      const core = new SliderCore({ orientation: 'vertical', disabled: true });

      core.setInput(createInput());
      const state = core.getSliderState(0);

      expect(state.orientation).toBe('vertical');
      expect(state.disabled).toBe(true);
    });
  });

  describe('getLabel', () => {
    it('returns empty string by default', () => {
      const core = new SliderCore();

      core.setInput(createInput());
      const state = core.getSliderState(50);

      expect(core.getLabel(state)).toBe('');
    });

    it('returns custom string label', () => {
      const core = new SliderCore({ label: 'Brightness' });

      core.setInput(createInput());
      const state = core.getSliderState(50);

      expect(core.getLabel(state)).toBe('Brightness');
    });

    it('calls function label with state', () => {
      const core = new SliderCore({ label: (state) => (state.dragging ? 'Dragging' : 'Idle') });

      core.setInput(createInput({ dragging: true }));
      expect(core.getLabel(core.getSliderState(0))).toBe('Dragging');

      core.setInput(createInput());
      expect(core.getLabel(core.getSliderState(0))).toBe('Idle');
    });

    it('falls through when function returns empty string', () => {
      const core = new SliderCore({ label: () => '' });

      core.setInput(createInput());
      const state = core.getSliderState(0);

      expect(core.getLabel(state)).toBe('');
    });
  });

  describe('getAttrs', () => {
    it('returns aria attributes', () => {
      const core = new SliderCore();

      core.setInput(createInput());
      const state = core.getSliderState(50);
      const attrs = core.getAttrs(state);

      expect(attrs.role).toBe('slider');
      expect(attrs.tabIndex).toBe(0);
      expect(attrs.autoComplete).toBe('off');
      expect(attrs['aria-label']).toBe('');
      expect(attrs['aria-valuemin']).toBe(0);
      expect(attrs['aria-valuemax']).toBe(100);
      expect(attrs['aria-valuenow']).toBe(50);
      expect(attrs['aria-orientation']).toBe('horizontal');
      expect(attrs['aria-disabled']).toBeUndefined();
    });

    it('sets tabindex -1 and aria-disabled when disabled', () => {
      const core = new SliderCore({ disabled: true });

      core.setInput(createInput());
      const state = core.getSliderState(0);
      const attrs = core.getAttrs(state);

      expect(attrs.tabIndex).toBe(-1);
      expect(attrs['aria-disabled']).toBe('true');
    });

    it('uses custom min and max', () => {
      const core = new SliderCore({ min: 10, max: 50 });

      core.setInput(createInput());
      const state = core.getSliderState(30);
      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuemin']).toBe(10);
      expect(attrs['aria-valuemax']).toBe(50);
      expect(attrs['aria-valuenow']).toBe(30);
    });
  });

  describe('valueFromPercent', () => {
    it('converts 0% to min', () => {
      const core = new SliderCore();

      expect(core.valueFromPercent(0)).toBe(0);
    });

    it('converts 100% to max', () => {
      const core = new SliderCore();

      expect(core.valueFromPercent(100)).toBe(100);
    });

    it('converts 50% to midpoint', () => {
      const core = new SliderCore();

      expect(core.valueFromPercent(50)).toBe(50);
    });

    it('respects custom min/max', () => {
      const core = new SliderCore({ min: 10, max: 20 });

      expect(core.valueFromPercent(50)).toBe(15);
    });

    it('rounds to step', () => {
      const core = new SliderCore({ step: 5 });

      expect(core.valueFromPercent(53)).toBe(55);
      expect(core.valueFromPercent(47)).toBe(45);
    });

    it('clamps to range', () => {
      const core = new SliderCore();

      expect(core.valueFromPercent(-10)).toBe(0);
      expect(core.valueFromPercent(110)).toBe(100);
    });
  });

  describe('rawValueFromPercent', () => {
    it('converts percent to value without step rounding', () => {
      const core = new SliderCore({ step: 5 });

      expect(core.rawValueFromPercent(53)).toBe(53);
      expect(core.rawValueFromPercent(47)).toBe(47);
    });

    it('clamps to range', () => {
      const core = new SliderCore();

      expect(core.rawValueFromPercent(-10)).toBe(0);
      expect(core.rawValueFromPercent(110)).toBe(100);
    });

    it('respects custom min/max', () => {
      const core = new SliderCore({ min: 10, max: 20 });

      expect(core.rawValueFromPercent(50)).toBe(15);
    });
  });

  describe('percentFromValue', () => {
    it('returns 0 at min', () => {
      const core = new SliderCore();

      expect(core.percentFromValue(0)).toBe(0);
    });

    it('returns 100 at max', () => {
      const core = new SliderCore();

      expect(core.percentFromValue(100)).toBe(100);
    });

    it('returns 50 at midpoint', () => {
      const core = new SliderCore();

      expect(core.percentFromValue(50)).toBe(50);
    });

    it('handles custom min/max', () => {
      const core = new SliderCore({ min: 50, max: 150 });

      expect(core.percentFromValue(100)).toBe(50);
    });

    it('returns 0 when min equals max', () => {
      const core = new SliderCore({ min: 50, max: 50 });

      expect(core.percentFromValue(50)).toBe(0);
    });

    it('clamps values outside the range', () => {
      const core = new SliderCore();

      expect(core.percentFromValue(-10)).toBe(0);
      expect(core.percentFromValue(110)).toBe(100);
    });
  });

  describe('adjustPercentForAlignment', () => {
    it('returns raw percent for center alignment', () => {
      const core = new SliderCore({ thumbAlignment: 'center' });

      expect(core.adjustPercentForAlignment(0, 20, 200)).toBe(0);
      expect(core.adjustPercentForAlignment(100, 20, 200)).toBe(100);
    });

    it('returns raw percent when track size is 0', () => {
      const core = new SliderCore({ thumbAlignment: 'edge' });

      expect(core.adjustPercentForAlignment(50, 20, 0)).toBe(50);
    });

    it('adjusts percent for edge alignment', () => {
      const core = new SliderCore({ thumbAlignment: 'edge' });

      // thumbSize=20, trackSize=200 → thumbHalf = (20/200)*100/2 = 5%
      // minPercent=5, maxPercent=95
      // result = 5 + (50/100) * (95-5) = 5 + 45 = 50
      expect(core.adjustPercentForAlignment(50, 20, 200)).toBe(50);

      // 0% → minPercent = 5
      expect(core.adjustPercentForAlignment(0, 20, 200)).toBe(5);

      // 100% → maxPercent = 95
      expect(core.adjustPercentForAlignment(100, 20, 200)).toBe(95);
    });
  });

  describe('getStepPercent', () => {
    it('returns step as a percentage of the range', () => {
      const core = new SliderCore({ step: 1, min: 0, max: 100 });

      expect(core.getStepPercent()).toBe(1);
    });

    it('handles custom ranges', () => {
      const core = new SliderCore({ step: 5, min: 0, max: 50 });

      expect(core.getStepPercent()).toBe(10);
    });

    it('returns 0 when range is 0', () => {
      const core = new SliderCore({ step: 1, min: 50, max: 50 });

      expect(core.getStepPercent()).toBe(0);
    });
  });

  describe('getLargeStepPercent', () => {
    it('returns large step as a percentage of the range', () => {
      const core = new SliderCore({ largeStep: 10, min: 0, max: 100 });

      expect(core.getLargeStepPercent()).toBe(10);
    });

    it('handles custom ranges', () => {
      const core = new SliderCore({ largeStep: 25, min: 0, max: 50 });

      expect(core.getLargeStepPercent()).toBe(50);
    });

    it('returns 0 when range is 0', () => {
      const core = new SliderCore({ largeStep: 10, min: 50, max: 50 });

      expect(core.getLargeStepPercent()).toBe(0);
    });
  });
});
