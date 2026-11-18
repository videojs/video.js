import { describe, expect, it } from 'vite-plus/test';

import { liveVideoFeatures } from '../presets';
import { audioTrackFeature, playbackRateFeature, qualityFeature } from '../shared';

describe('liveVideoFeatures', () => {
  it('includes quality and audio-track selection but not playback rate', () => {
    expect(liveVideoFeatures).toContain(qualityFeature);
    expect(liveVideoFeatures).toContain(audioTrackFeature);
    expect(liveVideoFeatures).not.toContain(playbackRateFeature);
  });
});
