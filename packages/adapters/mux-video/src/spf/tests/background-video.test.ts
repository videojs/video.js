import * as hlsBackgroundVideo from '@videojs/spf/engines/hls-background-video';
import { mpegTsTransmuxFeature } from '@videojs/spf/features/mpeg-ts-transmux';
import { describe, expect, it } from 'vite-plus/test';

import { createEngine, features, MuxBackgroundVideoAdapter } from '../background-video';

describe('createEngine', () => {
  it("composes the HLS background-video engine's features and then the MPEG-TS transmux", () => {
    expect(features.slice(0, hlsBackgroundVideo.features.length)).toEqual(hlsBackgroundVideo.features);
    expect(features.at(-1)).toBe(mpegTsTransmuxFeature);
  });

  it("exposes the HLS background-video engine's state and context, since the transmux adds none", () => {
    const mux = createEngine();
    const hls = hlsBackgroundVideo.createEngine();

    expect(Object.keys(mux.state).sort()).toEqual(Object.keys(hls.state).sort());
    expect(Object.keys(mux.context).sort()).toEqual(Object.keys(hls.context).sort());

    mux.destroy();
    hls.destroy();
  });
});

describe('MuxBackgroundVideoAdapter', () => {
  it('builds its engine with the Mux background-video engine', () => {
    expect(MuxBackgroundVideoAdapter.createEngine).toBe(createEngine);
  });
});
