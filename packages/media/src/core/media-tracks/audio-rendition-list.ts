import { isFunction } from '@videojs/utils/predicate';

import type { AudioRendition } from './audio-rendition';
import type { AudioTrack } from './audio-track';
import { RenditionEvent } from './rendition-event';
import { getPrivate } from './utils';

export function addRendition(track: AudioTrack, rendition: AudioRendition) {
  const renditionList = getPrivate(track).media?.deref()?.audioRenditions as AudioRenditionList | undefined;

  getPrivate(rendition).media = getPrivate(track).media;
  getPrivate(rendition).track = track;

  const renditionSet = getPrivate(track).renditionSet as Set<AudioRendition>;

  renditionSet.add(rendition);
  const index = renditionSet.size - 1;

  if (!(index in AudioRenditionList.prototype)) {
    Object.defineProperty(AudioRenditionList.prototype, index, {
      get() {
        return getCurrentRenditions(this)[index];
      },
    });
  }

  queueMicrotask(() => {
    if (!renditionList || !track.enabled) return;

    renditionList.dispatchEvent(new RenditionEvent('addrendition', { rendition }));
  });
}

export function removeRendition(rendition: AudioRendition) {
  const renditionList = getPrivate(rendition).media?.deref()?.audioRenditions as AudioRenditionList | undefined;
  const track = getPrivate(rendition).track as AudioTrack;
  const renditionSet = getPrivate(track).renditionSet as Set<AudioRendition>;

  renditionSet.delete(rendition);

  queueMicrotask(() => {
    if (!renditionList || !track.enabled) return;

    renditionList.dispatchEvent(new RenditionEvent('removerendition', { rendition }));
  });
}

export function selectedChanged(rendition: AudioRendition) {
  const renditionList = getPrivate(rendition).media?.deref()?.audioRenditions as AudioRenditionList | undefined;
  // Prevent firing a rendition list `change` event multiple times per tick.
  if (!renditionList || getPrivate(renditionList).changeRequested) return;

  getPrivate(renditionList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(renditionList).changeRequested;

    const track = getPrivate(rendition).track as AudioTrack;
    if (!track.enabled) return;

    renditionList.dispatchEvent(new Event('change'));
  });
}

function getCurrentRenditions(renditionList: AudioRenditionList): AudioRendition[] {
  const media = getPrivate(renditionList).media?.deref() as HTMLMediaElement | undefined;
  if (!media) return [];

  return [...media.audioTracks]
    .filter((track) => track.enabled)
    .flatMap((track) => [...(getPrivate(track).renditionSet as Set<AudioRendition>)]);
}

/** @internal */
export class AudioRenditionList extends EventTarget {
  [index: number]: AudioRendition;
  #addRenditionCallback: (() => void) | undefined;
  #removeRenditionCallback: (() => void) | undefined;
  #changeCallback: (() => void) | undefined;

  [Symbol.iterator]() {
    return getCurrentRenditions(this).values();
  }

  get length() {
    return getCurrentRenditions(this).length;
  }

  getRenditionById(id: string): AudioRendition | null {
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

  set onaddrendition(callback: ((event?: { rendition: AudioRendition }) => void) | undefined) {
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

  set onremoverendition(callback: ((event?: { rendition: AudioRendition }) => void) | undefined) {
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
