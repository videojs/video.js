import type { MediaVolumeState } from '@videojs/media';
import { formatPercent } from '@videojs/utils/percent';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { SliderInput } from '../../slider/core';
import { VolumeSliderCore } from '../core';

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

function createMediaState(overrides: Partial<MediaVolumeState> = {}): MediaVolumeState {
  return {
    volume: 1,
    muted: false,
    volumeAvailability: 'available',
    mutedAvailability: 'available',
    setVolume: vi.fn((v: number) => v),
    setMuted: vi.fn((muted: boolean) => muted),
    ...overrides,
  };
}

describe('VolumeSliderCore', () => {
  describe('defaultProps', () => {
    it('has expected defaults', () => {
      expect(VolumeSliderCore.defaultProps).toEqual({
        label: '',
        step: 5,
        largeStep: 10,
        wheelStep: 5,
        orientation: 'horizontal',
        disabled: false,
        thumbAlignment: 'center',
        value: 0,
        min: 0,
        max: 100,
      });
    });
  });

  describe('getState', () => {
    it('maps volume 0-1 to 0-100 percent', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.75 }));
      const state = core.getState();

      expect(state.value).toBe(75);
      expect(state.fillPercent).toBe(75);
      expect(state.volume).toBe(0.75);
    });

    it('returns 0 when volume is 0', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0 }));
      const state = core.getState();

      expect(state.value).toBe(0);
      expect(state.fillPercent).toBe(0);
    });

    it('returns 100 when volume is 1', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 1 }));
      const state = core.getState();

      expect(state.value).toBe(100);
      expect(state.fillPercent).toBe(100);
    });

    it('sets fillPercent to 0 when muted', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.75, muted: true }));
      const state = core.getState();

      expect(state.value).toBe(75);
      expect(state.fillPercent).toBe(0);
      expect(state.muted).toBe(true);
    });

    it('uses drag percent for value when dragging', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput({ dragging: true, dragPercent: 40 }));
      core.setMedia(createMediaState({ volume: 0.75 }));
      const state = core.getState();

      expect(state.value).toBe(40);
      expect(state.dragging).toBe(true);
      expect(state.volume).toBe(0.75); // unchanged
    });

    it('preserves muted state', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.5, muted: false }));
      const state = core.getState();

      expect(state.muted).toBe(false);
    });

    it('derives muted as true when volume is 0 and not muted', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0, muted: false }));
      const state = core.getState();

      expect(state.muted).toBe(true);
      expect(state.fillPercent).toBe(0);
    });

    it('projects availability from volumeAvailability', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volumeAvailability: 'unsupported' }));
      const state = core.getState();

      expect(state.availability).toBe('unsupported');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
      expect(core.getAttrs(state)).toMatchObject({ 'aria-disabled': 'true', tabIndex: -1 });
    });

    it('reflects available availability', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volumeAvailability: 'available' }));
      expect(core.getState()).toMatchObject({ availability: 'available', disabled: false, hidden: false });
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label and aria-valuetext', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.75 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toMatchObject({ key: 'volume.label', text: 'Volume' });
      expect(attrs['aria-valuetext']).toBe(formatPercent(0.75));
      expect(core.getValueTextParams(state)).toEqual({ percent: formatPercent(0.75) });
      expect(attrs.role).toBe('slider');
    });

    it('includes muted in valuetext when muted', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.5, muted: true }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuetext']).toMatchObject({ key: 'volume.mutedValue', text: '{percent}, muted' });
      expect(core.getValueTextParams(state)).toEqual({ percent: formatPercent(0.5) });
    });

    it('rounds value in valuetext', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.333 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuetext']).toBe(formatPercent(0.333));
      expect(core.getValueTextParams(state)).toEqual({ percent: formatPercent(0.333) });
    });

    it('uses custom label', () => {
      const core = new VolumeSliderCore({ label: 'Audio' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 1 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toBe('Audio');
    });

    it('shows 0 percent muted when volume is 0', () => {
      const core = new VolumeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuetext']).toMatchObject({ key: 'volume.mutedValue', text: '{percent}, muted' });
      expect(core.getValueTextParams(state)).toEqual({ percent: formatPercent(0) });
    });
  });

  describe('setProps', () => {
    it('updates label', () => {
      const core = new VolumeSliderCore();

      core.setProps({ label: 'Sound' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.5 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toBe('Sound');
    });

    it('respects disabled prop', () => {
      const core = new VolumeSliderCore({ disabled: true });

      core.setInput(createInput());
      core.setMedia(createMediaState({ volume: 0.5 }));
      const state = core.getState();

      expect(state.disabled).toBe(true);

      const attrs = core.getAttrs(state);

      expect(attrs['aria-disabled']).toBe('true');
      expect(attrs.tabIndex).toBe(-1);
    });
  });
});
