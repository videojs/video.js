import { render, waitFor } from '@testing-library/react';
import { forwardRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createLazyVideo, type LazyMediaDefinition } from '../lazy/create';
import { video } from '../lazy/video';

const AcmeVideo = forwardRef<HTMLDivElement, { src?: string }>(function AcmeVideo({ src }, ref) {
  return <div ref={ref} data-acme={src} />;
});

const acmeVideo: LazyMediaDefinition = {
  match: ({ url }) => url?.hostname === 'video.acme.com',
  component: AcmeVideo,
};

describe('createLazyVideo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the first media that plays the source', () => {
    const AcmeLazyVideo = createLazyVideo([acmeVideo, video]);
    const { container, rerender } = render(<AcmeLazyVideo src="https://video.acme.com/a.mp4" />);

    expect(container.querySelector('[data-acme]')?.getAttribute('data-acme')).toBe('https://video.acme.com/a.mp4');

    rerender(<AcmeLazyVideo src="/movie.mp4" />);

    expect(container.querySelector('video')?.getAttribute('src')).toBe('/movie.mp4');
  });

  it('loads a media from load once a source needs it', async () => {
    const load = vi.fn(() => Promise.resolve(AcmeVideo));
    const AcmeLazyVideo = createLazyVideo([{ match: ({ url }) => url?.hostname === 'video.acme.com', load }]);

    expect(load).not.toHaveBeenCalled();

    const { container } = render(<AcmeLazyVideo src="https://video.acme.com/1" />);

    await waitFor(() => expect(container.querySelector('[data-acme]')).not.toBeNull());
    expect(load).toHaveBeenCalledOnce();
  });

  it('only plays the sources its media do', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const FilesOnly = createLazyVideo([video]);
    const { container } = render(<FilesOnly src="https://www.youtube.com/watch?v=aqz-KE-bpKQ" />);

    expect(container.innerHTML).toBe('');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[LazyVideo] No media plays'));
  });

  it('plays HLS natively wherever the browser can when native playback is preferred', async () => {
    vi.resetModules();
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
    );
    vi.stubGlobal('MediaSource', class {});

    const { createLazyVideo: freshCreateLazyVideo } = await import('../lazy/create');
    const native: LazyMediaDefinition = { match: (s) => s.playback === 'native', component: () => <i data-native /> };
    const mse: LazyMediaDefinition = { match: (s) => s.playback === 'mse', component: () => <i data-mse /> };
    const LazyHls = freshCreateLazyVideo([native, mse]);
    const { container, rerender } = render(<LazyHls src="https://example.com/master.m3u8" />);

    expect(container.querySelector('[data-mse]')).not.toBeNull();

    rerender(<LazyHls src="https://example.com/master.m3u8" preferPlayback="native" />);

    expect(container.querySelector('[data-native]')).not.toBeNull();
  });
});
