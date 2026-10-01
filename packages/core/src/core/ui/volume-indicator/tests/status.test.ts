import { describe, expect, it } from 'vite-plus/test';

import { getVolumeIndicatorDisplayValue, predictVolumeActionOutcome } from '../status';

describe('predictVolumeActionOutcome', () => {
  it('predicts volume outcome like volumeFeature.setVolume when muted', () => {
    expect(predictVolumeActionOutcome({ action: 'volumeStep', value: 0.05 }, { muted: true, volume: 0.5 })).toEqual({
      snapshotVolume: 0.5,
      nextMuted: false,
      nextVolume: 0.55,
    });

    expect(predictVolumeActionOutcome({ action: 'volumeStep', value: -0.05 }, { muted: true, volume: 0.05 })).toEqual({
      snapshotVolume: 0.05,
      nextMuted: true,
      nextVolume: 0,
    });
  });
});

describe('getVolumeIndicatorDisplayValue', () => {
  it('renders an empty fallback when no value is available', () => {
    expect(getVolumeIndicatorDisplayValue({ value: null })).toBe('');
  });
});
