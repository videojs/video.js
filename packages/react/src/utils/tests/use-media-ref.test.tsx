import { render } from '@testing-library/react';
import type { Ref } from 'react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useMediaRef } from '../use-media-ref';

const media = new EventTarget();

function Host({ mediaRef, mounted = true }: { mediaRef: Ref<EventTarget>; mounted?: boolean }) {
  const ref = useMediaRef(media, mediaRef);

  return mounted ? <div ref={ref} /> : null;
}

describe('useMediaRef', () => {
  it('hands the media to a ref object while the element is mounted', () => {
    const mediaRef = createRef<EventTarget>();
    const { rerender } = render(<Host mediaRef={mediaRef} />);

    expect(mediaRef.current).toBe(media);

    rerender(<Host mediaRef={mediaRef} mounted={false} />);

    expect(mediaRef.current).toBe(null);
  });

  it('hands the media to a callback ref and clears it on unmount', () => {
    const mediaRef = vi.fn();
    const { unmount } = render(<Host mediaRef={mediaRef} />);

    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);

    unmount();

    expect(mediaRef).toHaveBeenLastCalledWith(null);
  });

  it('runs a callback ref cleanup instead of passing null', () => {
    const cleanup = vi.fn();
    const mediaRef = vi.fn(() => cleanup);
    const { unmount } = render(<Host mediaRef={mediaRef} />);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
  });
});
