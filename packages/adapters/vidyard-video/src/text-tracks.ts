import type { TextTrackLike, TextTrackListLike } from '@videojs/media';

type TextTrackMode = TextTrackLike['mode'];

class TextTrackEvent extends Event {
  readonly track: TextTrackLike;

  constructor(type: 'addtrack' | 'removetrack', track: TextTrackLike) {
    super(type);
    this.track = track;
  }
}

/** A caption track of the current video. Vidyard renders its cues inside the iframe, so none are exposed here. */
export class VidyardTextTrack implements TextTrackLike {
  readonly id = '';
  readonly kind = 'captions';
  readonly cues = null;
  readonly label: string;
  readonly language: string;

  #mode: TextTrackMode;
  #onModeChange: () => void;

  constructor(label: string, language: string, mode: TextTrackMode, onModeChange: () => void) {
    this.label = label;
    this.language = language;
    this.#mode = mode;
    this.#onModeChange = onModeChange;
  }

  get mode(): TextTrackMode {
    return this.#mode;
  }
  set mode(value: TextTrackMode) {
    if (this.#mode === value) return;

    this.#mode = value;
    this.#onModeChange();
  }
}

/**
 * The caption tracks of the current video. Unlike a `<video>` element's list, tracks are removed when the video
 * changes. Events are queued like native ones, and mode changes within a tick report as one `change`.
 */
export class VidyardTextTrackList extends EventTarget implements TextTrackListLike {
  readonly [index: number]: VidyardTextTrack;

  #tracks: VidyardTextTrack[] = [];
  #changeQueued = false;

  get length(): number {
    return this.#tracks.length;
  }

  [Symbol.iterator](): Iterator<VidyardTextTrack> {
    return this.#tracks[Symbol.iterator]();
  }

  add(label: string, language: string, mode: TextTrackMode): VidyardTextTrack {
    const track = new VidyardTextTrack(label, language, mode, () => this.#queueChange());

    Object.defineProperty(this, this.#tracks.length, { value: track, configurable: true, enumerable: true });
    this.#tracks.push(track);
    queueMicrotask(() => this.dispatchEvent(new TextTrackEvent('addtrack', track)));

    return track;
  }

  clear(): void {
    const removed = this.#tracks;

    this.#tracks = [];

    for (const [index, track] of removed.entries()) {
      // SAFETY: `add()` defines each index as an own configurable property.
      delete (this as Record<number, VidyardTextTrack>)[index];
      queueMicrotask(() => this.dispatchEvent(new TextTrackEvent('removetrack', track)));
    }
  }

  #queueChange(): void {
    if (this.#changeQueued) return;

    this.#changeQueued = true;
    queueMicrotask(() => {
      this.#changeQueued = false;
      this.dispatchEvent(new Event('change'));
    });
  }
}
