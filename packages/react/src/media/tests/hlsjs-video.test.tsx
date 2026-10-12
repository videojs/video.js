import { render } from '@testing-library/react';
import { HlsJsAdapter } from '@videojs/hlsjs-video';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsVideo } from '../hlsjs-video';

describe('HlsJsVideo', () => {
  it('links to the help page as fallback content and keeps fallback off the element', () => {
    const { container } = render(<HlsJsVideo />);
    const video = container.querySelector('video');

    expect(video?.querySelector('a')?.getAttribute('href')).toBe('https://videojs.org/help');
    expect(video?.hasAttribute('fallback')).toBe(false);
  });

  it('renders no fallback content when fallback is null', () => {
    const { container } = render(<HlsJsVideo fallback={null} />);

    expect(container.querySelector('video a')).toBeNull();
  });

  it('does not re-attach the media when the parent re-renders with a new inline ref', () => {
    const attach = vi.spyOn(HlsJsAdapter.prototype, 'attach');
    const detach = vi.spyOn(HlsJsAdapter.prototype, 'detach');

    const { rerender } = render(<HlsJsVideo ref={() => {}} />);

    // An inline ref is a new function every render; only the ref itself should be rebound, not the media.
    rerender(<HlsJsVideo ref={() => {}} />);
    rerender(<HlsJsVideo ref={() => {}} />);

    expect(detach).not.toHaveBeenCalled();
    expect(attach).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });

  it('hands the attached adapter to mediaRef and keeps the video on ref', () => {
    const attach = vi.spyOn(HlsJsAdapter.prototype, 'attach');
    const ref = createRef<HTMLVideoElement>();
    let attachedWhenHandedOut = false;
    const mediaRef = vi.fn((adapter: HlsJsAdapter | null) => {
      attachedWhenHandedOut = attach.mock.contexts.includes(adapter);
    });
    const { container, unmount } = render(<HlsJsVideo ref={ref} mediaRef={mediaRef} />);
    const video = container.querySelector('video')!;
    const media = attach.mock.contexts[0] as HlsJsAdapter;

    expect(ref.current).toBe(video);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
    expect(attach).toHaveBeenCalledWith(video);
    expect(attachedWhenHandedOut).toBe(true);
    expect(video.hasAttribute('mediaref')).toBe(false);

    unmount();

    expect(mediaRef).toHaveBeenLastCalledWith(null);

    vi.restoreAllMocks();
  });

  it('does not re-attach the media when the parent re-renders with a new inline mediaRef', () => {
    const attach = vi.spyOn(HlsJsAdapter.prototype, 'attach');
    const detach = vi.spyOn(HlsJsAdapter.prototype, 'detach');

    const { rerender } = render(<HlsJsVideo mediaRef={() => {}} />);

    rerender(<HlsJsVideo mediaRef={() => {}} />);

    expect(detach).not.toHaveBeenCalled();
    expect(attach).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});
