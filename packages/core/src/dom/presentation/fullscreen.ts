import { type MediaFullscreenCapability, getRegisteredMedia } from '@videojs/media';
import type { WebKitDocument, WebKitFullscreenElement, WebKitVideoElement } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

export function isFullscreenEnabled() {
  const doc = document as WebKitDocument;
  if (doc.fullscreenEnabled || doc.webkitFullscreenEnabled) return true;

  const video = document.createElement('video') as WebKitVideoElement;

  return isFunction(video.webkitSetPresentationMode);
}

export function getFullscreenElement() {
  const doc = document as WebKitDocument;

  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function matchesFullscreen(element: EventTarget | null) {
  if (!(element instanceof Element)) return false;

  try {
    return element.matches(':fullscreen');
  } catch {
    return false;
  }
}

export function isFullscreen(container: HTMLElement | null, media: EventTarget) {
  const webkitVideo = media as WebKitVideoElement;
  if (webkitVideo.webkitPresentationMode === 'fullscreen') return true;

  const fullscreenElement = getFullscreenElement();

  if (fullscreenElement && (fullscreenElement === container || fullscreenElement === getRegisteredMedia(media)))
    return true;

  // `:fullscreen` matches the fullscreen element AND its ancestors (across
  // shadow boundaries), so this covers cases where fullscreen was requested
  // on a descendant — e.g. the inner `<video>` via native controls — rather
  // than the container itself.
  if (matchesFullscreen(container) || matchesFullscreen(media)) {
    return true;
  }

  // isFullscreen is a non-standard property that is set by the video host
  // and checks internally if the video host target is the fullscreen element.
  const video = media as unknown as MediaFullscreenCapability;

  return video.isFullscreen ?? false;
}

export async function requestFullscreen(container: HTMLElement | null, media: EventTarget) {
  const doc = document as WebKitDocument;

  if (container && (doc.fullscreenEnabled || doc.webkitFullscreenEnabled)) {
    const el = container as WebKitFullscreenElement;
    if (isFunction(el.requestFullscreen)) return el.requestFullscreen();

    if (isFunction(el.webkitRequestFullscreen)) {
      return el.webkitRequestFullscreen();
    }
  }

  const webkitVideo = media as WebKitVideoElement;

  if (isFunction(webkitVideo.webkitSetPresentationMode)) {
    webkitVideo.webkitSetPresentationMode('fullscreen');
    return;
  }

  const video = media as unknown as MediaFullscreenCapability;
  if (isFunction(video.requestFullscreen)) return video.requestFullscreen() as Promise<void>;
}

export async function exitFullscreen(media: EventTarget) {
  const doc = document as WebKitDocument;

  const webkitVideo = media as WebKitVideoElement;

  if (webkitVideo.webkitPresentationMode === 'fullscreen' && isFunction(webkitVideo.webkitSetPresentationMode)) {
    webkitVideo.webkitSetPresentationMode('inline');
    return;
  }

  if (isFunction(doc.exitFullscreen)) {
    return doc.exitFullscreen();
  }

  if (isFunction(doc.webkitExitFullscreen)) {
    return doc.webkitExitFullscreen();
  }

  const video = media as unknown as MediaFullscreenCapability;
  if (isFunction(video.exitFullscreen)) return video.exitFullscreen() as Promise<void>;
}
