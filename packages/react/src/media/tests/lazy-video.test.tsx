import { render, waitFor } from '@testing-library/react';
import { HlsJsAdapter } from '@videojs/hlsjs-video';
import type { Media } from '@videojs/media';
import { NativeHlsAdapter } from '@videojs/native-hls-video';
import { defineSlice } from '@videojs/store';
import { createRef, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayer } from '../../player/create-player';
import { LazyVideo } from '../lazy-video';

const HLS = 'https://example.com/master.m3u8';
// The first import of an engine can be slow under a full test run.
const LOAD_TIMEOUT = { timeout: 5000 };

describe('LazyVideo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders a native video for a file, without loading an engine', () => {
    const ref = createRef<HTMLVideoElement | HTMLIFrameElement>();
    const { container } = render(<LazyVideo ref={ref} src="/movie.mp4" playsInline data-testid="media" />);
    const video = container.querySelector('video')!;

    expect(video.getAttribute('src')).toBe('/movie.mp4');
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.dataset.testid).toBe('media');
    expect(ref.current).toBe(video);
  });

  it('passes an explicit preload through', () => {
    const { container } = render(<LazyVideo src="/movie.mp4" preload="metadata" />);

    expect(container.querySelector('video')!.getAttribute('preload')).toBe('metadata');
  });

  it('loads hls.js for HLS when MSE playback is preferred', async () => {
    const attach = vi.spyOn(HlsJsAdapter.prototype, 'attach');
    const { container } = render(<LazyVideo src={HLS} preferPlayback="mse" />);

    await waitFor(() => expect(attach).toHaveBeenCalled(), LOAD_TIMEOUT);

    expect(attach).toHaveBeenCalledWith(container.querySelector('video'));
    expect(container.querySelector('[type], [preferplayback]')).toBeNull();
  });

  it('loads native HLS on Safari', async () => {
    vi.resetModules();
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
    );
    vi.stubGlobal('MediaSource', class {});
    const { LazyVideo: FreshLazyVideo } = await import('../lazy-video');
    const { NativeHlsAdapter: FreshNativeHlsAdapter } = await import('@videojs/native-hls-video');
    const attach = vi.spyOn(FreshNativeHlsAdapter.prototype, 'attach');

    render(<FreshLazyVideo src={HLS} />);

    await waitFor(() => expect(attach).toHaveBeenCalled(), LOAD_TIMEOUT);
    expect(FreshNativeHlsAdapter).not.toBe(NativeHlsAdapter);
  });

  it('hands mediaRef the media the player uses, across a swap and unmount', async () => {
    const { Player, useMedia } = createPlayer({ features: [defineSlice()({ state: () => ({ paused: true }) })] });
    const attach = vi.spyOn(HlsJsAdapter.prototype, 'attach');
    const onPlayerMedia = vi.fn<(media: Media | null) => void>();
    let attachedWhenHandedOut = false;
    const mediaRef = vi.fn((media: Media | null) => {
      if (media instanceof HlsJsAdapter) attachedWhenHandedOut = attach.mock.contexts.includes(media);
    });

    function PlayerMedia() {
      onPlayerMedia(useMedia());
      return null;
    }

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <Player>
          {children}
          <PlayerMedia />
        </Player>
      );
    }

    const { container, rerender, unmount } = render(<LazyVideo src="/movie.mp4" mediaRef={mediaRef} />, {
      wrapper: Wrapper,
    });
    const video = container.querySelector('video');

    expect(mediaRef).toHaveBeenLastCalledWith(video);
    expect(onPlayerMedia).toHaveBeenLastCalledWith(video);

    rerender(<LazyVideo src={HLS} preferPlayback="mse" mediaRef={mediaRef} />);

    await waitFor(() => expect(mediaRef.mock.lastCall?.[0]).toBeInstanceOf(HlsJsAdapter), LOAD_TIMEOUT);
    const adapter = mediaRef.mock.lastCall![0];

    expect(mediaRef).toHaveBeenCalledWith(null);
    expect(attachedWhenHandedOut).toBe(true);
    await waitFor(() => expect(onPlayerMedia).toHaveBeenLastCalledWith(adapter));

    unmount();

    expect(mediaRef).toHaveBeenLastCalledWith(null);
  });

  it('resolves an extensionless source from type', () => {
    const { container } = render(<LazyVideo src="https://cdn.example.com/signed?token=1" type="video/mp4" />);
    const video = container.querySelector('video')!;

    expect(video.getAttribute('src')).toBe('https://cdn.example.com/signed?token=1');
    expect(video.hasAttribute('type')).toBe(false);
  });

  it('renders an embed without fallback content', async () => {
    const { container } = render(<LazyVideo src="https://vimeo.com/76979871" fallback={<a href="/help">Help</a>} />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull(), LOAD_TIMEOUT);

    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('iframe')!.hasAttribute('fallback')).toBe(false);
  });

  it('loads the player.js media for an embed marked playerjs, without passing the marker on', async () => {
    // Preloading, so the embed is built and its URL can be read.
    const { container } = render(<LazyVideo src="https://embed.example.com/e/moo?playerjs" preload="metadata" />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull(), LOAD_TIMEOUT);

    expect(container.querySelector('iframe')!.getAttribute('src')).toBe('https://embed.example.com/e/moo');
  });

  it('leaves an embed unbuilt by default, so nothing loads from its service until playback', async () => {
    const { container } = render(<LazyVideo src="https://vimeo.com/76979871" />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull(), LOAD_TIMEOUT);

    expect(container.querySelector('iframe')!.hasAttribute('src')).toBe(false);
  });

  it('swaps the media when the source needs a different one', async () => {
    const { container, rerender } = render(<LazyVideo src="/movie.mp4" />);

    rerender(<LazyVideo src="https://vimeo.com/76979871" />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull(), LOAD_TIMEOUT);
    expect(container.querySelector('video')).toBeNull();
  });

  it('renders nothing and reports a source it cannot resolve', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<LazyVideo src="https://embed.example.com/e/moo" />);

    expect(container.innerHTML).toBe('');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('pass its MIME type as `type`'));
  });

  it('renders nothing without reporting when there is no source', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<LazyVideo />);

    expect(container.innerHTML).toBe('');
    expect(error).not.toHaveBeenCalled();
  });

  it('server-renders files and leaves the HLS choice to the client', () => {
    expect(renderToString(<LazyVideo src="/movie.mp4" fallback={null} />)).toContain(
      '<video src="/movie.mp4" preload="none"></video>'
    );
    expect(renderToString(<LazyVideo src={HLS} />)).toBe('');
  });
});
