/**
 * SPF-backed MuxAudioAdapter tests.
 *
 * The Mux surface is the shared mixin's, covered against the video flavor in `../mux-video/tests/adapter.test.ts`.
 * What's worth asserting here is that applying it to the audio-only Media keeps that surface intact — the two extend
 * different bases, so nothing guarantees it but a test — plus the two things this flavor decides for itself.
 */
import { createEngine } from '@videojs/spf/engines/hls-audio-mpeg-ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxAudioAdapter } from '../adapter';

// The document Mux serves for the asset, the first chapter standing for it.
const DOCUMENT = [{ 'start-time': 0, titles: [{ language: 'und', title: 'Big Buck Bunny' }] }];

// Every Mux source fetches its metadata, so no test here reaches the network.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(DOCUMENT), { status: 200 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MuxAudioAdapter', () => {
  it('builds its engine with the MPEG-TS audio engine', () => {
    expect(MuxAudioAdapter.createEngine).toBe(createEngine);
  });

  it('defaults source to null', () => {
    expect(new MuxAudioAdapter().source).toBe(null);
  });

  it('derives src from source.playbackId', () => {
    const media = new MuxAudioAdapter();

    media.source = { playbackId: 'abc123' };

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8');
  });

  it('parses a Mux src into a structured source', () => {
    const media = new MuxAudioAdapter();

    media.src = 'https://stream.mux.com/abc123.m3u8?max_resolution=720p';

    expect(media.source).toEqual({ playbackId: 'abc123', playback: { maxResolution: '720p' } });
  });

  it('keeps a non-Mux src as a plain source.src', () => {
    const media = new MuxAudioAdapter();

    media.src = 'https://example.com/audio.m3u8';

    expect(media.source).toEqual({ src: 'https://example.com/audio.m3u8' });
    expect(media.src).toBe('https://example.com/audio.m3u8');
  });

  it('dispatches sourcechange when source changes', () => {
    const media = new MuxAudioAdapter();
    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);

    media.source = { playbackId: 'abc123' };

    expect(onSourceChange).toHaveBeenCalledTimes(1);
  });

  it('derives poster and storyboard URLs, for a video asset played as audio', () => {
    // Kept rather than dropped: a playback ID played as audio is usually a video
    // asset, whose images exist. The element ignores them.
    const media = new MuxAudioAdapter();

    media.source = { playbackId: 'abc123' };

    expect(media.contentData).toEqual({
      poster: 'https://image.mux.com/abc123/thumbnail.webp',
      storyboard: 'https://image.mux.com/abc123/storyboard.vtt?format=webp',
    });
  });

  it('dispatches contentdatachange when the derived urls change', () => {
    const media = new MuxAudioAdapter();
    const onContentDataChange = vi.fn();

    media.addEventListener('contentdatachange', onContentDataChange);

    media.source = { playbackId: 'abc123' };

    expect(onContentDataChange).toHaveBeenCalledTimes(1);
  });

  it('loads the title from the asset metadata, like the video flavor', async () => {
    const media = new MuxAudioAdapter();

    media.source = { playbackId: 'abc123' };
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(fetch).toHaveBeenCalledWith('https://stream.mux.com/abc123/metadata.json', expect.anything());
    expect(media.contentData.title).toBe('Big Buck Bunny');
  });

  it('points unplayable-source copy at the hls.js-backed Media', () => {
    // The audio-only adapter gained the suggestion seam for this: SPF plays
    // neither MPEG-TS nor DRM whichever engine variant is underneath. Named by
    // flavor rather than by import path, as on the video Media.
    expect(MuxAudioAdapter.alternativeMediaSuggestion).toContain('hls-js');
    expect(MuxAudioAdapter.alternativeMediaSuggestion).not.toContain('@videojs/');
  });
});
