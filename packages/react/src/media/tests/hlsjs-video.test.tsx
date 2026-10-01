import { render } from '@testing-library/react';
import { HlsJsAdapter } from '@videojs/hlsjs-video';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsVideo } from '../hlsjs-video';

describe('HlsJsVideo', () => {
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

  it('hands the video element rather than the adapter to mediaRef', () => {
    const mediaRef = createRef<HTMLVideoElement>();
    const { container } = render(<HlsJsVideo mediaRef={mediaRef} />);
    const video = container.querySelector('video')!;

    expect(mediaRef.current).toBe(video);
    expect(video.hasAttribute('mediaref')).toBe(false);
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
