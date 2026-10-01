import { isFunction } from '@videojs/utils/predicate';

import type { AudioTrack } from './audio-track';
import { TrackEvent } from './change-event';
import { getPrivate } from './utils';

export function addAudioTrack(media: HTMLMediaElement, track: AudioTrack) {
  const trackList = media.audioTracks;

  getPrivate(track).media = new WeakRef(media);

  if (!getPrivate(track).renditionSet) {
    getPrivate(track).renditionSet = new Set();
  }

  const trackSet = getPrivate(trackList).trackSet as Set<AudioTrack>;

  trackSet.add(track);

  const index = trackSet.size - 1;

  if (!(index in AudioTrackList.prototype)) {
    Object.defineProperty(AudioTrackList.prototype, index, {
      get() {
        return [...(getPrivate(this).trackSet as Set<AudioTrack>)][index];
      },
    });
  }

  // The event is queued to align with native `addtrack` behavior.
  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('addtrack', { track }));
  });
}

export function removeAudioTrack(track: AudioTrack) {
  const trackList = getPrivate(track).media?.deref()?.audioTracks as AudioTrackList | undefined;
  if (!trackList) return;

  const trackSet = getPrivate(trackList).trackSet as Set<AudioTrack>;
  if (!trackSet.delete(track)) return;

  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('removetrack', { track }));
  });
}

export function enabledChanged(track: AudioTrack) {
  const trackList = getPrivate(track).media?.deref()?.audioTracks as AudioTrackList | undefined;
  // Prevent firing a track list `change` event multiple times per tick.
  if (!trackList || getPrivate(trackList).changeRequested) return;

  getPrivate(trackList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(trackList).changeRequested;
    trackList.dispatchEvent(new Event('change'));
  });
}

/** @internal */
export class AudioTrackList extends EventTarget {
  [index: number]: AudioTrack;
  #addTrackCallback: (() => void) | undefined;
  #removeTrackCallback: (() => void) | undefined;
  #changeCallback: (() => void) | undefined;

  constructor() {
    super();
    getPrivate(this).trackSet = new Set();
  }

  get #tracks() {
    return getPrivate(this).trackSet as Set<AudioTrack>;
  }

  [Symbol.iterator]() {
    return this.#tracks.values();
  }

  get length() {
    return this.#tracks.size;
  }

  getTrackById(id: string): AudioTrack | null {
    return [...this.#tracks].find((track) => track.id === id) ?? null;
  }

  get onaddtrack() {
    return this.#addTrackCallback;
  }

  set onaddtrack(callback: ((event?: { track: AudioTrack }) => void) | undefined) {
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

  set onremovetrack(callback: ((event?: { track: AudioTrack }) => void) | undefined) {
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
