import { render } from '@testing-library/react';
import { HlsJsAdapter } from '@videojs/hlsjs-video';
import { MuxVideoAdapter } from '@videojs/mux-video/hls-js';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { MuxVideo } from '../mux-video/hls-js';

/**
 * Render and capture the host instance the `source` prop was written to, so assertions can read the derived `src` off
 * the real media rather than spying on whichever internal setter happens to write it.
 */
function renderWithMedia(ui: ReactElement) {
  const source = vi.spyOn(MuxVideoAdapter.prototype, 'source', 'set');
  const result = render(ui);
  const media = source.mock.contexts[0] as MuxVideoAdapter;

  source.mockRestore();
  return { ...result, media };
}

describe('MuxVideo', () => {
  it('does not spread the source prop onto the element', () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123', preferPlayback: 'native' }} />);

    // The source prop is consumed by the media, not spread onto the element.
    expect(container.querySelector('video')!.hasAttribute('source')).toBe(false);
  });

  it('does not rewrite src when an equivalent source object is re-rendered', () => {
    const src = vi.spyOn(HlsJsAdapter.prototype, 'src', 'set');

    const { rerender } = render(<MuxVideo source={{ playbackId: 'abc123', preferPlayback: 'native' }} />);

    src.mockClear();

    // A fresh object literal every render must be absorbed by the structural guard.
    rerender(<MuxVideo source={{ playbackId: 'abc123', preferPlayback: 'native' }} />);

    expect(src).not.toHaveBeenCalled();

    src.mockRestore();
  });

  it('derives the media src from the source prop', () => {
    const { media } = renderWithMedia(<MuxVideo source={{ playbackId: 'abc123' }} />);

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8');
  });

  it('applies the customDomain and playback params to src', () => {
    const { media } = renderWithMedia(
      <MuxVideo source={{ playbackId: 'abc123', customDomain: 'example.com', playback: { maxResolution: '1080p' } }} />
    );

    const url = new URL(media.src);

    expect(url.host).toBe('stream.example.com');
    expect(url.searchParams.get('max_resolution')).toBe('1080p');
  });

  it('omits playback params from src when a playback token is set', () => {
    const { media } = renderWithMedia(
      <MuxVideo source={{ playbackId: 'abc123', playback: { token: 'jwt', assetStartTime: 3 } }} />
    );

    const url = new URL(media.src);

    expect(url.searchParams.get('token')).toBe('jwt');
    expect(url.searchParams.has('asset_start_time')).toBe(false);
  });

  it('forwards engine options from the source prop to the media', () => {
    const { media } = renderWithMedia(
      <MuxVideo source={{ playbackId: 'abc123', engine: { hlsJs: { maxBufferLength: 60 } } }} />
    );

    expect(media.source?.engine?.hlsJs).toEqual({ maxBufferLength: 60 });
  });

  it('forwards maxAutoResolution from the source prop to the media', () => {
    const { media } = renderWithMedia(<MuxVideo source={{ playbackId: 'abc123', maxAutoResolution: '720p' }} />);

    expect(media.source?.maxAutoResolution).toBe('720p');
  });

  it('forwards the player-size caps from the source prop to the media', () => {
    const { media } = renderWithMedia(
      <MuxVideo source={{ playbackId: 'abc123', capRenditionToPlayerSize: false, minAutoResolution: '1080p' }} />
    );

    expect(media.source?.capRenditionToPlayerSize).toBe(false);
    expect(media.source?.minAutoResolution).toBe('1080p');
  });

  it('adds a storyboard track inferred from the source prop', () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123' }} />);

    const track = container.querySelector('track');

    expect(track?.kind).toBe('metadata');
    expect(track?.getAttribute('src')).toBe('https://image.mux.com/abc123/storyboard.vtt?format=webp');
  });

  it('adds a storyboard track inferred from a Mux stream src', () => {
    const { container } = render(<MuxVideo src="https://stream.mux.com/abc123.m3u8" />);

    expect(container.querySelector('track')?.getAttribute('src')).toBe(
      'https://image.mux.com/abc123/storyboard.vtt?format=webp'
    );
  });

  it('does not add a storyboard track for a non-Mux src', () => {
    const { container } = render(<MuxVideo src="https://example.com/video.m3u8" />);

    expect(container.querySelector('track')).toBeNull();
  });

  it('updates the storyboard track when the source changes without render-phase warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container, rerender } = render(<MuxVideo source={{ playbackId: 'abc123' }} />);

    rerender(<MuxVideo source={{ playbackId: 'xyz789' }} />);

    expect(container.querySelector('track')?.getAttribute('src')).toBe(
      'https://image.mux.com/xyz789/storyboard.vtt?format=webp'
    );
    // Guards against "Cannot update a component while rendering a different component".
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('adds no storyboard track for signed playback without a storyboard token', () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123', playback: { token: 'jwt' } }} />);

    expect(container.querySelector('track')).toBeNull();
  });

  it('does not add a storyboard track for live streams', () => {
    const streamType = vi.spyOn(MuxVideoAdapter.prototype, 'streamType', 'get').mockReturnValue('live');

    const { container } = render(<MuxVideo source={{ playbackId: 'abc123' }} />);

    expect(container.querySelector('track')).toBeNull();

    streamType.mockRestore();
  });

  it('does not sync source.poster to the media poster', () => {
    const { container } = render(<MuxVideo source={{ playbackId: 'abc123', poster: { time: 5 } }} />);

    expect(container.querySelector('video')?.getAttribute('poster')).toBeNull();
  });
});
