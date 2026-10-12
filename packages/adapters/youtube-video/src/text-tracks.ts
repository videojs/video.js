import type { TextTrackLike, TextTrackListLike } from '@videojs/media';

type TextTrackMode = TextTrackLike['mode'];

class TextTrackEvent extends Event {
  readonly track: TextTrackLike;

  constructor(type: 'addtrack' | 'removetrack', track: TextTrackLike) {
    super(type);
    this.track = track;
  }
}

/** A caption track the embed reports. YouTube renders its cues inside the iframe, so none are exposed here. */
export class YouTubeTextTrack implements TextTrackLike {
  readonly id = '';
  readonly kind = 'subtitles';
  readonly cues = null;
  readonly label: string;
  readonly language: string;

  #mode: TextTrackMode = 'disabled';
  #onModeChange: () => void;

  constructor(label: string, language: string, onModeChange: () => void) {
    this.label = label;
    this.language = language;
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
 * The text tracks of a YouTube embed. Unlike a `<video>` element's list, tracks can be removed, so each source starts
 * empty. Events are queued like native ones, and mode changes within a tick report as one `change`.
 */
export class YouTubeTextTrackList extends EventTarget implements TextTrackListLike {
  readonly [index: number]: YouTubeTextTrack;

  #tracks: YouTubeTextTrack[] = [];
  #changeQueued = false;

  get length(): number {
    return this.#tracks.length;
  }

  [Symbol.iterator](): Iterator<YouTubeTextTrack> {
    return this.#tracks[Symbol.iterator]();
  }

  getTrackByLanguage(language: string): YouTubeTextTrack | undefined {
    return this.#tracks.find((track) => track.language === language);
  }

  add(label: string, language: string): YouTubeTextTrack {
    const track = new YouTubeTextTrack(label, language, () => this.#queueChange());

    Object.defineProperty(this, this.#tracks.length, { value: track, configurable: true, enumerable: true });
    this.#tracks.push(track);
    queueMicrotask(() => this.dispatchEvent(new TextTrackEvent('addtrack', track)));

    return track;
  }

  clear(): void {
    const removed = this.#tracks;

    this.#tracks = [];

    for (const [index, track] of removed.entries()) {
      delete (this as Record<number, YouTubeTextTrack>)[index];
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
