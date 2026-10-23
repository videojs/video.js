import { describe, expect, it } from 'vite-plus/test';

import { createEngine } from '../../../engines/hls-video-mpeg-ts';
import { HlsVideoMpegTsAdapter } from '../adapter';

describe('HlsVideoMpegTsAdapter', () => {
  it('builds its engine with the hls-video-mpeg-ts engine', () => {
    expect(HlsVideoMpegTsAdapter.createEngine).toBe(createEngine);
  });
});
