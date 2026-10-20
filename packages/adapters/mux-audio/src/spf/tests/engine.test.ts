import * as hlsAudio from '@videojs/spf/engines/hls-audio';
import { mpegTsAudioTransmuxFeature } from '@videojs/spf/features/mpeg-ts-audio-transmux';
import { describe, expect, it } from 'vite-plus/test';

import { MuxAudioAdapter } from '../adapter';
import { createEngine, features } from '../engine';

describe('createEngine', () => {
  it("composes the HLS audio engine's features and then the audio-only MPEG-TS transmux", () => {
    expect(features.slice(0, hlsAudio.features.length)).toEqual(hlsAudio.features);
    expect(features.at(-1)).toBe(mpegTsAudioTransmuxFeature);
  });

  it("exposes the HLS audio engine's state and context, since the transmux adds none", () => {
    const mux = createEngine();
    const hls = hlsAudio.createEngine();

    expect(Object.keys(mux.state).sort()).toEqual(Object.keys(hls.state).sort());
    expect(Object.keys(mux.context).sort()).toEqual(Object.keys(hls.context).sort());

    mux.destroy();
    hls.destroy();
  });

  it('is what MuxAudioAdapter builds its engine with', () => {
    expect(MuxAudioAdapter.createEngine).toBe(createEngine);
  });
});
