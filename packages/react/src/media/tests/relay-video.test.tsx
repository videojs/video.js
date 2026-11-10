import { render } from '@testing-library/react';
import type { RelaySubscriberView, RelayVideoAdapter } from '@videojs/relay-video';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RelayVideo } from '../relay-video';

const namespace = ['live', 'room'];

function createSubscriber() {
  return {
    want: vi.fn<RelaySubscriberView['want']>(),
    unwant: vi.fn<RelaySubscriberView['unwant']>(),
    catchUp: vi.fn<RelaySubscriberView['catchUp']>(),
    status: 'live' as const,
    closed: new Promise<{ error?: unknown }>(() => {}),
  };
}

describe('RelayVideo', () => {
  beforeEach(() => {
    vi.stubGlobal('VideoDecoder', class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a canvas with no bitmap that a skin can lay out as a video', () => {
    const { container } = render(<RelayVideo className="frame" style={{ borderRadius: 8 }} />);
    const canvas = container.querySelector('canvas')!;

    expect([canvas.width, canvas.height]).toEqual([0, 0]);
    expect(canvas.className).toBe('frame');
    expect(canvas.style.width).toBe('100%');
    expect(canvas.style.borderRadius).toBe('8px');
  });

  it('wants the catalog of the source it is given and hands out the media that plays it', () => {
    const subscriber = createSubscriber();
    const ref = createRef<HTMLCanvasElement>();
    const mediaRef = createRef<RelayVideoAdapter>();
    const onLoadStart = vi.fn();
    const { container } = render(
      <RelayVideo
        ref={ref}
        mediaRef={mediaRef}
        source={{ subscriber, namespace }}
        autoPlay
        muted
        onLoadStart={onLoadStart}
      />
    );

    expect(subscriber.want).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(/catalog$/),
      { namespace, track: 'catalog' },
      expect.any(Object)
    );
    expect(ref.current).toBe(container.querySelector('canvas'));
    expect(mediaRef.current?.streamType).toBe('live');
    expect([mediaRef.current?.autoplay, mediaRef.current?.muted]).toEqual([true, true]);
    expect(onLoadStart).toHaveBeenCalledOnce();
    expect(container.querySelector('canvas')?.hasAttribute('source')).toBe(false);
  });

  it('keeps the broadcast when a re-render passes the same subscriber and namespace as a new object', () => {
    const subscriber = createSubscriber();
    const { rerender } = render(<RelayVideo source={{ subscriber, namespace: ['live', 'room'] }} />);

    rerender(<RelayVideo source={{ subscriber, namespace: ['live', 'room'] }} />);

    expect(subscriber.want).toHaveBeenCalledOnce();
    expect(subscriber.unwant).not.toHaveBeenCalled();
  });

  it('moves to another namespace, and releases its wants when the source is removed or it unmounts', async () => {
    const subscriber = createSubscriber();
    const { rerender, unmount } = render(<RelayVideo source={{ subscriber, namespace }} />);
    const [first] = subscriber.want.mock.calls[0]!;

    rerender(<RelayVideo source={{ subscriber, namespace: ['live', 'other'] }} />);

    expect(subscriber.unwant).toHaveBeenCalledExactlyOnceWith(first);
    expect(subscriber.want).toHaveBeenLastCalledWith(
      expect.any(String),
      { namespace: ['live', 'other'], track: 'catalog' },
      expect.any(Object)
    );

    rerender(<RelayVideo />);

    expect(subscriber.unwant).toHaveBeenCalledTimes(2);

    rerender(<RelayVideo source={{ subscriber, namespace }} />);
    unmount();

    // Destruction waits a task, so a StrictMode re-mount can cancel it.
    await vi.waitFor(() => expect(subscriber.unwant).toHaveBeenCalledTimes(3));
  });
});
