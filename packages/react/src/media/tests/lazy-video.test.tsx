import { render, waitFor } from '@testing-library/react';
import { HlsJsAdapter } from '@videojs/hlsjs-video';
import { NativeHlsAdapter } from '@videojs/native-hls-video';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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

  it('swaps the media when the source needs a different one', async () => {
    const { container, rerender } = render(<LazyVideo src="/movie.mp4" />);

    rerender(<LazyVideo src="https://vimeo.com/76979871" />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull(), LOAD_TIMEOUT);
    expect(container.querySelector('video')).toBeNull();
  });

  it('renders nothing and reports a source it cannot resolve', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<LazyVideo src="https://fast.wistia.net/embed/iframe/e4a27b971d" />);

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
