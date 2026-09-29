import type { MediaAudioTrackState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { AudioTrackRadioGroupState } from '../core';
import { AudioTrackRadioGroupCore } from '../core';

function createMediaState(overrides: Partial<MediaAudioTrackState> = {}): MediaAudioTrackState {
  return {
    audioTrackList: [
      { id: '0', kind: 'main', label: 'English', language: 'en', enabled: true },
      { id: '1', kind: 'alternative', label: 'Spanish', language: 'es', enabled: false },
    ],
    selectAudioTrack: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<AudioTrackRadioGroupState> = {}): AudioTrackRadioGroupState {
  return {
    options: [
      { value: '0', label: 'English', disabled: false },
      { value: '1', label: 'Spanish', disabled: false },
    ],
    value: '0',
    disabled: false,
    hidden: false,
    availability: 'available',
    label: '',
    ...overrides,
  };
}

describe('AudioTrackRadioGroupCore', () => {
  describe('getState', () => {
    it('projects audio tracks', () => {
      const core = new AudioTrackRadioGroupCore();
      const media = createMediaState();

      core.setMedia(media);

      const state = core.getState();

      expect(state.options).toEqual([
        { value: '0', label: 'English', disabled: false },
        { value: '1', label: 'Spanish', disabled: false },
      ]);
      expect(state.value).toBe('0');
    });

    it('falls back to language, kind, then Audio labels', () => {
      const core = new AudioTrackRadioGroupCore();
      const media = createMediaState({
        audioTrackList: [
          { id: '0', kind: 'main', label: '', language: 'en', enabled: true },
          { id: '1', kind: 'commentary', label: '', language: '', enabled: false },
          { id: '2', label: '', language: '', enabled: false },
        ],
      });

      core.setMedia(media);

      expect(core.getState().options).toEqual([
        { value: '0', label: 'en', disabled: false },
        { value: '1', label: 'commentary', disabled: false },
        { value: '2', label: { key: 'menu.audio', text: 'Audio' }, disabled: false },
      ]);
    });

    it('uses track ids as option values', () => {
      const core = new AudioTrackRadioGroupCore();
      const media = createMediaState({
        audioTrackList: [
          { id: 'audio-en', label: 'English', language: 'en', enabled: false },
          { id: 'audio-es', label: 'Spanish', language: 'es', enabled: true },
        ],
      });

      core.setMedia(media);

      expect(core.getState().options.map((track) => track.value)).toEqual(['audio-en', 'audio-es']);
      expect(core.getState().value).toBe('audio-es');
    });

    it('marks availability unavailable with one track', () => {
      const core = new AudioTrackRadioGroupCore();

      core.setMedia(
        createMediaState({ audioTrackList: [{ id: '0', label: 'English', language: 'en', enabled: true }] })
      );

      expect(core.getState()).toMatchObject({ availability: 'unavailable', disabled: true, hidden: true });
    });
  });

  describe('getLabel', () => {
    it('returns the default label', () => {
      const core = new AudioTrackRadioGroupCore();

      expect(core.getLabel(createState())).toMatchObject({ key: 'menu.audio', text: 'Audio' });
    });

    it('returns a custom string label', () => {
      const core = new AudioTrackRadioGroupCore({ label: 'Audio tracks' });

      expect(core.getLabel(createState())).toBe('Audio tracks');
    });
  });

  describe('getTrackLabel', () => {
    it('uses a custom formatter', () => {
      const core = new AudioTrackRadioGroupCore({
        formatTrack: (track) => `${track.language}: ${track.label}`,
      });

      expect(core.getTrackLabel({ id: '0', label: 'English', language: 'en', enabled: false })).toBe('en: English');
    });
  });

  describe('selectValue', () => {
    it('selects a known track', () => {
      const core = new AudioTrackRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '1');

      expect(media.selectAudioTrack).toHaveBeenCalledWith('1');
    });

    it('does nothing for an unknown track', () => {
      const core = new AudioTrackRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '3');

      expect(media.selectAudioTrack).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', () => {
      const core = new AudioTrackRadioGroupCore({ disabled: true });
      const media = createMediaState();

      core.selectValue(media, '1');

      expect(media.selectAudioTrack).not.toHaveBeenCalled();
    });
  });
});
