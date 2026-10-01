import type { MediaTimeState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { SeekButtonState } from '../core';
import { SeekButtonCore } from '../core';

function createMediaState(overrides: Partial<MediaTimeState> = {}): MediaTimeState {
  return {
    currentTime: 0,
    duration: 300,
    seeking: false,
    seek: vi.fn(async (time: number) => time),
    ...overrides,
  };
}

function createState(overrides: Partial<SeekButtonState> = {}): SeekButtonState {
  return {
    seeking: false,
    direction: 'forward',
    label: '',
    ...overrides,
  };
}

describe('SeekButtonCore', () => {
  describe('getState', () => {
    it('projects seeking from media state', () => {
      const core = new SeekButtonCore();

      core.setMedia(createMediaState({ seeking: true }));
      expect(core.getState().seeking).toBe(true);
    });

    it('derives forward direction from positive seconds', () => {
      const core = new SeekButtonCore({ seconds: 15 });

      core.setMedia(createMediaState());
      expect(core.getState().direction).toBe('forward');
    });

    it('derives backward direction from negative seconds', () => {
      const core = new SeekButtonCore({ seconds: -15 });

      core.setMedia(createMediaState());
      expect(core.getState().direction).toBe('backward');
    });

    it('defaults to forward direction', () => {
      const core = new SeekButtonCore();

      core.setMedia(createMediaState());
      expect(core.getState().direction).toBe('forward');
    });
  });

  describe('getLabel', () => {
    it('returns forward label for forward direction', () => {
      const core = new SeekButtonCore({ seconds: 30 });

      expect(core.getLabel(createState({ direction: 'forward' }))).toMatchObject({
        key: 'seek.forward',
        text: 'Seek forward {seconds} seconds',
      });
    });

    it('returns backward label for backward direction', () => {
      const core = new SeekButtonCore({ seconds: -10 });

      expect(core.getLabel(createState({ direction: 'backward' }))).toMatchObject({
        key: 'seek.backward',
        text: 'Seek backward {seconds} seconds',
      });
    });

    it('returns custom string label', () => {
      const core = new SeekButtonCore({ label: 'Skip' });

      expect(core.getLabel(createState())).toBe('Skip');
    });

    it('returns custom function label', () => {
      const core = new SeekButtonCore({
        label: (state) => (state.direction === 'backward' ? 'Rewind' : 'Skip ahead'),
      });

      expect(core.getLabel(createState({ direction: 'backward' }))).toBe('Rewind');
      expect(core.getLabel(createState({ direction: 'forward' }))).toBe('Skip ahead');
    });

    it('falls back to default when function returns empty', () => {
      const core = new SeekButtonCore({ seconds: 10, label: () => '' });

      expect(core.getLabel(createState({ direction: 'forward' }))).toMatchObject({
        key: 'seek.forward',
        text: 'Seek forward {seconds} seconds',
      });
    });
  });

  describe('getLabelParams', () => {
    it('returns seconds for default forward label', () => {
      const core = new SeekButtonCore({ seconds: 30 });

      expect(core.getLabelParams(createState({ direction: 'forward' }))).toEqual({ seconds: 30 });
    });

    it('returns positive seconds for backward seek', () => {
      const core = new SeekButtonCore({ seconds: -10 });

      expect(core.getLabelParams(createState({ direction: 'backward' }))).toEqual({ seconds: 10 });
    });

    it('returns undefined when custom label is set', () => {
      const core = new SeekButtonCore({ label: 'Skip' });

      expect(core.getLabelParams(createState())).toBeUndefined();
    });

    it('returns undefined when custom label function is set', () => {
      const core = new SeekButtonCore({
        seconds: 30,
        label: () => 'custom',
      });
      const state = createState({ direction: 'forward' });

      expect(core.getLabel(state)).toBe('custom');
      expect(core.getLabelParams(state)).toBeUndefined();
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new SeekButtonCore({ seconds: 30 });
      const attrs = core.getAttrs(createState({ direction: 'forward' }));

      expect(attrs['aria-label']).toMatchObject({ key: 'seek.forward', text: 'Seek forward {seconds} seconds' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new SeekButtonCore({ disabled: true });
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('omits aria-disabled when not disabled', () => {
      const core = new SeekButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBeUndefined();
    });
  });

  describe('Seek', () => {
    it('seeks forward by seconds offset', async () => {
      const core = new SeekButtonCore({ seconds: 30 });
      const media = createMediaState({ currentTime: 60 });

      await core.seek(media);
      expect(media.seek).toHaveBeenCalledWith(90);
    });

    it('seeks backward by negative seconds offset', async () => {
      const core = new SeekButtonCore({ seconds: -10 });
      const media = createMediaState({ currentTime: 60 });

      await core.seek(media);
      expect(media.seek).toHaveBeenCalledWith(50);
    });

    it('does not clamp the target time', async () => {
      const core = new SeekButtonCore({ seconds: -30 });
      const media = createMediaState({ currentTime: 10 });

      await core.seek(media);
      // Clamping is the store's responsibility, not the button's.
      expect(media.seek).toHaveBeenCalledWith(-20);
    });

    it('does nothing when disabled', async () => {
      const core = new SeekButtonCore({ disabled: true, seconds: 30 });
      const media = createMediaState({ currentTime: 60 });

      await core.seek(media);
      expect(media.seek).not.toHaveBeenCalled();
    });

    it('forwards seeks when the timeline is not known yet', async () => {
      const core = new SeekButtonCore();
      const media = createMediaState({ duration: 0 });

      await core.seek(media);

      expect(media.seek).toHaveBeenCalledWith(30);
    });
  });
});
