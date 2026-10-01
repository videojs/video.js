import { isFunction } from '@videojs/utils/predicate';

import { RenditionEvent } from './rendition-event';
import { getPrivate } from './utils';
import type { VideoRendition } from './video-rendition';
import type { VideoTrack } from './video-track';

export function addRendition(track: VideoTrack, rendition: VideoRendition) {
  const renditionList = getPrivate(track).media?.deref()?.videoRenditions as VideoRenditionList | undefined;

  getPrivate(rendition).media = getPrivate(track).media;
  getPrivate(rendition).track = track;

  const renditionSet = getPrivate(track).renditionSet as Set<VideoRendition>;

  renditionSet.add(rendition);
  const index = renditionSet.size - 1;

  if (!(index in VideoRenditionList.prototype)) {
    Object.defineProperty(VideoRenditionList.prototype, index, {
      get() {
        return getCurrentRenditions(this)[index];
      },
    });
  }

  queueMicrotask(() => {
    if (!renditionList || !track.selected) return;

    renditionList.dispatchEvent(new RenditionEvent('addrendition', { rendition }));
  });
}

export function removeRendition(rendition: VideoRendition) {
  const renditionList = getPrivate(rendition).media?.deref()?.videoRenditions as VideoRenditionList | undefined;
  const track = getPrivate(rendition).track as VideoTrack;
  const renditionSet = getPrivate(track).renditionSet as Set<VideoRendition>;

  renditionSet.delete(rendition);

  queueMicrotask(() => {
    if (!renditionList || !track.selected) return;

    renditionList.dispatchEvent(new RenditionEvent('removerendition', { rendition }));
  });
}

export function selectedChanged(rendition: VideoRendition) {
  const renditionList = getPrivate(rendition).media?.deref()?.videoRenditions as VideoRenditionList | undefined;
  // Prevent firing a rendition list `change` event multiple times per tick.
  if (!renditionList || getPrivate(renditionList).changeRequested) return;

  getPrivate(renditionList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(renditionList).changeRequested;

    const track = getPrivate(rendition).track as VideoTrack;
    if (!track.selected) return;

    renditionList.dispatchEvent(new Event('change'));
  });
}

export function activeChanged(rendition: VideoRendition) {
  const renditionList = getPrivate(rendition).media?.deref()?.videoRenditions as VideoRenditionList | undefined;
  if (!renditionList || getPrivate(renditionList).activeChangeRequested) return;

  getPrivate(renditionList).activeChangeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(renditionList).activeChangeRequested;

    const track = getPrivate(rendition).track as VideoTrack;
    if (!track.selected) return;

    renditionList.dispatchEvent(new Event('activechange'));
  });
}

function getCurrentRenditions(renditionList: VideoRenditionList): VideoRendition[] {
  const media = getPrivate(renditionList).media?.deref() as HTMLMediaElement | undefined;
  if (!media) return [];

  return [...media.videoTracks]
    .filter((track) => track.selected)
    .flatMap((track) => [...(getPrivate(track).renditionSet as Set<VideoRendition>)]);
}

/** @internal */
export class VideoRenditionList extends EventTarget {
  [index: number]: VideoRendition;
  #addRenditionCallback: (() => void) | undefined;
  #removeRenditionCallback: (() => void) | undefined;
  #changeCallback: (() => void) | undefined;

  [Symbol.iterator]() {
    return getCurrentRenditions(this).values();
  }

  get length() {
    return getCurrentRenditions(this).length;
  }

  getRenditionById(id: string): VideoRendition | null {
    return getCurrentRenditions(this).find((rendition) => `${rendition.id}` === `${id}`) ?? null;
  }

  get selectedIndex() {
    return getCurrentRenditions(this).findIndex((rendition) => rendition.selected);
  }

  set selectedIndex(index) {
    for (const [i, rendition] of getCurrentRenditions(this).entries()) {
      rendition.selected = i === index;
    }
  }

  get onaddrendition() {
    return this.#addRenditionCallback;
  }

  set onaddrendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined) {
    if (this.#addRenditionCallback) {
      this.removeEventListener('addrendition', this.#addRenditionCallback);
      this.#addRenditionCallback = undefined;
    }

    if (isFunction(callback)) {
      this.#addRenditionCallback = callback;
      this.addEventListener('addrendition', callback as unknown as EventListener);
    }
  }

  get onremoverendition() {
    return this.#removeRenditionCallback;
  }

  set onremoverendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined) {
    if (this.#removeRenditionCallback) {
      this.removeEventListener('removerendition', this.#removeRenditionCallback);
      this.#removeRenditionCallback = undefined;
    }

    if (isFunction(callback)) {
      this.#removeRenditionCallback = callback;
      this.addEventListener('removerendition', callback as unknown as EventListener);
    }
  }

  get onchange() {
    return this.#changeCallback;
  }

  set onchange(callback) {
    if (this.#changeCallback) {
      this.removeEventListener('change', this.#changeCallback);
      this.#changeCallback = undefined;
    }

    if (isFunction(callback)) {
      this.#changeCallback = callback;
      this.addEventListener('change', callback);
    }
  }
}
