import type { MediaPictureInPictureCapability } from '@videojs/media';
import { isMediaPictureInPictureCapable, getRegisteredMedia } from '@videojs/media';
import type { WebKitVideoElement } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

export function isPictureInPictureEnabled() {
  if (document.pictureInPictureEnabled) {
    const isSafari = /.*Version\/.*Safari\/.*/.test(navigator.userAgent);
    const isPWA = typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;

    return !isSafari || !isPWA;
  }

  const video = document.createElement('video') as WebKitVideoElement;

  return isFunction(video.webkitSetPresentationMode);
}

/**
 * Whether this media can enter picture-in-picture at all, which is a separate question from whether the browser
 * supports it. Mirrors the branches `requestPictureInPicture` takes below, so anything it would refuse to act on
 * reports as incapable here — an iframe embed whose provider has no picture-in-picture can never enter it, however
 * capable the browser is.
 */
export function isPictureInPictureCapable(media: EventTarget) {
  const webkitVideo = media as WebKitVideoElement;
  if (isFunction(webkitVideo.webkitSetPresentationMode)) return true;

  return isMediaPictureInPictureCapable(media);
}

export function isPictureInPicture(media: EventTarget) {
  const webkitVideo = media as WebKitVideoElement;
  if (webkitVideo.webkitPresentationMode === 'picture-in-picture') return true;

  if (document.pictureInPictureElement === getRegisteredMedia(media)) {
    return true;
  }

  // isPictureInPicture is a non-standard property that is set by the video host
  // and checks internally if the video host target is the picture-in-picture element.
  const video = media as unknown as MediaPictureInPictureCapability;

  return video.isPictureInPicture ?? false;
}

export async function requestPictureInPicture(media: EventTarget) {
  const webkitVideo = media as WebKitVideoElement;

  if (isFunction(webkitVideo.webkitSetPresentationMode)) {
    webkitVideo.webkitSetPresentationMode('picture-in-picture');
    return;
  }

  const video = media as unknown as MediaPictureInPictureCapability;
  if (isFunction(video.requestPictureInPicture)) return video.requestPictureInPicture() as Promise<void>;
}

export async function exitPictureInPicture(media: EventTarget) {
  const webkitVideo = media as WebKitVideoElement;

  if (
    webkitVideo.webkitPresentationMode === 'picture-in-picture' &&
    isFunction(webkitVideo.webkitSetPresentationMode)
  ) {
    webkitVideo.webkitSetPresentationMode('inline');
    return;
  }

  if (isFunction(document.exitPictureInPicture)) {
    return document.exitPictureInPicture();
  }

  const video = media as unknown as MediaPictureInPictureCapability;
  if (isFunction(video.exitPictureInPicture)) return video.exitPictureInPicture() as Promise<void>;
}
