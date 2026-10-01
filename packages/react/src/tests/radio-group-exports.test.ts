import { describe, expect, it } from 'vite-plus/test';

import { AudioTrackRadioGroup, CaptionsRadioGroup, PlaybackRateRadioGroup, QualityRadioGroup } from '../index';
import * as AudioTrackParts from '../ui/audio-track-radio-group/component';
import * as CaptionsParts from '../ui/captions-radio-group/component';
import * as PlaybackRateParts from '../ui/playback-rate-radio-group/component';
import * as QualityParts from '../ui/quality-radio-group/component';

describe('AudioTrackRadioGroup', () => {
  it('exposes its parts from the package root', () => {
    expect(AudioTrackRadioGroup.Root).toBe(AudioTrackParts.AudioTrackRadioGroupRoot);
    expect(AudioTrackRadioGroup.Options).toBe(AudioTrackParts.AudioTrackRadioGroupOptions);
    expect(AudioTrackRadioGroup.Value).toBe(AudioTrackParts.AudioTrackRadioGroupValue);
  });
});

describe('CaptionsRadioGroup', () => {
  it('exposes its parts from the package root', () => {
    expect(CaptionsRadioGroup.Root).toBe(CaptionsParts.CaptionsRadioGroupRoot);
    expect(CaptionsRadioGroup.Options).toBe(CaptionsParts.CaptionsRadioGroupOptions);
    expect(CaptionsRadioGroup.Value).toBe(CaptionsParts.CaptionsRadioGroupValue);
  });
});

describe('PlaybackRateRadioGroup', () => {
  it('exposes its parts from the package root', () => {
    expect(PlaybackRateRadioGroup.Root).toBe(PlaybackRateParts.PlaybackRateRadioGroupRoot);
    expect(PlaybackRateRadioGroup.Options).toBe(PlaybackRateParts.PlaybackRateRadioGroupOptions);
    expect(PlaybackRateRadioGroup.Value).toBe(PlaybackRateParts.PlaybackRateRadioGroupValue);
  });
});

describe('QualityRadioGroup', () => {
  it('exposes its parts from the package root', () => {
    expect(QualityRadioGroup.Root).toBe(QualityParts.QualityRadioGroupRoot);
    expect(QualityRadioGroup.Options).toBe(QualityParts.QualityRadioGroupOptions);
    expect(QualityRadioGroup.Value).toBe(QualityParts.QualityRadioGroupValue);
  });
});
