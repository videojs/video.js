import { afterEach, describe, expect, it } from 'vite-plus/test';

import { MuxVideo } from '../mux-video';

customElements.define('test-mux-video', MuxVideo);

function createMuxVideo() {
  const el = new MuxVideo();

  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MuxVideo', () => {
  it('exposes the element source as a property, not an attribute', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', preferPlayback: 'native' };

    expect(el.source?.preferPlayback).toBe('native');
    expect(el.adapter.source).toEqual({ playbackId: 'abc123', preferPlayback: 'native' });
    expect(el.hasAttribute('source')).toBe(false);
  });

  it('carries maxAutoResolution through the source property', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', preferPlayback: 'native', maxAutoResolution: '720p' };

    expect(el.source?.maxAutoResolution).toBe('720p');
    expect(el.adapter.source?.maxAutoResolution).toBe('720p');
    // Normalized source options ride the property; no attribute is reflected.
    expect(el.hasAttribute('maxautoresolution')).toBe(false);
  });

  it('keeps maxAutoResolution when the src attribute changes', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', preferPlayback: 'native', maxAutoResolution: '720p' };
    el.setAttribute('src', 'https://stream.mux.com/other.m3u8');

    expect(el.adapter.src).toBe('https://stream.mux.com/other.m3u8');
    expect(el.adapter.source?.playbackId).toBe('other');

    expect(el.source?.maxAutoResolution).toBe('720p');
    expect(el.adapter.source?.maxAutoResolution).toBe('720p');
  });

  it('carries the player-size caps through the source property', () => {
    const el = createMuxVideo();

    el.source = {
      playbackId: 'abc123',
      preferPlayback: 'native',
      capRenditionToPlayerSize: false,
      minAutoResolution: '1080p',
    };

    expect(el.source?.capRenditionToPlayerSize).toBe(false);
    expect(el.source?.minAutoResolution).toBe('1080p');
    expect(el.adapter.source?.capRenditionToPlayerSize).toBe(false);
    expect(el.adapter.source?.minAutoResolution).toBe('1080p');
    // Normalized source options ride the property; no attribute is reflected.
    expect(el.hasAttribute('caprenditiontoplayersize')).toBe(false);
    expect(el.hasAttribute('minautoresolution')).toBe(false);
  });

  it('keeps the player-size caps when the src attribute changes', () => {
    const el = createMuxVideo();

    el.source = {
      playbackId: 'abc123',
      preferPlayback: 'native',
      capRenditionToPlayerSize: false,
      minAutoResolution: '1080p',
    };
    el.setAttribute('src', 'https://stream.mux.com/other.m3u8');

    expect(el.adapter.src).toBe('https://stream.mux.com/other.m3u8');
    expect(el.adapter.source?.playbackId).toBe('other');

    expect(el.source?.capRenditionToPlayerSize).toBe(false);
    expect(el.source?.minAutoResolution).toBe('1080p');
    expect(el.adapter.source?.capRenditionToPlayerSize).toBe(false);
    expect(el.adapter.source?.minAutoResolution).toBe('1080p');
  });

  it('keeps engine options when the src attribute changes', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', preferPlayback: 'native', engine: { hlsJs: { maxBufferLength: 60 } } };
    el.setAttribute('src', 'https://stream.mux.com/other.m3u8');

    expect(el.source).toEqual({
      playbackId: 'other',
      preferPlayback: 'native',
      engine: { hlsJs: { maxBufferLength: 60 } },
    });
  });

  it('parses the host source from the src attribute', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    expect(el.adapter.src).toBe('https://stream.mux.com/abc123.m3u8');
    expect(el.adapter.source).toEqual({ playbackId: 'abc123' });
  });

  it('derives the host src from the source property', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };

    expect(el.adapter.src).toBe('https://stream.mux.com/abc123.m3u8');
    expect(el.source).toEqual({ playbackId: 'abc123' });
  });

  it('applies the customDomain and playback params from the source property', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', customDomain: 'example.com', playback: { maxResolution: '1080p' } };

    const url = new URL(el.adapter.src);

    expect(url.host).toBe('stream.example.com');
    expect(url.searchParams.get('max_resolution')).toBe('1080p');
  });

  it('adds a storyboard track inferred from the src attribute', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    const track = el.querySelector('track');

    expect(track?.kind).toBe('metadata');
    expect(track?.getAttribute('src')).toBe('https://image.mux.com/abc123/storyboard.vtt?format=webp');
  });

  it('adds a storyboard track inferred from the source property', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', customDomain: 'example.com' };

    expect(el.querySelector('track')?.getAttribute('src')).toBe(
      'https://image.example.com/abc123/storyboard.vtt?format=webp'
    );
  });

  it('adds no storyboard track for signed playback without a storyboard token', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', playback: { token: 'jwt' } };

    expect(el.querySelector('track')).toBeNull();
  });

  it('removes the storyboard track when the src is cleared', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    expect(el.querySelector('track')).not.toBeNull();

    el.removeAttribute('src');
    expect(el.querySelector('track')).toBeNull();
  });

  it('does not add a storyboard track for live streams', () => {
    const el = createMuxVideo();

    el.adapter.streamType = 'live';
    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    expect(el.querySelector('track')).toBeNull();
  });

  it('removes the storyboard track when the stream becomes live', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    expect(el.querySelector('track')).not.toBeNull();

    el.adapter.streamType = 'live';
    expect(el.querySelector('track')).toBeNull();
  });

  it('keeps a single storyboard track across source changes', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('src', 'https://stream.mux.com/xyz789.m3u8');

    const tracks = el.querySelectorAll('track');

    expect(tracks.length).toBe(1);
    expect(tracks[0]?.getAttribute('src')).toBe('https://image.mux.com/xyz789/storyboard.vtt?format=webp');
  });

  it('reflects the derived src to the src attribute when source is set', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };

    expect(el.getAttribute('src')).toBe('https://stream.mux.com/abc123.m3u8');
  });

  it('updates a stale src attribute when source replaces it', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.source = { playbackId: 'xyz789' };

    expect(el.getAttribute('src')).toBe('https://stream.mux.com/xyz789.m3u8');
    expect(el.adapter.src).toBe('https://stream.mux.com/xyz789.m3u8');
  });

  it('removes the src attribute when the source is cleared', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123' };
    el.source = null;

    expect(el.hasAttribute('src')).toBe(false);
    expect(el.adapter.src).toBe('');
  });

  it('does not sync source.poster to the media poster', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', poster: { time: 5, ext: 'jpg' } };

    expect(el.adapter.poster).toBe('');
  });

  it('exposes the content data on the element', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('poster-time', '12');

    expect(el.contentData).toEqual({
      poster: 'https://image.mux.com/abc123/thumbnail.webp?time=12',
      storyboard: 'https://image.mux.com/abc123/storyboard.vtt?format=webp',
    });
  });

  it('reflects the poster-time attribute to source.poster.time', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('poster-time', '12');

    expect(el.adapter.source?.poster?.time).toBe(12);
  });

  it('does not build a source from poster-time alone', () => {
    const el = createMuxVideo();

    el.setAttribute('poster-time', '12');

    // A poster-only source has no URL to play, and assigning one would schedule a
    // load. The attribute is re-applied once a real source arrives.
    expect(el.adapter.source).toBeNull();
  });

  it('reflects poster-time set before the src', () => {
    const el = createMuxVideo();

    el.setAttribute('poster-time', '12');
    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');

    // Mux identity comes from the URL and carries no poster params over, so the
    // attribute has to be re-applied after the source changes.
    expect(el.adapter.source?.poster?.time).toBe(12);
  });

  it('keeps poster-time across a source change', () => {
    const el = createMuxVideo();

    el.setAttribute('poster-time', '12');
    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('src', 'https://stream.mux.com/xyz789.m3u8');

    expect(el.adapter.source).toEqual({ playbackId: 'xyz789', poster: { time: 12 } });
  });

  it('clears source.poster.time when poster-time is removed', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('poster-time', '12');
    el.removeAttribute('poster-time');

    expect(el.adapter.source).toEqual({ playbackId: 'abc123' });
  });

  it('leaves a source.poster.time set through JS alone', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', poster: { time: 5 } };
    el.setAttribute('src', 'https://stream.mux.com/xyz789.m3u8');

    // No `poster-time` attribute means no opinion, not "clear it". The value is
    // only dropped because Mux identity changed, matching every other poster param.
    expect(el.adapter.source).toEqual({ playbackId: 'xyz789' });

    el.source = { playbackId: 'abc123', poster: { time: 5 } };
    expect(el.adapter.source?.poster?.time).toBe(5);
  });

  it('keeps an existing poster time when poster-time is not a number', () => {
    const el = createMuxVideo();

    el.source = { playbackId: 'abc123', poster: { time: 5 } };
    el.setAttribute('poster-time', 'soon');

    // Invalid is not the same as removed, so the JS-set value survives.
    expect(el.adapter.source?.poster?.time).toBe(5);
  });

  it('ignores a non-numeric poster-time', () => {
    const el = createMuxVideo();

    el.setAttribute('src', 'https://stream.mux.com/abc123.m3u8');
    el.setAttribute('poster-time', 'soon');

    expect(el.adapter.source?.poster?.time).toBeUndefined();
  });
});
