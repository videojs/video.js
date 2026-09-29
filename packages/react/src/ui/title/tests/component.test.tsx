import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { Title } from '../index';

afterEach(() => {
  cleanup();
});

function metadataState(title: string): Record<string, unknown> {
  return { title, poster: '' };
}

function controlsState(controlsVisible: boolean): Record<string, unknown> {
  return {
    userActive: true,
    controlsVisible,
    requestControlsLock: vi.fn(() => vi.fn()),
    toggleControls: vi.fn(() => true),
  };
}

function playbackState(paused: boolean): Record<string, unknown> {
  return {
    paused,
    ended: false,
    started: false,
    waiting: false,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
  };
}

describe('Title', () => {
  it('renders the resolved content title as text', () => {
    const { Wrapper } = createPlayerWrapper({
      ...metadataState('Sintel'),
      ...controlsState(true),
      ...playbackState(true),
    });
    const { getByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').textContent).toBe('Sintel');
  });

  it.each([true, false])('reflects controls visibility (%s) without hiding the title', (visible) => {
    const { Wrapper } = createPlayerWrapper({ ...metadataState('Sintel'), ...controlsState(visible) });
    const { getByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').hasAttribute('data-visible')).toBe(visible);
    expect(getByTestId('title').textContent).toBe('Sintel');
  });

  it('renders nothing without the metadata feature', () => {
    const { Wrapper } = createPlayerWrapper({ ...controlsState(true), ...playbackState(true) });
    const { queryByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(queryByTestId('title')).toBeNull();
  });

  it('renders nothing when no source supplies a title', () => {
    const { Wrapper } = createPlayerWrapper({
      ...metadataState(''),
      ...controlsState(true),
      ...playbackState(true),
    });
    const { queryByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(queryByTestId('title')).toBeNull();
  });

  it('ignores controls and playback state', () => {
    const { Wrapper } = createPlayerWrapper({
      ...metadataState('Sintel'),
      ...controlsState(false),
      ...playbackState(false),
    });
    const { getByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').textContent).toBe('Sintel');
  });

  it('renders the title without the playback feature', () => {
    const { Wrapper } = createPlayerWrapper({ ...metadataState('Sintel'), ...controlsState(true) });
    const { getByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').textContent).toBe('Sintel');
  });

  it('renders the title without the controls feature', () => {
    const { Wrapper } = createPlayerWrapper({ ...metadataState('Sintel'), ...playbackState(true) });
    const { getByTestId } = render(<Title data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').textContent).toBe('Sintel');
  });

  it('supports className as a function of state', () => {
    const { Wrapper } = createPlayerWrapper({
      ...metadataState('Sintel'),
      ...controlsState(true),
      ...playbackState(true),
    });
    const { getByTestId } = render(
      <Title className={(state) => `title--${state.title.length}`} data-testid="title" />,
      {
        wrapper: Wrapper,
      }
    );

    expect(getByTestId('title').className).toBe('title--6');
  });

  it('renders one element and supports element replacement', () => {
    const { Wrapper } = createPlayerWrapper(metadataState('Sintel'));
    const { getByTestId } = render(<Title render={<h2 />} data-testid="title" />, { wrapper: Wrapper });

    expect(getByTestId('title').tagName).toBe('H2');
    expect(getByTestId('title').textContent).toBe('Sintel');
    expect(getByTestId('title').childElementCount).toBe(0);
  });
});
