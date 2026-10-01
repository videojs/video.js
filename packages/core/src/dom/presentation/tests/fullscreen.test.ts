import { afterEach, describe, expect, it } from 'vite-plus/test';

import { PlayerExtensionCoordinator } from '../../extensions/coordinator';
import { isFullscreen } from '../fullscreen';

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
