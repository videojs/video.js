import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { SpfVideoAdapter } from '../playback';

const HLS_URL = 'https://stream.mux.com/abc123.m3u8';
const MP4_URL = 'https://stream.mux.com/abc123/highest.mp4';

// jsdom has no MediaSource, so each test says whether the browser has one.
function stubMediaSource() {
  vi.stubGlobal('MediaSource', class {});
}

beforeEach(() => {
  // The SPF engine fetches the manifest as soon as it has a source.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SpfVideoAdapter', () => {
  it('plays HLS through SPF when the browser has Media Source Extensions', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.src = HLS_URL;

    expect(media.engineName).toBe('spf-hls-video-mpeg-ts');
    expect(media.engine?.state.presentation.get()?.url).toBe(HLS_URL);
  });

  it('plays HLS natively when the browser has no Media Source Extensions', () => {
    const media = new SpfVideoAdapter();
    const video = document.createElement('video');

    media.attach(video);
    media.src = HLS_URL;

    expect(media.engineName).toBe('browser');
    expect(media.engine).toBe(null);
    expect(video.getAttribute('src')).toBe(HLS_URL);
  });

  it('plays a source that is not HLS natively', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.src = MP4_URL;

    expect(media.engineName).toBe('browser');
  });

  it('lets an explicit type override the URL', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.source = { src: 'https://example.com/stream', type: 'application/x-mpegURL' };
    expect(media.engineName).toBe('spf-hls-video-mpeg-ts');

    media.source = { src: HLS_URL, type: 'video/mp4' };
    expect(media.engineName).toBe('browser');
  });

  it('plays natively when preferPlayback asks for it', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.source = { src: HLS_URL, preferPlayback: 'native' };

    expect(media.engineName).toBe('browser');
  });

  it('keeps one SPF engine across sources', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.src = HLS_URL;
    const { engine } = media;

    media.src = 'https://stream.mux.com/def456.m3u8';

    expect(media.engine).toBe(engine);
    expect(media.engine?.state.presentation.get()?.url).toBe('https://stream.mux.com/def456.m3u8');
  });

  it('switches engines when the path changes', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.src = HLS_URL;
    media.src = MP4_URL;
    expect(media.engineName).toBe('browser');

    media.src = HLS_URL;
    expect(media.engineName).toBe('spf-hls-video-mpeg-ts');
  });

  it('carries type and preferPlayback over to the next src', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.source = { src: HLS_URL, type: 'application/vnd.apple.mpegurl', preferPlayback: 'native' };
    media.src = 'https://stream.mux.com/def456';

    expect(media.source).toEqual({
      src: 'https://stream.mux.com/def456',
      type: 'application/vnd.apple.mpegurl',
      preferPlayback: 'native',
    });
  });

  it('fires sourcechange once per source', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();
    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);
    media.src = HLS_URL;

    expect(onSourceChange).toHaveBeenCalledTimes(1);
  });

  it('unloads the current engine when the source is cleared', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    media.src = HLS_URL;
    const { engine } = media;

    media.src = '';

    expect(media.engine).toBe(engine);
    expect(media.engine?.state.presentation.get()).toBeUndefined();
  });

  it('defaults preload to metadata and hands it to the engine', () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();

    expect(media.preload).toBe('metadata');

    media.preload = 'none';
    media.src = HLS_URL;

    expect(media.engine?.state.preload.get()).toBe('none');
  });

  it('tells SPF playback was asked for', async () => {
    stubMediaSource();
    const media = new SpfVideoAdapter();
    const video = document.createElement('video');

    video.play = vi.fn(async () => {});
    media.attach(video);
    media.src = HLS_URL;

    await media.play();

    expect(video.play).toHaveBeenCalled();
    expect(media.engine?.state.loadActivated.get()).toBe(true);
  });
});
