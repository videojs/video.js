import { describe, expect, it } from 'vite-plus/test';

import { createEngine } from '../../../engines/hls-video-mpeg-ts';
import { HlsVideoMpegTsAdapter } from '../adapter';

describe('HlsVideoMpegTsAdapter', () => {
  it('builds its engine with the hls-video-mpeg-ts engine', () => {
    expect(HlsVideoMpegTsAdapter.createEngine).toBe(createEngine);
  });

  it('reports the hls-video-mpeg-ts engine by name', () => {
    expect(HlsVideoMpegTsAdapter.engineName).toBe('spf-hls-video-mpeg-ts');
  });
});
