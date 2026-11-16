import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxVideo } from '../mux-video';
import { MuxVideo as HlsJsMuxVideo } from '../mux-video/hls-js';
import { MuxVideo as SpfMuxVideo } from '../mux-video/spf';

customElements.define('test-mux-video', MuxVideo);

function createMuxVideo() {
  const el = new MuxVideo();

  document.body.appendChild(el);
  return el;
}

// The SPF-backed Media opens a MediaSource on the attached element and fetches the manifest and the asset metadata as
// soon as a source is assigned. The DOM stand-in has no MSE, and no test here should reach the network. Stubbed for the
// whole file rather than per test: the engine reacts on a microtask, which can land after a test's own teardown.
vi.stubGlobal('MediaSource', class extends EventTarget {});
vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response('', { status: 404 }))
);
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mux-video-test');
vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MuxVideo', () => {
  it('is the SPF-backed flavor by default', () => {
    expect(MuxVideo).toBe(SpfMuxVideo);
    expect(MuxVideo).not.toBe(HlsJsMuxVideo);
    expect(createMuxVideo().adapter.constructor).toHaveProperty('engineName', 'spf-hls-video-mpeg-ts');
  });

  it('exposes the element source as a property, not an attribute', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };

    expect(el.adapter.source).toEqual({ playbackId: 'abc123' });
    expect(el.hasAttribute('source')).toBe(false);
  });

  it('parses the host source from the src attribute', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    expect(el.adapter.src).toBe('https://stream.mux.com/abc123.m3u8');
    expect(el.adapter.source).toEqual({ playbackId: 'abc123' });
  });

  it('applies the customDomain and playback params from the source property', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', customDomain: 'example.com', playback: { maxResolution: '1080p' } };

    const url = new URL(el.adapter.src);

    expect(url.host).toBe('stream.example.com');
    expect(url.searchParams.get('max_resolution')).toBe('1080p');
  });

  it('reflects the derived src to the src attribute when source is set', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };

    expect(el.getAttribute('src')).toBe('https://stream.mux.com/abc123.m3u8');
  });

  it('removes the src attribute when the source is cleared', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };
    el.source = null;

    expect(el.hasAttribute('src')).toBe(false);
    expect(el.adapter.src).toBe('');
  });

  it('adds a storyboard track inferred from the src attribute', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    const track = el.querySelector('track');

    expect(track?.kind).toBe('metadata');
    expect(track?.getAttribute('src')).toBe('https://image.mux.com/abc123/storyboard.vtt?format=webp');
  });

  it('removes the storyboard track when the stream becomes live', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    expect(el.querySelector('track')).not.toBeNull();

    el.adapter.streamType = 'live';
    expect(el.querySelector('track')).toBeNull();
  });

  it('exposes the content data on the element', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('poster-time', '12');

    expect(el.contentData).toEqual({
      poster: 'https://image.mux.com/abc123/thumbnail.webp?time=12',
      storyboard: 'https://image.mux.com/abc123/storyboard.vtt?format=webp',
    });
    expect(el.adapter.source?.poster?.time).toBe(12);
  });
});
