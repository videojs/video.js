import { render } from '@testing-library/react';
import { VidyardAdapter } from '@videojs/vidyard-video';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { VidyardVideo } from '../vidyard-video';

/** Render and capture the media instance the component attached its container to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(VidyardAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as VidyardAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('VidyardVideo', () => {
  it('attaches the media to the container the player is built in', () => {
    const { container, media } = renderWithMedia(<VidyardVideo />);
    const element = container.firstElementChild as HTMLElement;

    expect(media.target).toBe(element);
    expect(element.hasAttribute('data-cross-origin-frame')).toBe(true);
  });

  it('keeps a chromeless player out of hit-testing so the skin above it sees hover and clicks', () => {
    const { container, rerender } = render(<VidyardVideo />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.pointerEvents).toBe('none');

    rerender(<VidyardVideo controls />);
    expect(element.style.pointerEvents).toBe('');
  });

  it('merges a style prop over its own sizing without putting a chromeless player back into hit-testing', () => {
    const { container, rerender } = render(<VidyardVideo style={{ borderRadius: 4, pointerEvents: 'auto' }} />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.position).toBe('relative');
    expect(element.style.height).toBe('100%');
    expect(element.style.borderRadius).toBe('4px');
    expect(element.style.pointerEvents).toBe('none');

    rerender(<VidyardVideo style={undefined} />);

    expect(element.style.height).toBe('100%');
  });

  it('accepts the <video> spelling of autoplay', () => {
    const { media } = renderWithMedia(<VidyardVideo autoPlay />);

    expect(media.autoplay).toBe(true);
  });

  it('routes media event props to the media rather than the container', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container, media } = renderWithMedia(<VidyardVideo onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(container.firstElementChild!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the container on ref', () => {
    const ref = createRef<HTMLDivElement>();
    const mediaRef = vi.fn();
    const { container, media } = renderWithMedia(<VidyardVideo ref={ref} mediaRef={mediaRef} />);

    expect(ref.current).toBe(container.firstElementChild);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
  });
});
