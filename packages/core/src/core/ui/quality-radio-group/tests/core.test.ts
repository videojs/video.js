import type { MediaQualityState } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { QualityRadioGroupState } from '../core';
import { QUALITY_AUTO_VALUE, QualityRadioGroupCore } from '../core';

function createMediaState(overrides: Partial<MediaQualityState> = {}): MediaQualityState {
  return {
    videoRenditionList: [
      { id: '0', height: 1080, bitrate: 6_000_000, selected: false },
      { id: '1', height: 720, bitrate: 3_000_000, selected: false },
    ],
    activeVideoRendition: null,
    selectVideoRendition: vi.fn(),
    ...overrides,
  };
}

function createState(overrides: Partial<QualityRadioGroupState> = {}): QualityRadioGroupState {
  return {
    options: [
      { value: QUALITY_AUTO_VALUE, label: 'Auto', disabled: false },
      { value: '0', label: '1080p', disabled: false },
      { value: '1', label: '720p', disabled: false },
    ],
    value: QUALITY_AUTO_VALUE,
    disabled: false,
    hidden: false,
    availability: 'available',
    label: '',
    ...overrides,
  };
}

describe('QualityRadioGroupCore', () => {
  describe('getState', () => {
    it('projects video renditions', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState();

      core.setMedia(media);

      const state = core.getState();

      expect(state.options).toEqual([
        { value: QUALITY_AUTO_VALUE, label: { key: 'menu.auto', text: 'Auto' }, disabled: false },
        { value: '0', label: '1080p', disabled: false, tier: 'HD' },
        { value: '1', label: '720p', disabled: false },
      ]);
      expect(state.value).toBe(QUALITY_AUTO_VALUE);
    });

    it('adds a bitrate badge when multiple renditions share a size', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState({
        videoRenditionList: [
          { id: '0', width: 1920, height: 1080, bitrate: 6_000_000, selected: false },
          { id: '1', width: 1080, height: 1920, bitrate: 3_000_000, selected: false },
          { id: '2', width: 1280, height: 720, bitrate: 1_500_000, selected: false },
        ],
      });

      core.setMedia(media);

      expect(core.getState().options).toEqual([
        { value: QUALITY_AUTO_VALUE, label: { key: 'menu.auto', text: 'Auto' }, disabled: false },
        { value: '0', label: '1080p', disabled: false, tier: 'HD', badge: '6 Mbps' },
        { value: '1', label: '1080p', disabled: false, tier: 'HD', badge: '3 Mbps' },
        { value: '2', label: '720p', disabled: false },
      ]);
    });

    it('adds superscript labels for high-resolution renditions', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState({
        videoRenditionList: [
          { id: '0', width: 1920, height: 1080, selected: false },
          { id: '1', width: 3840, height: 2160, selected: false },
          { id: '2', width: 7680, height: 4320, selected: false },
        ],
      });

      core.setMedia(media);

      expect(core.getState().options).toEqual([
        { value: QUALITY_AUTO_VALUE, label: { key: 'menu.auto', text: 'Auto' }, disabled: false },
        { value: '0', label: '1080p', disabled: false, tier: 'HD' },
        { value: '1', label: '2160p', disabled: false, tier: '4K' },
        { value: '2', label: '4320p', disabled: false, tier: '8K' },
      ]);
    });

    it('uses the selected rendition value', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState({
        videoRenditionList: [
          { id: '0', height: 1080, selected: false },
          { id: '1', height: 720, selected: true },
        ],
      });

      core.setMedia(media);

      expect(core.getState().value).toBe('1');
    });

    it('labels automatic with the active rendition', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState({
        activeVideoRendition: { id: '1', height: 720, selected: false },
      });

      core.setMedia(media);

      const state = core.getState();

      expect(state.value).toBe(QUALITY_AUTO_VALUE);
      expect(state.options[0]).toEqual({
        value: QUALITY_AUTO_VALUE,
        label: { key: 'menu.autoWithLabel', text: 'Auto ({label})' },
        labelParams: { label: '720p' },
        disabled: false,
      });
    });

    it('matches the active rendition by id', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState({
        videoRenditionList: [
          { id: 'hd', height: 1080, selected: false },
          { id: 'sd', height: 480, selected: false },
        ],
        activeVideoRendition: { id: 'sd', height: 480, selected: false },
      });

      core.setMedia(media);

      expect(core.getState().options[0]).toMatchObject({
        label: { key: 'menu.autoWithLabel' },
        labelParams: { label: '480p' },
      });
    });

    it('marks availability unavailable with one rendition', () => {
      const core = new QualityRadioGroupCore();

      core.setMedia(createMediaState({ videoRenditionList: [{ id: '0', height: 1080, selected: false }] }));

      expect(core.getState()).toMatchObject({ availability: 'unavailable', disabled: true, hidden: true });
    });
  });

  describe('getLabel', () => {
    it('returns the default label', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getLabel(createState())).toMatchObject({ key: 'menu.quality', text: 'Quality' });
    });

    it('returns a custom string label', () => {
      const core = new QualityRadioGroupCore({ label: 'Video quality' });

      expect(core.getLabel(createState())).toBe('Video quality');
    });
  });

  describe('getRenditionLabel', () => {
    it('formats height labels by default', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getRenditionLabel({ id: '0', height: 1080, selected: false })).toBe('1080p');
    });

    it('formats portrait labels using the shorter dimension', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getRenditionLabel({ id: '0', width: 1080, height: 1920, selected: false })).toBe('1080p');
    });

    it('formats cinematic landscape labels using matching widescreen classes', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getRenditionLabel({ id: '0', width: 1920, height: 800, selected: false })).toBe('1080p');
      expect(core.getRenditionLabel({ id: '0', width: 3840, height: 1600, selected: false })).toBe('2160p');
    });

    it('formats non-standard wide landscape labels using height', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getRenditionLabel({ id: '0', width: 1234, height: 567, selected: false })).toBe('567p');
    });

    it('formats bitrate labels when height is missing', () => {
      const core = new QualityRadioGroupCore();

      expect(core.getRenditionLabel({ id: '0', bitrate: 1_500_000, selected: false })).toBe('1.5 Mbps');
    });

    it('uses a custom formatter', () => {
      const core = new QualityRadioGroupCore({
        formatRendition: (rendition) => `${rendition.width}×${rendition.height}`,
      });

      expect(core.getRenditionLabel({ id: '0', width: 1920, height: 1080, selected: false })).toBe('1920×1080');
    });
  });

  describe('selectValue', () => {
    it('selects automatic quality', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, QUALITY_AUTO_VALUE);

      expect(media.selectVideoRendition).toHaveBeenCalledWith(QUALITY_AUTO_VALUE);
    });

    it('selects a known rendition', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '1');

      expect(media.selectVideoRendition).toHaveBeenCalledWith('1');
    });

    it('does nothing for an unknown rendition', () => {
      const core = new QualityRadioGroupCore();
      const media = createMediaState();

      core.selectValue(media, '3');

      expect(media.selectVideoRendition).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', () => {
      const core = new QualityRadioGroupCore({ disabled: true });
      const media = createMediaState();

      core.selectValue(media, '1');

      expect(media.selectVideoRendition).not.toHaveBeenCalled();
    });
  });
});
