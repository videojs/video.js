import * as hlsVideo from '@videojs/spf/engines/hls-video';
import { mpegTsTransmuxFeature } from '@videojs/spf/features/mpeg-ts-transmux';
import { describe, expect, it } from 'vite-plus/test';

import { MuxVideoAdapter } from '../adapter';
import { createEngine, features } from '../engine';

describe('createEngine', () => {
  it("composes the HLS video engine's features and then the MPEG-TS transmux", () => {
    expect(features.slice(0, hlsVideo.features.length)).toEqual(hlsVideo.features);
    expect(features.at(-1)).toBe(mpegTsTransmuxFeature);
  });

  it("exposes the HLS video engine's state and context, since the transmux adds none", () => {
    const mux = createEngine();
    const hls = hlsVideo.createEngine();

    expect(Object.keys(mux.state).sort()).toEqual(Object.keys(hls.state).sort());
    expect(Object.keys(mux.context).sort()).toEqual(Object.keys(hls.context).sort());

    mux.destroy();
    hls.destroy();
  });

  it('is what MuxVideoAdapter builds its engine with', () => {
    expect(MuxVideoAdapter.createEngine).toBe(createEngine);
  });
});
