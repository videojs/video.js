import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { FullscreenButton } from '../component';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

function setup() {
  const requestFullscreen = vi.fn();
  const { value, Wrapper } = createPlayerWrapper({
    isFullscreen: false,
    fullscreenAvailability: 'available',
    requestFullscreen,
    exitFullscreen: vi.fn(),
  });
  const container = document.createElement('div');

  container.tabIndex = 0;
  document.body.append(container);
  value.container = container;
  render(<FullscreenButton data-testid="fullscreen" />, { wrapper: Wrapper });

  return { button: screen.getByTestId('fullscreen'), container, requestFullscreen };
}

describe('FullscreenButton', () => {
  it('returns pointer focus to the player container', () => {
    const { button, container, requestFullscreen } = setup();

    button.focus();
    fireEvent.click(button, { detail: 1 });

    expect(document.activeElement).toBe(container);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('preserves button focus for keyboard activation', () => {
    const { button, requestFullscreen } = setup();

    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(document.activeElement).toBe(button);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it('preserves button focus for virtual activation', () => {
    const { button, requestFullscreen } = setup();

    button.focus();
    fireEvent.click(button, { detail: 0 });

    expect(document.activeElement).toBe(button);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });
});
