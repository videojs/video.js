import { cleanup, render } from '@testing-library/react';
import type { MediaThumbnailsTrack } from '@videojs/media';
import { createRef, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Thumbnail } from '..';
import { createPlayerWrapper } from '../../../testing/mocks';

afterEach(cleanup);

function wrapper(crossOrigin: MediaThumbnailsTrack['crossOrigin'] = null) {
  return createPlayerWrapper({
    chaptersCues: [],
    thumbnailsTrack: { cues: [], src: null, crossOrigin },
    textTrackList: [],
    subtitlesShowing: false,
    toggleSubtitles: vi.fn(),
    selectSubtitlesTrack: vi.fn(),
  }).Wrapper;
}

function DefaultThumbnail({
  rootProps = {},
  imageProps = {},
  children,
}: {
  rootProps?: Thumbnail.RootProps | undefined;
  imageProps?: Thumbnail.ImageProps | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <Thumbnail.Root data-testid="thumbnail" {...rootProps}>
      <Thumbnail.Image data-testid="image" {...imageProps} />
      {children}
    </Thumbnail.Root>
  );
}

/** Render a thumbnail and return the `crossorigin` attribute on its image. */
function renderCrossOrigin(
  crossOrigin: MediaThumbnailsTrack['crossOrigin'],
  imageProps: Thumbnail.ImageProps = {},
  rootProps: Thumbnail.RootProps = {}
): string | null {
  const { container } = render(<DefaultThumbnail rootProps={rootProps} imageProps={imageProps} />, {
    wrapper: wrapper(crossOrigin),
  });

  return container.querySelector('[data-testid="image"]')!.getAttribute('crossorigin');
}

describe('Thumbnail', () => {
  it('renders a root around the selected image', () => {
    const { getByTestId } = render(
      <DefaultThumbnail rootProps={{ thumbnails: [{ url: 'thumbnail.jpg', startTime: 0 }], time: 12 }} />,
      { wrapper: wrapper() }
    );

    expect(getByTestId('thumbnail').tagName).toBe('DIV');
    expect(getByTestId('thumbnail').getAttribute('role')).toBe('img');
    expect(getByTestId('thumbnail').getAttribute('aria-hidden')).toBe('true');
    expect(getByTestId('image').tagName).toBe('IMG');
    expect(getByTestId('image').getAttribute('src')).toBe('thumbnail.jpg');
    expect(getByTestId('image').getAttribute('decoding')).toBe('async');
    expect(getByTestId('image').getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps image props on Thumbnail.Image', () => {
    const { getByTestId } = render(<DefaultThumbnail imageProps={{ crossOrigin: 'anonymous', loading: 'eager' }} />);

    expect(getByTestId('image').getAttribute('crossorigin')).toBe('anonymous');
    expect(getByTestId('image').getAttribute('loading')).toBe('eager');
  });

  it('reports state on the root', () => {
    const { getByTestId } = render(<DefaultThumbnail />, { wrapper: wrapper() });

    expect(getByTestId('thumbnail').hasAttribute('data-hidden')).toBe(true);
    expect(getByTestId('image').hasAttribute('data-hidden')).toBe(false);
  });

  it('accepts sibling presentation layers', () => {
    const { getByTestId } = render(
      <DefaultThumbnail>
        <div data-testid="overlay" />
      </DefaultThumbnail>,
      { wrapper: wrapper() }
    );

    expect(getByTestId('thumbnail').contains(getByTestId('overlay'))).toBe(true);
  });

  it('forwards root and image refs', () => {
    const rootRef = createRef<HTMLDivElement>();
    const imgRef = createRef<HTMLImageElement>();

    render(
      <Thumbnail.Root ref={rootRef}>
        <Thumbnail.Image ref={imgRef} />
      </Thumbnail.Root>,
      { wrapper: wrapper() }
    );

    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(imgRef.current).toBeInstanceOf(HTMLImageElement);
  });

  it('supports an image render override without replacing the root', () => {
    const { getByTestId } = render(
      <Thumbnail.Root data-testid="thumbnail" thumbnails={[{ url: 'thumbnail.jpg', startTime: 0 }]}>
        <Thumbnail.Image render={(props) => <img {...props} data-testid="custom-image" />} />
      </Thumbnail.Root>,
      { wrapper: wrapper() }
    );

    expect(getByTestId('thumbnail').tagName).toBe('DIV');
    expect(getByTestId('custom-image').getAttribute('src')).toBe('thumbnail.jpg');
  });

  it('requires the image to be inside a root', () => {
    expect(() => render(<Thumbnail.Image />)).toThrow(
      'Thumbnail compound components must be used within a Thumbnail.Root'
    );
  });

  it('settles a cached image once, even when a render override swaps refs every render', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const naturalWidth = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
    const naturalHeight = vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(720);
    const thumbnails = [{ url: 'thumbnail.jpg', startTime: 0 }];

    // An inline ref on the rendered element composes into a new callback each
    // render, so React detaches and reattaches the same image every time.
    const { getByTestId, rerender } = render(
      <Thumbnail.Root data-testid="thumbnail" thumbnails={thumbnails}>
        <Thumbnail.Image render={<img ref={(node) => void node} data-testid="image" />} />
      </Thumbnail.Root>,
      { wrapper: wrapper() }
    );

    rerender(
      <Thumbnail.Root data-testid="thumbnail" thumbnails={thumbnails} time={1}>
        <Thumbnail.Image render={<img ref={(node) => void node} data-testid="image" />} />
      </Thumbnail.Root>
    );

    expect(getByTestId('thumbnail').hasAttribute('data-loading')).toBe(false);
    expect(getByTestId('image').getAttribute('src')).toBe('thumbnail.jpg');

    complete.mockRestore();
    naturalWidth.mockRestore();
    naturalHeight.mockRestore();
  });

  describe('crossOrigin', () => {
    it('inherits the media element CORS mode when unset', () => {
      expect(renderCrossOrigin('anonymous')).toBe('anonymous');
      expect(renderCrossOrigin('use-credentials')).toBe('use-credentials');
    });

    it('sets nothing when the media element is not in CORS mode', () => {
      expect(renderCrossOrigin(null)).toBeNull();
    });

    it('prefers an explicit value over the inherited one', () => {
      expect(renderCrossOrigin('use-credentials', { crossOrigin: 'anonymous' })).toBe('anonymous');
    });

    it('opts out of inheritance for an explicit null', () => {
      expect(renderCrossOrigin('anonymous', { crossOrigin: null })).toBeNull();
    });

    it('passes an empty crossOrigin through rather than opting out', () => {
      expect(renderCrossOrigin('use-credentials', { crossOrigin: '' })).toBe('');
    });

    it('does not inherit for thumbnails supplied directly', () => {
      const attribute = renderCrossOrigin(
        'anonymous',
        {},
        { thumbnails: [{ url: 'https://images.example.com/sprite.jpg', startTime: 0 }] }
      );

      expect(attribute).toBeNull();
    });
  });
});
