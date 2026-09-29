import type { MediaTextTrackState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import { CAPTIONS_OFF_VALUE, CaptionsRadioGroupCore, type CaptionsRadioGroupState } from '../core';

function createMediaState(overrides: Partial<MediaTextTrackState> = {}): MediaTextTrackState {
  return {
    chaptersCues: [],
    thumbnailsTrack: null,
    textTrackList: [],
    subtitlesShowing: false,
    toggleSubtitles: vi.fn(() => true),
    selectSubtitlesTrack: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<CaptionsRadioGroupState> = {}): CaptionsRadioGroupState {
  return {
    options: [{ value: CAPTIONS_OFF_VALUE, label: 'Off', disabled: false }],
    value: CAPTIONS_OFF_VALUE,
    subtitlesShowing: false,
    disabled: false,
    hidden: false,
    availability: 'unavailable',
    label: '',
    ...overrides,
  };
}

describe('CaptionsRadioGroupCore', () => {
  describe('getState', () => {
    it('projects caption tracks and the active value', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        subtitlesShowing: true,
        textTrackList: [
          { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing' },
          { id: 'captions-en', kind: 'captions', label: 'CC', language: 'en', mode: 'disabled' },
          { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
        ],
      });

      core.setMedia(media);
      const state = core.getState();

      expect(state.options).toEqual([
        { value: CAPTIONS_OFF_VALUE, label: { key: 'menu.off', text: 'Off' }, disabled: false },
        { value: 'captions-en', label: 'CC', disabled: false },
        { value: 'subtitles-en', label: 'English', disabled: false },
        { value: 'subtitles-es', label: 'Spanish', disabled: false },
      ]);
      expect(state.value).toBe('subtitles-en');
      expect(state.subtitlesShowing).toBe(true);
    });

    it('marks state disabled when no caption tracks are available', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [{ id: 'thumbnails', kind: 'metadata', label: 'thumbnails', language: '', mode: 'hidden' }],
      });

      core.setMedia(media);

      expect(core.getState().disabled).toBe(true);
    });

    it('marks availability unavailable when no caption tracks are available', () => {
      const core = new CaptionsRadioGroupCore();

      core.setMedia(createMediaState());

      expect(core.getState()).toMatchObject({ availability: 'unavailable', disabled: true, hidden: true });
    });

    it('marks availability available when caption tracks exist', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [{ id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' }],
      });

      core.setMedia(media);

      expect(core.getState()).toMatchObject({ availability: 'available', hidden: false });
    });

    it('uses off when no track is showing', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [
          { id: 'captions-en', kind: 'captions', label: 'English', language: 'en', mode: 'disabled' },
          { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
        ],
      });

      core.setMedia(media);

      expect(core.getState().value).toBe(CAPTIONS_OFF_VALUE);
    });
  });

  describe('getLabel', () => {
    it('returns a stable default group label', () => {
      const core = new CaptionsRadioGroupCore();

      expect(core.getLabel(createState({ subtitlesShowing: false }))).toMatchObject({
        key: 'menu.captions',
        text: 'Captions',
      });
      expect(core.getLabel(createState({ subtitlesShowing: true }))).toMatchObject({
        key: 'menu.captions',
        text: 'Captions',
      });
    });

    it('returns custom string label', () => {
      const core = new CaptionsRadioGroupCore({ label: 'Captions' });

      expect(core.getLabel(createState())).toBe('Captions');
    });

    it('returns custom function label', () => {
      const core = new CaptionsRadioGroupCore({
        label: (state) => (state.subtitlesShowing ? 'Hide subtitles' : 'Show subtitles'),
      });

      expect(core.getLabel(createState({ subtitlesShowing: true }))).toBe('Hide subtitles');
    });
  });

  describe('getTrackLabel', () => {
    it('formats track labels by default', () => {
      const core = new CaptionsRadioGroupCore();

      expect(
        core.getTrackLabel({
          id: 'subtitles-en',
          kind: 'subtitles',
          label: 'English',
          language: 'en',
          mode: 'disabled',
        })
      ).toBe('English');
      expect(
        core.getTrackLabel({ id: 'subtitles-es', kind: 'subtitles', label: '', language: 'es', mode: 'disabled' })
      ).toBe('es');
      expect(
        core.getTrackLabel({ id: 'captions', kind: 'captions', label: '', language: '', mode: 'disabled' })
      ).toMatchObject({
        key: 'menu.captions',
        text: 'Captions',
      });
    });

    it('adds default labels for unlabeled tracks', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [
          { id: 'captions-en', kind: 'captions', label: '', language: '', mode: 'disabled' },
          { id: 'subtitles-en', kind: 'subtitles', label: '', language: '', mode: 'disabled' },
        ],
      });

      core.setMedia(media);

      expect(core.getState().options).toEqual([
        { value: CAPTIONS_OFF_VALUE, label: { key: 'menu.off', text: 'Off' }, disabled: false },
        { value: 'captions-en', label: { key: 'menu.captions', text: 'Captions' }, disabled: false },
        { value: 'subtitles-en', label: { key: 'menu.subtitles', text: 'Subtitles' }, disabled: false },
      ]);
    });

    it('uses a custom formatter', () => {
      const core = new CaptionsRadioGroupCore({
        formatTrack: (track) => `${track.language.toUpperCase()} subtitles`,
      });

      expect(
        core.getTrackLabel({
          id: 'subtitles-en',
          kind: 'subtitles',
          label: 'English',
          language: 'en',
          mode: 'disabled',
        })
      ).toBe('EN subtitles');
    });
  });

  describe('select', () => {
    it('selects a track from the available list', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [
          { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
          { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
        ],
      });

      core.select(media, 'subtitles-es');
      expect(media.selectSubtitlesTrack).toHaveBeenCalledWith('subtitles-es');
    });

    it('turns captions off', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [{ id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing' }],
      });

      core.select(media, CAPTIONS_OFF_VALUE);
      expect(media.selectSubtitlesTrack).toHaveBeenCalledWith(null);
    });

    it('does nothing when disabled', () => {
      const core = new CaptionsRadioGroupCore({ disabled: true });
      const media = createMediaState({
        textTrackList: [{ id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' }],
      });

      core.select(media, 'subtitles-en');
      expect(media.selectSubtitlesTrack).not.toHaveBeenCalled();
    });

    it('does nothing for unavailable tracks', () => {
      const core = new CaptionsRadioGroupCore();
      const media = createMediaState({
        textTrackList: [{ id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' }],
      });

      core.select(media, 'subtitles-es');
      expect(media.selectSubtitlesTrack).not.toHaveBeenCalled();
    });
  });
});
