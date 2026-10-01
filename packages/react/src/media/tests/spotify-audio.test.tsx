import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { SpotifyAudio } from '../spotify-audio/adapter';

const TRACK_URL = 'https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M';

/**
 * Stands in for a controller from the live iframe API, including the part React has to survive: `createController`
 * builds an iframe of its own and replaces the element it was handed with it.
 */
class MockController {
  static instances: MockController[] = [];
  iframeElement: HTMLIFrameElement;

  addListener = vi.fn();
  destroy = vi.fn(() => {
    this.iframeElement.parentNode?.removeChild(this.iframeElement);
  });

  constructor(target: HTMLIFrameElement) {
    this.iframeElement = document.createElement('iframe');
    this.iframeElement.setAttribute('loading', 'lazy');
    target.parentNode?.replaceChild(this.iframeElement, target);
    MockController.instances.push(this);
  }
}

beforeEach(() => {
  MockController.instances.length = 0;
  vi.stubGlobal('SpotifyIframeApi', {
    createController: (target: HTMLIFrameElement, _options: unknown, callback: (controller: MockController) => void) =>
      callback(new MockController(target)),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Wait for the controller to be built and retargeted to the rendered iframe. */
async function waitForController(): Promise<MockController> {
  await waitFor(() => {
    if (!MockController.instances.length) throw new Error('controller not created yet');
  });
  return MockController.instances[0]!;
}

describe('SpotifyAudio', () => {
  it('hides the embed unless it is showing Spotify’s own chrome', () => {
    const { container, rerender } = render(<SpotifyAudio src={TRACK_URL} />);
    const iframe = container.querySelector('iframe')!;

    // There is no shadow root to hide the embed from behind, so the rule that the
    // custom element carries in its template is inline here.
    expect(iframe.style.display).toBe('none');

    rerender(<SpotifyAudio src={TRACK_URL} controls />);

    expect(iframe.style.display).toBe('');
  });

  it('keeps the controller on the iframe React rendered', async () => {
    const { container } = render(<SpotifyAudio src={TRACK_URL} />);
    const controller = await waitForController();

    const iframe = container.querySelector('iframe')!;

    expect(iframe).toBe(controller.iframeElement);
    expect(iframe.getAttribute('src')).toContain('/embed/track/');
    expect(iframe.style.display).toBe('none');
  });

  it('unmounts without throwing after the controller adopts the React iframe', async () => {
    const { container, unmount } = render(<SpotifyAudio src={TRACK_URL} />);

    await waitForController();

    // Controller cleanup leaves the rendered node for React to remove.
    expect(() => unmount()).not.toThrow();
    expect(container.querySelector('iframe')).toBe(null);
  });
});
