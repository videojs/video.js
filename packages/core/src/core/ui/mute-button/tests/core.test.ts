import type { MediaVolumeState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { MuteButtonState } from '../core';
import { MuteButtonCore } from '../core';

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

function createState(overrides: Partial<MuteButtonState> = {}): MuteButtonState {
  return {
    muted: false,
    volumeLevel: 'high',
    availability: 'available',
    hidden: false,
    label: '',
    ...overrides,
  };
}

describe('MuteButtonCore', () => {
  describe('toggle', () => {
    it('does nothing when the media has no mute to toggle', () => {
      const core = new MuteButtonCore();
      const media = createMediaState({ mutedAvailability: 'unsupported' });

      core.toggle(media);

      expect(media.setMuted).not.toHaveBeenCalled();
    });
  });
  describe('getState', () => {
    it('projects muted and volumeLevel', () => {
      const core = new MuteButtonCore();
      const media = createMediaState({ muted: false, volume: 1 });

      core.setMedia(media);
      const state = core.getState();

      expect(state.muted).toBe(false);
      expect(state.volumeLevel).toBe('high');
    });

    it('hides itself when the media has no mute to toggle', () => {
      // An embed whose provider takes no volume or mute command — Spotify — leaves
      // this button with nothing to do, so it is removed rather than rendered
      // and inert.
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ mutedAvailability: 'unavailable' }));
      const state = core.getState();

      expect(state.availability).toBe('unavailable');
      expect(state.hidden).toBe(true);
    });

    it('shows itself when the media can be muted', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ mutedAvailability: 'available' }));
      const state = core.getState();

      expect(state.hidden).toBe(false);
    });

    it('returns off when muted', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ muted: true, volume: 0.8 }));
      const state = core.getState();

      expect(state.muted).toBe(true);
      expect(state.volumeLevel).toBe('off');
    });

    it('returns off when volume is 0', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ volume: 0 }));
      expect(core.getState().volumeLevel).toBe('off');
    });

    it('derives muted as true when volume is 0 and not muted', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ volume: 0, muted: false }));
      const state = core.getState();

      expect(state.muted).toBe(true);
      expect(state.volumeLevel).toBe('off');
    });

    it('returns low when volume < 0.5', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ volume: 0.3 }));
      expect(core.getState().volumeLevel).toBe('low');
    });

    it('returns medium when volume < 0.75', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ volume: 0.6 }));
      expect(core.getState().volumeLevel).toBe('medium');
    });

    it('returns high when volume >= 0.75', () => {
      const core = new MuteButtonCore();

      core.setMedia(createMediaState({ volume: 0.75 }));
      expect(core.getState().volumeLevel).toBe('high');
    });
  });

  describe('getLabel', () => {
    it('returns mute when unmuted', () => {
      const core = new MuteButtonCore();

      expect(core.getLabel(createState({ muted: false }))).toMatchObject({ key: 'buttons.mute', text: 'Mute' });
    });

    it('returns unmute when muted', () => {
      const core = new MuteButtonCore();

      expect(core.getLabel(createState({ muted: true }))).toMatchObject({ key: 'buttons.unmute', text: 'Unmute' });
    });

    it('returns custom string label', () => {
      const core = new MuteButtonCore({ label: 'Toggle sound' });

      expect(core.getLabel(createState())).toBe('Toggle sound');
    });

    it('returns custom function label', () => {
      const core = new MuteButtonCore({
        label: (state) => (state.muted ? 'Sound on' : 'Sound off'),
      });

      expect(core.getLabel(createState({ muted: true }))).toBe('Sound on');
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new MuteButtonCore();
      const attrs = core.getAttrs(createState({ muted: false }));

      expect(attrs['aria-label']).toMatchObject({ key: 'buttons.mute', text: 'Mute' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new MuteButtonCore({ disabled: true });
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBe('true');
    });
  });

  describe('toggle', () => {
    it('mutes when unmuted', () => {
      const core = new MuteButtonCore();
      const media = createMediaState({ muted: false, volume: 0.8 });

      core.toggle(media);

      expect(media.setMuted).toHaveBeenCalledExactlyOnceWith(true);
    });

    it('unmutes when muted', () => {
      const core = new MuteButtonCore();
      const media = createMediaState({ muted: true, volume: 0.8 });

      core.toggle(media);

      expect(media.setMuted).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('unmutes when volume is 0 and not muted', () => {
      const core = new MuteButtonCore();
      const media = createMediaState({ muted: false, volume: 0 });

      core.toggle(media);

      expect(media.setMuted).toHaveBeenCalledExactlyOnceWith(false);
    });

    it('does nothing when disabled', () => {
      const core = new MuteButtonCore({ disabled: true });
      const media = createMediaState();

      core.toggle(media);
      expect(media.setMuted).not.toHaveBeenCalled();
    });
  });
});
