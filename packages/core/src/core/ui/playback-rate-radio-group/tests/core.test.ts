import type { MediaPlaybackRateState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import { customRateText } from '../../../i18n/text/menu';
import type { PlaybackRateRadioGroupState } from '../core';
import { PlaybackRateRadioGroupCore } from '../core';

function createMediaState(overrides: Partial<MediaPlaybackRateState> = {}): MediaPlaybackRateState {
  return {
    playbackRates: [0.5, 1, 1.5, 2],
    playbackRate: 1,
    playbackRateRange: { min: 0.0625, max: 16 },
    playbackRateAvailability: 'available',
    setPlaybackRate: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<PlaybackRateRadioGroupState> = {}): PlaybackRateRadioGroupState {
  return {
    rate: 1,
    value: '1',
    options: [0.5, 1, 1.5, 2].map((rate) => ({
      rate,
      value: String(rate),
      label: `${rate}×`,
      disabled: false,
      custom: false,
    })),
    disabled: false,
    hidden: false,
    availability: 'available',
    label: '',
    ...overrides,
  };
}

describe('PlaybackRateRadioGroupCore', () => {
  describe('getState', () => {
    it('projects playbackRate and playbackRates', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState({ playbackRate: 1.5, playbackRates: [1, 1.5] });

      core.setMedia(media);
      const state = core.getState();

      expect(state.rate).toBe(1.5);
      expect(state.value).toBe('1.5');
      expect(state.options).toEqual([
        { rate: 1, value: '1', label: '1×', disabled: false, custom: false },
        { rate: 1.5, value: '1.5', label: '1.5×', disabled: false, custom: false },
      ]);
    });

    it('offers its own rates in place of the player rates', () => {
      const core = new PlaybackRateRadioGroupCore({ rates: '1 3' });

      core.setMedia(createMediaState());

      expect(core.getState().options.map((option) => option.rate)).toEqual([1, 3]);
    });

    it('adds the current rate before the first faster rate when it is not offered', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRate: 1.1 }));
      const { options, value } = core.getState();

      expect(value).toBe('1.1');
      expect(options.map(({ rate, custom }) => [rate, custom])).toEqual([
        [0.5, false],
        [1, false],
        [1.1, true],
        [1.5, false],
        [2, false],
      ]);
    });

    it('names the added rate as custom for assistive technology', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRate: 1.1 }));
      const { options } = core.getState();

      expect(options.find((option) => option.custom)).toMatchObject({
        label: '1.1×',
        ariaLabel: customRateText,
        ariaLabelParams: { rate: '1.1×' },
      });
      expect(options.filter((option) => !option.custom).every((option) => option.ariaLabel === undefined)).toBe(true);
    });

    it('adds a current rate faster than every offered rate at the end', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRate: 3 }));

      expect(core.getState().options.at(-1)).toMatchObject({ rate: 3, custom: true });
    });

    it('drops the added rate once the current rate is offered again', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState({ playbackRate: 1.1 });

      core.setMedia(media);
      core.getState();
      core.setMedia({ ...media, playbackRate: 1 });

      expect(core.getState().options.some((option) => option.custom)).toBe(false);
    });

    it('adds no rate when the media cannot change its rate', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRate: 1.1, playbackRateAvailability: 'unsupported' }));

      expect(core.getState().options.map((option) => option.rate)).toEqual([0.5, 1, 1.5, 2]);
    });

    it('marks availability unavailable when no rates are available', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRates: [] }));

      expect(core.getState()).toMatchObject({ availability: 'unavailable', disabled: true, hidden: true });
    });

    it('reports the media playback rate availability when the media has no playback rate', () => {
      // The feature keeps its default rates for a media without a playback
      // rate, so the rates alone would still show a menu that does nothing.
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState({ playbackRateAvailability: 'unsupported' }));

      expect(core.getState()).toMatchObject({ availability: 'unsupported', disabled: true, hidden: true });
    });

    it('marks availability available when rates exist', () => {
      const core = new PlaybackRateRadioGroupCore();

      core.setMedia(createMediaState());

      expect(core.getState()).toMatchObject({ availability: 'available', hidden: false });
    });
  });

  describe('getLabel', () => {
    it('returns a stable default group label', () => {
      const core = new PlaybackRateRadioGroupCore();

      expect(core.getLabel(createState({ rate: 1.5 }))).toMatchObject({
        key: 'menu.playbackRate',
        text: 'Playback rate',
      });
    });

    it('returns custom string label', () => {
      const core = new PlaybackRateRadioGroupCore({ label: 'Speed' });

      expect(core.getLabel(createState())).toBe('Speed');
    });

    it('returns custom function label', () => {
      const core = new PlaybackRateRadioGroupCore({
        label: (state) => `${state.rate}× speed`,
      });

      expect(core.getLabel(createState({ rate: 2 }))).toBe('2× speed');
    });
  });

  describe('getRateLabel', () => {
    it('formats rate labels by default', () => {
      const core = new PlaybackRateRadioGroupCore();

      expect(core.getRateLabel(1.5)).toBe('1.5×');
    });

    it('uses a custom formatter', () => {
      const core = new PlaybackRateRadioGroupCore({
        formatRate: (rate) => (rate === 1 ? 'Normal' : `${rate}×`),
      });

      expect(core.getRateLabel(1)).toBe('Normal');
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new PlaybackRateRadioGroupCore();
      const attrs = core.getAttrs(createState({ rate: 1.5 }));

      expect(attrs['aria-label']).toMatchObject({ key: 'menu.playbackRate', text: 'Playback rate' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new PlaybackRateRadioGroupCore();
      const attrs = core.getAttrs(createState({ disabled: true }));

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('sets hidden when unavailable', () => {
      const core = new PlaybackRateRadioGroupCore();
      const attrs = core.getAttrs(createState({ hidden: true }));

      expect(attrs.hidden).toBe('');
    });
  });

  describe('select', () => {
    it('sets a rate from the available list', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState();

      core.select(media, 1.5);
      expect(media.setPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    it('does nothing when disabled', () => {
      const core = new PlaybackRateRadioGroupCore({ disabled: true });
      const media = createMediaState();

      core.select(media, 1.5);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });

    it('does nothing when the media has no playback rate', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState({ playbackRateAvailability: 'unsupported' });

      core.select(media, 1.5);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });

    it('does nothing for unavailable rates', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState();

      core.select(media, 3);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });
  });

  describe('selectValue', () => {
    it('sets the rate matching a menu value', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '2');
      expect(media.setPlaybackRate).toHaveBeenCalledWith(2);
    });

    it('reselects the added current rate', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState({ playbackRate: 1.1 });

      core.selectValue(media, '1.1');
      expect(media.setPlaybackRate).toHaveBeenCalledWith(1.1);
    });

    it('selects from its own rates', () => {
      const core = new PlaybackRateRadioGroupCore({ rates: [1, 3] });
      const media = createMediaState();

      core.selectValue(media, '3');
      expect(media.setPlaybackRate).toHaveBeenCalledWith(3);
    });

    it('does nothing for an unknown menu value', () => {
      const core = new PlaybackRateRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '3');
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });
  });
});
