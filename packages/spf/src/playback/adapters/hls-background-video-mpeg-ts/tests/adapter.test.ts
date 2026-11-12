import { describe, expect, it } from 'vite-plus/test';

import { createEngine } from '../../../engines/hls-background-video-mpeg-ts';
import { HlsBackgroundVideoMpegTsAdapter } from '../adapter';

describe('HlsBackgroundVideoMpegTsAdapter', () => {
  it('builds its engine with the hls-background-video-mpeg-ts engine', () => {
    expect(HlsBackgroundVideoMpegTsAdapter.createEngine).toBe(createEngine);
  });

  it('reports the hls-background-video-mpeg-ts engine by name', () => {
    expect(HlsBackgroundVideoMpegTsAdapter.engineName).toBe('spf-hls-background-video-mpeg-ts');
  });
});
