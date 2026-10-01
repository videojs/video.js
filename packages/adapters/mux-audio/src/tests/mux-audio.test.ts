import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxAudioAdapter } from '..';

afterEach(() => vi.unstubAllGlobals());

describe('MuxAudioAdapter', () => {
  it('hands a Mux stream to an audio element for native playback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 }))
    );

    const adapter = new MuxAudioAdapter();
    const audio = document.createElement('audio');

    // The audio flavor currently inherits the video adapter's attach signature.
    adapter.attach(audio as unknown as HTMLVideoElement);
    adapter.source = { playbackId: 'abc123', preferPlayback: 'native' };
    await Promise.resolve();

    expect(audio.src).toBe('https://stream.mux.com/abc123.m3u8');

    adapter.destroy();
  });
});
