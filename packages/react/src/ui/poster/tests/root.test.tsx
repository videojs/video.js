import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createStore } from '@videojs/store';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Poster } from '..';
import { createPlayerWrapper } from '../../../testing/mocks';

afterEach(cleanup);

function wrapper(state: { started?: boolean; poster?: string } = {}) {
  const { started = false, poster = '' } = state;

  return createPlayerWrapper({
    paused: !started,
    ended: false,
    started,
    waiting: false,
    play: async () => {},
    pause: () => {},
    // Part of the metadata state this mock stands in for, and nothing here reads it.
    title: '',
    poster,
  }).Wrapper;
}

function DefaultPoster(props: Poster.ImageProps = {}) {
  return (
    <Poster.Root data-testid="poster">
      <Poster.Image data-testid="image" {...props} />
    </Poster.Root>
  );
}

describe('Poster', () => {
  it('renders a root around the image carrying the resolved poster', () => {
    const { getByTestId } = render(<DefaultPoster />, { wrapper: wrapper({ poster: 'poster.jpg' }) });

    expect(getByTestId('poster').tagName).toBe('DIV');
    expect(getByTestId('image').tagName).toBe('IMG');
    expect(getByTestId('image').getAttribute('src')).toBe('poster.jpg');
  });

  it('leaves the src attribute off when nothing resolved one', () => {
    const { getByTestId } = render(<DefaultPoster />, { wrapper: wrapper() });

    // An empty `src` requests the document URL.
    expect(getByTestId('image').hasAttribute('src')).toBe(false);
  });

  it('prefers a src passed to the image over the resolved one', () => {
    const { getByTestId } = render(<DefaultPoster src="mine.jpg" />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    expect(getByTestId('image').getAttribute('src')).toBe('mine.jpg');
  });

  it('makes the image decorative by default and takes an alt you supply', () => {
    const { getByTestId, rerender } = render(<DefaultPoster />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    expect(getByTestId('image').getAttribute('alt')).toBe('');

    rerender(<DefaultPoster alt="Keynote speaker" />);

    expect(getByTestId('image').getAttribute('alt')).toBe('Keynote speaker');
  });

  it('keeps the image attributes it does not own', () => {
    const { getByTestId } = render(<DefaultPoster srcSet="poster-480.jpg 480w" sizes="100vw" loading="lazy" />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    const image = getByTestId('image');

    expect(image.getAttribute('srcset')).toBe('poster-480.jpg 480w');
    expect(image.getAttribute('sizes')).toBe('100vw');
    expect(image.getAttribute('loading')).toBe('lazy');
  });

  it('leaves the source alone when only a srcSet is authored', () => {
    const { getByTestId } = render(<DefaultPoster srcSet="poster@2x.jpg 2x" />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    // `src` would join the candidate set as the 1x entry.
    expect(getByTestId('image').hasAttribute('src')).toBe(false);
  });

  it('reports loading again on the root when the srcSet changes', () => {
    const { getByTestId, rerender } = render(<DefaultPoster srcSet="poster-480.jpg 480w" />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    fireEvent.load(getByTestId('image'));
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(true);

    rerender(<DefaultPoster srcSet="other-480.jpg 480w" />);

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(false);
  });

  it('hides the root once playback starts', async () => {
    const { value, Wrapper } = createPlayerWrapper();
    let start = () => {};
    const store = createStore()({
      name: 'poster',
      state: () => ({
        paused: true,
        ended: false,
        started: false,
        waiting: false,
        play: async () => {},
        pause: () => {},
        title: '',
        poster: 'poster.jpg',
      }),
      attach({ set }) {
        start = () => set({ started: true });
      },
    });

    store.attach({});
    value.store = store;

    const { getByTestId } = render(<DefaultPoster />, { wrapper: Wrapper });
    const root = getByTestId('poster');

    expect(root.hasAttribute('data-visible')).toBe(true);

    await act(async () => start());

    expect(root.hasAttribute('data-visible')).toBe(false);
  });

  it('reports the image lifecycle on the root, matching the HTML element', () => {
    const { getByTestId } = render(
      <Poster.Root data-testid="poster">
        <div data-testid="blur" />
        <Poster.Image data-testid="image" />
        <div data-testid="overlay" />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );
    const root = getByTestId('poster');

    expect(root.contains(getByTestId('blur'))).toBe(true);
    expect(root.contains(getByTestId('overlay'))).toBe(true);
    expect(root.hasAttribute('data-loading')).toBe(true);
    expect(root.hasAttribute('data-loaded')).toBe(false);

    fireEvent.load(getByTestId('image'));

    expect(root.hasAttribute('data-loaded')).toBe(true);
    expect(root.hasAttribute('data-loading')).toBe(false);
  });

  it('reports the lifecycle of a render override that rewrote the src', () => {
    const { getByTestId } = render(
      <Poster.Root data-testid="poster">
        <Poster.Image render={(props) => <img {...props} src="/optimized.jpg" data-testid="image" alt="" />} />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);

    fireEvent.load(getByTestId('image'));

    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(false);
  });

  it("reports an override whose own source had already loaded, which `complete` can't tell it", () => {
    // Decoded before mount, so no `load` is coming.
    const naturalWidth = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);

    const { getByTestId } = render(
      <Poster.Root data-testid="poster">
        <Poster.Image render={(props) => <img {...props} src={undefined} data-testid="image" alt="" />} />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );

    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(false);

    naturalWidth.mockRestore();
  });

  it('reads a cached image that an override mounts only once a source resolved', () => {
    const naturalWidth = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
    const { getByTestId, rerender } = render(
      <Poster.Root data-testid="poster">
        <Poster.Image render={() => null} />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);

    // What the documented `renderPoster` pattern does: nothing until `src` arrives,
    // then an image the browser may already have, which never fires `load`.
    rerender(
      <Poster.Root data-testid="poster">
        <Poster.Image render={(props) => <img {...props} data-testid="image" alt="" />} />
      </Poster.Root>
    );

    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(false);

    naturalWidth.mockRestore();
  });

  it('waits on an override that sources the image some other way', () => {
    const { getByTestId } = render(
      <Poster.Root data-testid="poster">
        <Poster.Image render={(props) => <img {...props} src={undefined} data-testid="image" alt="" />} />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-error')).toBe(false);
  });

  it('waits again when a previous source is requested again', () => {
    const { getByTestId, rerender } = render(<DefaultPoster src="a.jpg" />, {
      wrapper: wrapper({ poster: 'poster.jpg' }),
    });

    fireEvent.load(getByTestId('image'));
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(true);

    // A browser holds the previous request's pixels while the next one fetches.
    Object.defineProperty(getByTestId('image'), 'naturalWidth', { value: 1280, configurable: true });

    rerender(<DefaultPoster src="b.jpg" />);

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(false);

    rerender(<DefaultPoster src="a.jpg" />);

    expect(getByTestId('poster').hasAttribute('data-loading')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(false);
  });

  it('reports an image that failed', () => {
    const { getByTestId } = render(<DefaultPoster />, {
      wrapper: wrapper({ poster: 'missing.jpg' }),
    });

    fireEvent.error(getByTestId('image'));

    expect(getByTestId('poster').hasAttribute('data-error')).toBe(true);
    expect(getByTestId('poster').hasAttribute('data-loaded')).toBe(false);
  });

  it('reports nothing to load when no source resolved', () => {
    const { getByTestId } = render(<DefaultPoster />, { wrapper: wrapper() });

    const root = getByTestId('poster');

    expect(root.hasAttribute('data-loading')).toBe(false);
    expect(root.hasAttribute('data-loaded')).toBe(false);
    expect(root.hasAttribute('data-error')).toBe(false);
  });

  it('hands the resolved src to an image render override', () => {
    const { getByTestId } = render(
      <Poster.Root>
        <Poster.Image render={(props) => <img {...props} data-testid="custom" alt="Keynote speaker" />} />
      </Poster.Root>,
      { wrapper: wrapper({ poster: 'poster.jpg' }) }
    );

    const image = getByTestId('custom');

    expect(image.getAttribute('src')).toBe('poster.jpg');
    expect(image.getAttribute('alt')).toBe('Keynote speaker');
  });

  it('requires the image to be inside a root', () => {
    expect(() => render(<Poster.Image />)).toThrow('Poster compound components must be used within a Poster.Root');
  });

  it('marks a resolved poster as loading in server markup, before the image can report', () => {
    const Loading = wrapper({ poster: 'poster.jpg' });
    const Idle = wrapper();

    expect(
      renderToString(
        <Loading>
          <DefaultPoster />
        </Loading>
      )
    ).toContain('data-loading');
    expect(
      renderToString(
        <Idle>
          <DefaultPoster />
        </Idle>
      )
    ).not.toContain('data-loading');
  });
});
