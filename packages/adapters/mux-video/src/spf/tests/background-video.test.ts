import { createEngine } from '@videojs/spf/engines/hls-background-video-mpeg-ts';
import { describe, expect, it } from 'vite-plus/test';

import { MuxBackgroundVideoAdapter } from '../background-video';

describe('MuxBackgroundVideoAdapter', () => {
  it('builds its engine with the MPEG-TS background-video engine', () => {
    expect(MuxBackgroundVideoAdapter.createEngine).toBe(createEngine);
  });
});
