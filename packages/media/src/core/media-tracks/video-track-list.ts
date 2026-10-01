import { isFunction } from '@videojs/utils/predicate';

import { TrackEvent } from './change-event';
import { getPrivate } from './utils';
import type { VideoTrack } from './video-track';

export function addVideoTrack(media: HTMLMediaElement, track: VideoTrack) {
  const trackList = media.videoTracks;

  getPrivate(track).media = new WeakRef(media);

  if (!getPrivate(track).renditionSet) {
    getPrivate(track).renditionSet = new Set();
  }

  const trackSet = getPrivate(trackList).trackSet as Set<VideoTrack>;

  trackSet.add(track);

  const index = trackSet.size - 1;

  if (!(index in VideoTrackList.prototype)) {
    Object.defineProperty(VideoTrackList.prototype, index, {
      get() {
        return [...(getPrivate(this).trackSet as Set<VideoTrack>)][index];
      },
    });
  }

  // The event is queued to align with native `addtrack` behavior.
  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('addtrack', { track }));
  });
}

export function removeVideoTrack(track: VideoTrack) {
  const trackList = getPrivate(track).media?.deref()?.videoTracks as VideoTrackList | undefined;
  if (!trackList) return;

  const trackSet = getPrivate(trackList).trackSet as Set<VideoTrack>;
  if (!trackSet.delete(track)) return;

  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('removetrack', { track }));
  });
}

export function selectedChanged(selected: VideoTrack) {
  const trackList = (getPrivate(selected).media?.deref()?.videoTracks ?? []) as VideoTrackList | VideoTrack[];
  let hasUnselected = false;

  for (const track of trackList) {
    if (track === selected) continue;

    track.selected = false;
    hasUnselected = true;
  }

  if (!hasUnselected) return;

  // Prevent firing a track list `change` event multiple times per tick.
  if (getPrivate(trackList).changeRequested) return;

  getPrivate(trackList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(trackList).changeRequested;
    (trackList as VideoTrackList).dispatchEvent(new Event('change'));
  });
}

/** @internal */
export class VideoTrackList extends EventTarget {
  [index: number]: VideoTrack;
  #addTrackCallback: (() => void) | undefined;
  #removeTrackCallback: (() => void) | undefined;
  #changeCallback: (() => void) | undefined;

  constructor() {
    super();
    getPrivate(this).trackSet = new Set();
  }

  get #tracks() {
    return getPrivate(this).trackSet as Set<VideoTrack>;
  }

  [Symbol.iterator]() {
    return this.#tracks.values();
  }

  get length() {
    return this.#tracks.size;
  }

  getTrackById(id: string): VideoTrack | null {
    return [...this.#tracks].find((track) => track.id === id) ?? null;
  }

  get selectedIndex() {
    return [...this.#tracks].findIndex((track) => track.selected);
  }

  get onaddtrack() {
    return this.#addTrackCallback;
  }

  set onaddtrack(callback: ((event?: { track: VideoTrack }) => void) | undefined) {
    if (this.#addTrackCallback) {
      this.removeEventListener('addtrack', this.#addTrackCallback);
      this.#addTrackCallback = undefined;
    }

    if (isFunction(callback)) {
      this.#addTrackCallback = callback;
      this.addEventListener('addtrack', callback as unknown as EventListener);
    }
  }

  get onremovetrack() {
    return this.#removeTrackCallback;
  }

  set onremovetrack(callback: ((event?: { track: VideoTrack }) => void) | undefined) {
    if (this.#removeTrackCallback) {
      this.removeEventListener('removetrack', this.#removeTrackCallback);
      this.#removeTrackCallback = undefined;
    }

    if (isFunction(callback)) {
      this.#removeTrackCallback = callback;
      this.addEventListener('removetrack', callback as unknown as EventListener);
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
