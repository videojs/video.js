import { act, render } from '@testing-library/react';
import { HyperFramesAdapter, type HyperFramesMount, type HyperFramesTimeline } from '@videojs/hyperframes-video';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { HyperFramesVideo } from '../hyperframes-video';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Render and capture the media instance the component attached its iframe to. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(HyperFramesAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as HyperFramesAdapter;

  attach.mockRestore();
  return { ...result, media };
}

const timeline = (): HyperFramesTimeline => ({ duration: () => 1, seek: () => {}, pause: () => {} });

describe('HyperFramesVideo', () => {
  it('plays its children, mounted into the composition root once the frame asks for them', async () => {
    const { media } = renderWithMedia(
      <HyperFramesVideo compositionId="intro" timeline={timeline}>
        <h1 className="title">Hello</h1>
      </HyperFramesVideo>
    );
    const { source } = media;
    // Stands in for the composition root inside the frame, which jsdom does not load.
    const root = document.createElement('div');

    document.body.append(root);

    expect(source).toMatchObject({ id: 'intro', timeline });
    expect(root.querySelector('.title')).toBe(null);

    // `act` flushes the render the mount asks for only once its callback returns, so the mount is awaited after it.
    const mounted = (source!.content as HyperFramesMount)(root);

    await act(async () => {});
    await mounted;

    expect(root.querySelector('.title')?.textContent).toBe('Hello');
  });

  it('updates the composition playing on a re-render, rather than loading a new one', () => {
    const { media, rerender } = renderWithMedia(
      <HyperFramesVideo>
        <p>1</p>
      </HyperFramesVideo>
    );
    const sourcechange = vi.fn();

    media.addEventListener('sourcechange', sourcechange);
    rerender(
      <HyperFramesVideo timeline={timeline}>
        <p>2</p>
      </HyperFramesVideo>
    );

    expect(sourcechange).not.toHaveBeenCalled();
    expect(media.source?.timeline).toBe(timeline);
  });

  it('loads a new composition for a new compositionId', () => {
    const { media, rerender } = renderWithMedia(
      <HyperFramesVideo compositionId="intro">
        <p>1</p>
      </HyperFramesVideo>
    );
    const sourcechange = vi.fn();

    media.addEventListener('sourcechange', sourcechange);
    rerender(
      <HyperFramesVideo compositionId="outro">
        <p>1</p>
      </HyperFramesVideo>
    );

    expect(sourcechange).toHaveBeenCalledTimes(1);
  });

  it('plays a composition document from html or src when it has no children', () => {
    expect(renderWithMedia(<HyperFramesVideo html="<html></html>" />).media.source).toEqual({ html: '<html></html>' });
    expect(renderWithMedia(<HyperFramesVideo src="https://example.com/intro.html" />).media.source).toEqual({
      src: 'https://example.com/intro.html',
    });
  });

  it('keeps the composition out of hit-testing so the skin above it takes every pointer event', () => {
    const { container } = render(<HyperFramesVideo html="<html></html>" />);

    expect(container.querySelector('iframe')!.style.pointerEvents).toBe('none');
  });

  it('hands the attached media to mediaRef and keeps the iframe on ref', () => {
    const ref = createRef<HTMLIFrameElement>();
    const mediaRef = vi.fn();
    const { container, media } = renderWithMedia(
      <HyperFramesVideo html="<html></html>" ref={ref} mediaRef={mediaRef} />
    );

    expect(ref.current).toBe(container.querySelector('iframe'));
    expect(mediaRef).toHaveBeenCalledExactlyOnceWith(media);
  });

  it('routes media event props to the media', () => {
    const onPlay = vi.fn();
    const { media } = renderWithMedia(<HyperFramesVideo html="<html></html>" onPlay={onPlay} />);

    media.dispatchEvent(new Event('play'));

    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
