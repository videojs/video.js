import { describe, expect, it } from 'vite-plus/test';

import { createEngine } from '../../../engines/hls-audio-mpeg-ts';
import { HlsAudioMpegTsAdapter } from '../adapter';

describe('HlsAudioMpegTsAdapter', () => {
  it('builds its engine with the hls-audio-mpeg-ts engine', () => {
    expect(HlsAudioMpegTsAdapter.createEngine).toBe(createEngine);
  });
});
