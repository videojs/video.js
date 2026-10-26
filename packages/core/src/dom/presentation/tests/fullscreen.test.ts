import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerExtensionCoordinator } from '../../extensions/coordinator';
import { isFullscreen, requestFullscreen } from '../fullscreen';

/** The media as the store sees it while a playback owner such as Google Cast is registered. */
function toStoreMedia(video: HTMLVideoElement) {
  const extensions = new PlayerExtensionCoordinator(() => {});

  extensions.register({ mediaOverride: null });

  return extensions.getStoreMedia(video);
}

describe('isFullscreen', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'fullscreenElement');
    Reflect.deleteProperty(document, 'webkitFullscreenElement');
  });

  it('recognizes the media behind a player facade as the fullscreen element', () => {
    const video = document.createElement('video');
    const media = toStoreMedia(video);

    expect(isFullscreen(null, media)).toBe(false);

    Object.defineProperty(document, 'fullscreenElement', { value: video, configurable: true });

    expect(isFullscreen(null, media)).toBe(true);
  });

  it('honors the WebKit fullscreen element', () => {
    const video = document.createElement('video');

    Object.defineProperty(document, 'webkitFullscreenElement', { value: video, configurable: true });

    expect(isFullscreen(null, toStoreMedia(video))).toBe(true);
  });
});

describe('requestFullscreen', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'fullscreenEnabled');
  });

  it('hides open popovers inside the container before requesting fullscreen', async () => {
    const container = document.createElement('div');
    const shadowRoot = container.attachShadow({ mode: 'open' });
    const popup = document.createElement('div');
    const calls: string[] = [];

    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    Object.defineProperty(popup, 'hidePopover', { value: () => calls.push('hidePopover') });
    Object.defineProperty(container, 'requestFullscreen', { value: async () => calls.push('requestFullscreen') });
    vi.spyOn(popup, 'matches').mockImplementation((selector) => selector === ':popover-open');
    shadowRoot.append(popup);

    await requestFullscreen(container, document.createElement('video'));

    expect(calls).toEqual(['hidePopover', 'requestFullscreen']);
  });
});
