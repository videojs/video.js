import { cleanup, render, renderHook } from '@testing-library/react';
import { type RefCallback, useCallback } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useComposedRefs } from '../use-composed-refs';
import { useMediaEvents } from '../use-media-events';

afterEach(cleanup);

/**
 * Render the hook against a `<div>`, composed the way a media component does: events ref first, then the ref that
 * attaches the media (`onMount` stands in for it).
 */
function Harness({
  media,
  onMount,
  ...props
}: Record<string, unknown> & { media?: EventTarget | null; onMount?: (node: HTMLDivElement) => void }) {
  const { ref: eventsRef, props: rest } = useMediaEvents(props, media);
  const attachRef = useCallback<RefCallback<HTMLDivElement>>((node) => void (node && onMount?.(node)), [onMount]);
  const composedRef = useComposedRefs(eventsRef, attachRef);

  return <div ref={composedRef} {...(rest as Record<string, unknown>)} />;
}

describe('useMediaEvents', () => {
  it('calls media event handlers when the adapter dispatches the event', () => {
    const media = new EventTarget();
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const onTimeUpdate = vi.fn();

    render(<Harness media={media} onPlay={onPlay} onTimeUpdate={onTimeUpdate} />);

    media.dispatchEvent(new Event('play'));
    media.dispatchEvent(new Event('timeupdate'));
    media.dispatchEvent(new Event('pause'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onTimeUpdate).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
  });

  it('listens on the rendered element when no media is given', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container } = render(<Harness onPlay={onPlay} />);
    const element = container.firstElementChild!;

    element.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(element);
  });

  it('binds from the ref so an event dispatched by a later ref is delivered', () => {
    const media = new EventTarget();
    const onLoadStart = vi.fn();

    // Stands in for `attach()`, which dispatches `loadstart` synchronously from the ref composed after this one.
    render(
      <Harness media={media} onLoadStart={onLoadStart} onMount={() => media.dispatchEvent(new Event('loadstart'))} />
    );

    expect(onLoadStart).toHaveBeenCalledTimes(1);
  });

  it('strips media event props and returns the rest', () => {
    const media = new EventTarget();
    const props = { onPlay: vi.fn(), onError: vi.fn(), id: 'player', 'data-kept': 'yes' };
    const { result } = renderHook(() => useMediaEvents(props, media));

    expect(result.current.props).toEqual({ id: 'player', 'data-kept': 'yes' });
  });

  it('calls the latest handler without resubscribing', () => {
    const media = new EventTarget();
    const first = vi.fn();
    const second = vi.fn();
    const addEventListener = vi.spyOn(media, 'addEventListener');

    const { rerender } = render(<Harness media={media} onPause={first} />);
    const subscriptions = addEventListener.mock.calls.length;

    rerender(<Harness media={media} onPause={second} />);
    media.dispatchEvent(new Event('pause'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledTimes(subscriptions);
  });

  it('ignores events once a handler is removed', () => {
    const media = new EventTarget();
    const onEnded = vi.fn();

    const { rerender } = render(<Harness media={media} onEnded={onEnded} />);

    rerender(<Harness media={media} onEnded={undefined} />);
    media.dispatchEvent(new Event('ended'));

    expect(onEnded).not.toHaveBeenCalled();
  });

  it('moves the listeners when the media changes', () => {
    const first = new EventTarget();
    const second = new EventTarget();
    const onPlay = vi.fn((event: Event) => event.currentTarget);

    const { rerender } = render(<Harness media={first} onPlay={onPlay} />);

    rerender(<Harness media={second} onPlay={onPlay} />);
    first.dispatchEvent(new Event('play'));
    second.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(second);
  });

  it('unsubscribes from the adapter on unmount', () => {
    const media = new EventTarget();
    const onPlay = vi.fn();

    const { unmount } = render(<Harness media={media} onPlay={onPlay} />);

    unmount();
    media.dispatchEvent(new Event('play'));

    expect(onPlay).not.toHaveBeenCalled();
  });

  it('unsubscribes when the ref is cleared with null, as React 18 does', () => {
    const media = new EventTarget();
    const onPlay = vi.fn();
    let eventsRef!: ReturnType<typeof useMediaEvents>['ref'];

    function Capture() {
      const result = useMediaEvents({ onPlay }, media);

      eventsRef = result.ref;
      return null;
    }

    render(<Capture />);
    eventsRef(document.createElement('div'));
    eventsRef(null);
    media.dispatchEvent(new Event('play'));

    expect(onPlay).not.toHaveBeenCalled();
  });
});
