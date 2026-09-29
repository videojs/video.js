import type { MediaPlaybackState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { PlayButtonState } from '../core';
import { PlayButtonCore } from '../core';

function createMediaState(overrides: Partial<MediaPlaybackState> = {}): MediaPlaybackState {
  return {
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<PlayButtonState> = {}): PlayButtonState {
  return {
    paused: true,
    ended: false,
    started: false,
    label: '',
    ...overrides,
  };
}

describe('PlayButtonCore', () => {
  describe('setProps', () => {
    it('uses default props', () => {
      const core = new PlayButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBeUndefined();
    });

    it('accepts constructor props', () => {
      const core = new PlayButtonCore({ disabled: true });
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBe('true');
    });
  });

  describe('getState', () => {
    it('projects data fields from media state', () => {
      const core = new PlayButtonCore();
      const media = createMediaState({ paused: true, ended: false, started: true });

      core.setMedia(media);
      const state = core.getState();

      expect(state.paused).toBe(true);
      expect(state.ended).toBe(false);
      expect(state.started).toBe(true);
    });

    it('reflects playing state', () => {
      const core = new PlayButtonCore();

      core.setMedia(createMediaState({ paused: false, started: true }));
      const state = core.getState();

      expect(state.paused).toBe(false);
      expect(state.started).toBe(true);
    });
  });

  describe('getLabel', () => {
    it('returns play when paused', () => {
      const core = new PlayButtonCore();

      expect(core.getLabel(createState({ paused: true }))).toMatchObject({ key: 'buttons.play', text: 'Play' });
    });

    it('returns pause when playing', () => {
      const core = new PlayButtonCore();

      expect(core.getLabel(createState({ paused: false }))).toMatchObject({ key: 'buttons.pause', text: 'Pause' });
    });

    it('returns replay when ended', () => {
      const core = new PlayButtonCore();

      expect(core.getLabel(createState({ ended: true }))).toMatchObject({ key: 'buttons.replay', text: 'Replay' });
    });

    it('returns custom string label', () => {
      const core = new PlayButtonCore({ label: 'Start' });

      expect(core.getLabel(createState())).toBe('Start');
    });

    it('returns custom function label', () => {
      const core = new PlayButtonCore({
        label: (state) => (state.paused ? 'Resume' : 'Stop'),
      });

      expect(core.getLabel(createState({ paused: true }))).toBe('Resume');
    });

    it('falls back to default when function returns empty', () => {
      const core = new PlayButtonCore({ label: () => '' });

      expect(core.getLabel(createState({ paused: true }))).toMatchObject({ key: 'buttons.play', text: 'Play' });
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new PlayButtonCore();
      const attrs = core.getAttrs(createState({ paused: true }));

      expect(attrs['aria-label']).toMatchObject({ key: 'buttons.play', text: 'Play' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new PlayButtonCore({ disabled: true });
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('omits aria-disabled when not disabled', () => {
      const core = new PlayButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-disabled']).toBeUndefined();
    });
  });

  describe('toggle', () => {
    it('calls play when paused', async () => {
      const core = new PlayButtonCore();
      const media = createMediaState({ paused: true });

      await core.toggle(media);
      expect(media.play).toHaveBeenCalled();
    });

    it('calls pause when playing', async () => {
      const core = new PlayButtonCore();
      const media = createMediaState({ paused: false });

      await core.toggle(media);
      expect(media.pause).toHaveBeenCalled();
    });

    it('calls play when ended', async () => {
      const core = new PlayButtonCore();
      const media = createMediaState({ ended: true });

      await core.toggle(media);
      expect(media.play).toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      const core = new PlayButtonCore({ disabled: true });
      const media = createMediaState({ paused: true });

      await core.toggle(media);
      expect(media.play).not.toHaveBeenCalled();
    });
  });
});
