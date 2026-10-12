import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { VideoSkin } from '../skin';

afterEach(cleanup);

/** Only the playback and metadata state the poster reads; the rest renders null. */
function wrapper(overrides: Record<string, unknown> = {}) {
  return createPlayerWrapper({
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    play: async () => {},
    pause: () => {},
    title: '',
    poster: 'poster.jpg',
    ...overrides,
  }).Wrapper;
}

describe('VideoSkin', () => {
  it('renders component-owned backdrops', () => {
    const { container } = render(<VideoSkin />, {
      wrapper: wrapper({
        controlsVisible: true,
        userActive: true,
        requestControlsLock: () => () => {},
        error: { code: 2, message: 'Network error' },
        dismissError: () => {},
      }),
    });

    const controls = container.querySelector('.video-controls');
    const controlsBackdrop = container.querySelector('.video-controls-backdrop');
    const error = container.querySelector('[role="alertdialog"]');
    const errorBackdrop = container.querySelector('.media-dialog-backdrop');

    expect(controlsBackdrop).not.toBeNull();
    expect(controlsBackdrop?.parentElement).toBe(controls?.parentElement);
    expect(controls?.contains(controlsBackdrop)).toBe(false);
    expect(errorBackdrop).not.toBeNull();
    expect(errorBackdrop?.parentElement).toBe(error?.parentElement);
    expect(error?.contains(errorBackdrop)).toBe(false);
    expect(container.querySelector('.video-status-indicators')).not.toBeNull();
  });

  it('draws its own poster image', () => {
    const { container } = render(<VideoSkin />, { wrapper: wrapper() });

    const img = container.querySelector('.media-poster > img.media-poster-image');

    expect(img?.getAttribute('src')).toBe('poster.jpg');
  });

  it('lets renderPoster draw the poster and its placeholder', () => {
    const { container } = render(
      <VideoSkin
        renderPoster={<img data-testid="custom" style={{ backgroundImage: 'url(poster-placeholder.jpg)' }} alt="" />}
      />,
      { wrapper: wrapper() }
    );

    const custom = container.querySelector('[data-testid="custom"]');

    expect(container.querySelectorAll('.media-poster > img')).toHaveLength(1);
    expect(custom?.getAttribute('src')).toBe('poster.jpg');
    expect(custom?.getAttribute('style')).toContain('poster-placeholder.jpg');
  });

  it('lets renderThumbnail draw the slider preview image', () => {
    const { container } = render(
      <VideoSkin renderThumbnail={<img data-testid="custom" fetchPriority="low" loading="lazy" alt="" />} />,
      {
        // The time slider only renders with the time and buffer features present.
        wrapper: wrapper({
          controlsVisible: true,
          userActive: true,
          requestControlsLock: () => () => {},
          currentTime: 0,
          duration: 100,
          seeking: false,
          seek: async () => {},
          buffered: [],
          seekable: [],
        }),
      }
    );

    const custom = container.querySelector('.media-slider-thumbnail > [data-testid="custom"]');

    expect(container.querySelectorAll('.media-slider-thumbnail > img')).toHaveLength(1);
    expect(custom?.getAttribute('fetchpriority')).toBe('low');
    expect(custom?.getAttribute('loading')).toBe('lazy');
    expect(custom?.classList.contains('media-slider-thumbnail-image')).toBe(true);
  });

  it('lets renderPoster draw something that is not an image', () => {
    const { container } = render(<VideoSkin renderPoster={(props) => <div {...props} data-testid="custom" />} />, {
      wrapper: wrapper(),
    });

    expect(container.querySelector('.media-poster > img')).toBeNull();

    const custom = container.querySelector('[data-testid="custom"]');

    expect(custom?.getAttribute('src')).toBe('poster.jpg');
  });
});
