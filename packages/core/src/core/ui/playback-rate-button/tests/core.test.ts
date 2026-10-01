import type { MediaPlaybackRateState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { PlaybackRateButtonState } from '../core';
import { PlaybackRateButtonCore } from '../core';

function createMediaState(overrides: Partial<MediaPlaybackRateState> = {}): MediaPlaybackRateState {
  return {
    playbackRates: [0.2, 0.5, 0.7, 1, 1.2, 1.5, 1.7, 2],
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<PlaybackRateButtonState> = {}): PlaybackRateButtonState {
  return {
    rate: 1,
    label: '',
    ...overrides,
  };
}

describe('PlaybackRateButtonCore', () => {
  describe('getState', () => {
    it('projects playbackRate to rate', () => {
      const core = new PlaybackRateButtonCore();
      const media = createMediaState({ playbackRate: 1.5 });

      core.setMedia(media);
      const state = core.getState();

      expect(state.rate).toBe(1.5);
    });
  });

  describe('getLabel', () => {
    it('returns default label with rate', () => {
      const core = new PlaybackRateButtonCore();

      expect(core.getLabel(createState({ rate: 1.5 }))).toMatchObject({
        key: 'playback.rate',
        text: 'Playback rate {rate}',
      });
    });

    it('returns custom string label', () => {
      const core = new PlaybackRateButtonCore({ label: 'Speed' });

      expect(core.getLabel(createState())).toBe('Speed');
    });

    it('returns custom function label', () => {
      const core = new PlaybackRateButtonCore({
        label: (state) => `${state.rate}x speed`,
      });

      expect(core.getLabel(createState({ rate: 2 }))).toBe('2x speed');
    });

    it('falls back to default when function returns empty string', () => {
      const core = new PlaybackRateButtonCore({
        label: () => '',
      });

      expect(core.getLabel(createState({ rate: 1.5 }))).toMatchObject({
        key: 'playback.rate',
        text: 'Playback rate {rate}',
      });
    });
  });

  describe('getLabelParams', () => {
    it('returns rate for default label', () => {
      const core = new PlaybackRateButtonCore();

      expect(core.getLabelParams(createState({ rate: 1.5 }))).toEqual({ rate: 1.5 });
    });

    it('returns undefined when custom label is set', () => {
      const core = new PlaybackRateButtonCore({ label: 'Speed' });

      expect(core.getLabelParams(createState())).toBeUndefined();
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new PlaybackRateButtonCore();
      const attrs = core.getAttrs(createState({ rate: 1.5 }));

      expect(attrs['aria-label']).toMatchObject({ key: 'playback.rate', text: 'Playback rate {rate}' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new PlaybackRateButtonCore({ disabled: true });
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('does not set aria-disabled when not disabled', () => {
      const core = new PlaybackRateButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBeUndefined();
    });
  });

  describe('cycle', () => {
    it.each([
      [1, 1.2],
      [1.5, 1.7],
      [0.3, 0.5],
      [1.3, 1.5],
      [0.2, 0.5],
    ])('advances from %s to %s', (current, expected) => {
      const core = new PlaybackRateButtonCore();
      const media = createMediaState({ playbackRate: current });

      core.cycle(media);
      expect(media.setPlaybackRate).toHaveBeenCalledWith(expected);
    });

    it('wraps to the first rate after the last', () => {
      const core = new PlaybackRateButtonCore();
      const media = createMediaState({ playbackRate: 2 });

      core.cycle(media);
      expect(media.setPlaybackRate).toHaveBeenCalledWith(0.2);
    });

    it('wraps to first rate when current is above all rates and not in list', () => {
      const core = new PlaybackRateButtonCore();
      const media = createMediaState({ playbackRate: 3 });

      core.cycle(media);
      expect(media.setPlaybackRate).toHaveBeenCalledWith(0.2);
    });

    it('does nothing when menuTrigger is set', () => {
      const core = new PlaybackRateButtonCore({ menuTrigger: true });
      const media = createMediaState({ playbackRate: 1 });

      core.cycle(media);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', () => {
      const core = new PlaybackRateButtonCore({ disabled: true });
      const media = createMediaState();

      core.cycle(media);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });

    it('does nothing when playbackRates is empty', () => {
      const core = new PlaybackRateButtonCore();
      const media = createMediaState({ playbackRates: [] });

      core.cycle(media);
      expect(media.setPlaybackRate).not.toHaveBeenCalled();
    });
  });
});
