import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SKIN_HELP_URL } from '@videojs/core';
import { FCastExtension, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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
  it('shows its FCast control when a sender is configured', () => {
    const { Wrapper, extensions } = createPlayerWrapper({
      controlsVisible: true,
      userActive: true,
      requestControlsLock: () => () => {},
    });
    const snapshot: FCastSnapshot = {
      availability: 'available',
      connection: 'disconnected',
      paused: true,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      speed: 1,
    };
    const prompt = vi.fn(async () => {});
    const sender = Object.assign(new EventTarget(), {
      snapshot,
      prompt,
      disconnect: async () => {},
      load: async () => {},
      play: async () => {},
      pause: async () => {},
      seek: async () => {},
      setVolume: async () => {},
      setSpeed: async () => {},
    }) satisfies FCastSender;

    const view = render(<VideoSkin />, { wrapper: Wrapper });

    expect(screen.queryByRole('button', { name: 'Cast with FCast' })).toBeNull();
    expect(extensions.get(FCastExtension)).toBeUndefined();

    view.rerender(<VideoSkin fcastSender={sender} />);
    act(() => extensions.attach({ media: document.createElement('video'), container: null }));

    fireEvent.click(screen.getByRole('button', { name: 'Cast with FCast' }));
    expect(extensions.get(FCastExtension)?.sender).toBe(sender);
    expect(prompt).toHaveBeenCalledOnce();
  });

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

  it('links to the about-this-player page', () => {
    const { container } = render(<VideoSkin />, { wrapper: wrapper() });
    const link = container.querySelector<HTMLAnchorElement>('a[rel="help"]');

    expect(link?.getAttribute('href')).toBe(SKIN_HELP_URL);
    expect(link?.hidden).toBe(true);
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
