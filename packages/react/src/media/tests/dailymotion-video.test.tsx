import { render } from '@testing-library/react';
import { DailymotionAdapter } from '@videojs/dailymotion-video';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { DailymotionVideo } from '../dailymotion-video';

/** Render and capture the media instance the component attached its container to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(DailymotionAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as DailymotionAdapter;

  attach.mockRestore();
  return { ...result, media };
}

describe('DailymotionVideo', () => {
  it('attaches the media to the container the SDK builds its player in', () => {
    const { container, media } = renderWithMedia(<DailymotionVideo />);

    expect(media.target).toBe(container.firstElementChild);
  });

  it('keeps the player out of hit-testing without controls so the skin above it sees hover', () => {
    const { container, rerender } = render(<DailymotionVideo />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.pointerEvents).toBe('none');

    rerender(<DailymotionVideo controls />);

    expect(element.style.pointerEvents).toBe('');
  });

  it('merges a style prop over its own sizing and hit-testing instead of replacing them', () => {
    const { container, rerender } = render(<DailymotionVideo style={{ borderRadius: 4 }} />);
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.pointerEvents).toBe('none');
    expect(element.style.height).toBe('100%');
    expect(element.style.borderRadius).toBe('4px');

    rerender(<DailymotionVideo style={undefined} />);

    expect(element.style.pointerEvents).toBe('none');
    expect(element.style.height).toBe('100%');
  });

  it('routes media event props to the media rather than the container', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const { container, media } = renderWithMedia(<DailymotionVideo onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(media);
    expect(container.firstElementChild!.hasAttribute('onplay')).toBe(false);
  });

  it('hands the attached media to mediaRef and keeps the container on ref', () => {
    const ref = createRef<HTMLDivElement>();
    const mediaRef = vi.fn();
    const { container, media } = renderWithMedia(<DailymotionVideo ref={ref} mediaRef={mediaRef} />);

    expect(ref.current).toBe(container.firstElementChild);
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
  });
});
