import type { CanPlayTypeResult, MediaPreloadType } from '@videojs/media';
import { MediaReadyState } from '@videojs/media';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import { clamp } from '@videojs/utils/number';
import { isAbortError } from '@videojs/utils/predicate';

import { Highway } from './highway';
import type { Note, Part, Song } from './song';

/**
 * A media that plays a chart instead of a video: Web Audio plays the song's stems while a canvas scrolls the notes of
 * one part. It speaks enough of the media contract for the player store to drive it like a `<video>`, so the stock
 * controls work on it: the quality menu picks the part, and the audio track menu picks the "Hit" or "Missed" mix.
 */
export class ChartMedia extends MediaTracksMixin(EventTarget) {
  loop = false;
  preload: MediaPreloadType = 'auto';
  crossOrigin: string | null = null;
  defaultMuted = false;

  #src = '';
  #currentSrc = '';
  #load: AbortController | null = null;
  #readyState: number = MediaReadyState.HAVE_NOTHING;
  #duration = Number.NaN;
  #paused = true;
  #ended = false;
  #seeking = false;
  #volume = 1;
  #muted = false;

  #song: Song | null = null;
  #part: Part | null = null;
  #wantedPart: Part | null = null;
  #notes: readonly Note[] = [];
  #notesByPart = new Map<string, Promise<Note[]>>();

  #audio = new AudioContext();
  #master = this.#audio.createGain();
  #stems = new Map<string, { buffer: AudioBuffer; gain: GainNode }>();
  #sources: AudioBufferSourceNode[] = [];
  /** The song time the stems last started from, or stopped at. */
  #offset = 0;
  /** The audio context time the stems last started. */
  #startedAt = 0;
  #frame = 0;

  // The store only lists captions a media can hold. A detached `<video>` lends its text track list; the store reads
  // cues against this media's clock, not that element's.
  #textHost = document.createElement('video');
  #highway: Highway | null = null;

  constructor() {
    super();

    this.#master.connect(this.#audio.destination);
    this.videoRenditions.addEventListener('change', () => this.#onRenditionChange());
    this.audioTracks.addEventListener('change', () => this.#applyStemGains());
  }

  get song(): Song | null {
    return this.#song;
  }

  get part(): Part | null {
    return this.#part;
  }

  get notes(): readonly Note[] {
    return this.#notes;
  }

  /** Draw the highway on `canvas`, or stop drawing given `null`. */
  attachCanvas(canvas: HTMLCanvasElement | null): void {
    this.#highway?.destroy();
    this.#highway = canvas && new Highway(canvas, this);
  }

  // ----------------------------------------
  // Source
  // ----------------------------------------

  /** The song manifest's URL. Setting it loads the song. */
  get src(): string {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
    this.load().catch((error: unknown) => {
      if (!isAbortError(error)) console.error(error);
    });
  }

  get currentSrc(): string {
    return this.#currentSrc;
  }

  get readyState(): number {
    return this.#readyState;
  }

  canPlayType(type: string): CanPlayTypeResult {
    return type === 'application/json' ? 'maybe' : '';
  }

  async load(): Promise<void> {
    this.#load?.abort();
    const { signal } = (this.#load = new AbortController());

    this.#reset();

    if (!this.#src) return;

    this.#currentSrc = new URL(this.#src, location.href).href;
    this.#dispatch('loadstart');

    const song = await this.#fetchJson<Song>(this.#currentSrc, signal);

    this.#song = song;
    this.#duration = song.duration;
    this.#addTracks(song);
    this.#readyState = MediaReadyState.HAVE_METADATA;
    this.#dispatch('durationchange', 'loadedmetadata');

    await Promise.all([this.#loadStems(song, signal), this.#showPart(defaultPart(song))]);
    signal.throwIfAborted();

    this.#applyStemGains();
    this.#readyState = MediaReadyState.HAVE_ENOUGH_DATA;
    this.#dispatch('durationchange', 'loadeddata', 'canplay', 'canplaythrough');
  }

  #reset(): void {
    const hadSource = this.#readyState > MediaReadyState.HAVE_NOTHING;

    this.#stopStems();
    cancelAnimationFrame(this.#frame);

    for (const { gain } of this.#stems.values()) gain.disconnect();

    for (const track of [...this.videoTracks]) this.removeVideoTrack(track);

    for (const track of [...this.audioTracks]) this.removeAudioTrack(track);

    this.#stems.clear();
    this.#notesByPart.clear();
    this.#song = null;
    this.#part = null;
    this.#wantedPart = null;
    this.#notes = [];
    this.#currentSrc = '';
    this.#readyState = MediaReadyState.HAVE_NOTHING;
    this.#duration = Number.NaN;
    this.#offset = 0;
    this.#paused = true;
    this.#ended = false;

    if (hadSource) this.#dispatch('emptied');
  }

  #addTracks(song: Song): void {
    // Each part is a video rendition, so the stock quality menu picks what to play. Renditions only list under a
    // selected video track.
    const video = this.addVideoTrack('main');

    video.selected = true;

    for (const part of song.parts) video.addRendition('').id = part.id;

    this.videoRenditions.selectedIndex = song.parts.indexOf(defaultPart(song));

    // "Missed" is the mix without the part's own stem: the game picks it while the player is missing notes.
    const hit = this.addAudioTrack('main', 'Hit');

    hit.id = 'hit';
    hit.enabled = true;
    this.addAudioTrack('alternative', 'Missed').id = 'missed';
  }

  async #loadStems(song: Song, signal: AbortSignal): Promise<void> {
    const stems = await Promise.all(
      Object.entries(song.stems).map(async ([name, path]) => {
        const response = await fetch(this.#resolve(path), { signal });
        const buffer = await this.#audio.decodeAudioData(await response.arrayBuffer());

        return [name, buffer] as const;
      })
    );

    signal.throwIfAborted();

    for (const [name, buffer] of stems) {
      const gain = this.#audio.createGain();

      gain.connect(this.#master);
      this.#stems.set(name, { buffer, gain });
      this.#duration = Math.max(this.#duration, buffer.duration);
    }
  }

  // ----------------------------------------
  // Parts and mixes
  // ----------------------------------------

  #onRenditionChange(): void {
    // "Auto" selects nothing, which keeps the part already showing.
    const part = this.#song?.parts[this.videoRenditions.selectedIndex];

    if (part) this.#showPart(part).catch(console.error);
  }

  async #showPart(part: Part): Promise<void> {
    this.#wantedPart = part;

    const notes = await this.#notesOf(part);

    // A later pick, or an earlier request for this one, got here first.
    if (this.#wantedPart !== part || this.#part === part) return;

    this.#part = part;
    this.#notes = notes;

    for (const rendition of this.videoRenditions) rendition.active = rendition.id === part.id;

    this.#applyStemGains();
    this.dispatchEvent(new Event('partchange'));
  }

  #notesOf(part: Part): Promise<Note[]> {
    let notes = this.#notesByPart.get(part.id);

    if (!notes) {
      notes = this.#fetchJson<Note[]>(this.#resolve(part.notes));
      this.#notesByPart.set(part.id, notes);
    }

    return notes;
  }

  /** Mute the part's own stem while the "Missed" mix is on, as if the player stopped playing it. */
  #applyStemGains(): void {
    const missed = this.audioTracks.getTrackById('missed')?.enabled ?? false;

    for (const [name, { gain }] of this.#stems) {
      const level = missed && name === this.#part?.stem ? 0 : 1;

      // Ease over a few milliseconds rather than jump, which clicks.
      gain.gain.setTargetAtTime(level, this.#audio.currentTime, 0.01);
    }
  }

  // ----------------------------------------
  // Playback
  // ----------------------------------------

  get paused(): boolean {
    return this.#paused;
  }

  get ended(): boolean {
    return this.#ended;
  }

  async play(): Promise<void> {
    if (!this.#paused) return;

    // Resuming inside the user's gesture is what lets the audio start.
    const resumed = this.#audio.resume();

    if (this.#ended) this.#offset = 0;

    this.#paused = false;
    this.#ended = false;
    this.#dispatch('play');

    await resumed;

    if (this.#readyState < MediaReadyState.HAVE_ENOUGH_DATA) await this.#once('canplaythrough');

    // Paused, or played again, while waiting.
    if (this.#paused || this.#sources.length) return;

    this.#startStems();
    this.#dispatch('playing');
    this.#tick();
  }

  pause(): void {
    if (this.#paused) return;

    this.#paused = true;
    this.#stopStems();
    cancelAnimationFrame(this.#frame);
    this.#dispatch('timeupdate', 'pause');
  }

  // A `<video>` fires `timeupdate` about four times a second. Text cues turn active and inactive on `timeupdate`, and the
  // game counts a miss when a note's cue ends, so this fires every frame: a cue is never more than a frame late.
  #tick = (): void => {
    if (this.#paused) return;

    if (this.currentTime >= this.duration) {
      if (!this.loop) return this.#end();

      this.currentTime = 0;
    }

    this.#dispatch('timeupdate');
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #end(): void {
    this.#stopStems();
    this.#offset = this.duration;
    this.#paused = true;
    this.#ended = true;
    this.#dispatch('timeupdate', 'pause', 'ended');
  }

  /** Start every stem at once, from `#offset`, so they stay in sync. */
  #startStems(): void {
    this.#startedAt = this.#audio.currentTime;
    this.#sources = [...this.#stems.values()].map(({ buffer, gain }) => {
      const source = this.#audio.createBufferSource();

      source.buffer = buffer;
      source.connect(gain);
      source.start(this.#startedAt, this.#offset);

      return source;
    });
  }

  #stopStems(): void {
    this.#offset = this.currentTime;

    for (const source of this.#sources) source.stop();

    this.#sources = [];
  }

  // ----------------------------------------
  // Time
  // ----------------------------------------

  /** The audio clock is the song clock: the highway, the controls, and the cues all read it from here. */
  get currentTime(): number {
    if (!this.#sources.length) return this.#offset;

    return Math.min(this.#offset + this.#audio.currentTime - this.#startedAt, this.duration);
  }
  set currentTime(time: number) {
    const playing = this.#sources.length > 0;

    this.#stopStems();
    this.#offset = clamp(time, 0, this.duration || 0);
    this.#ended = false;
    this.#seeking = true;
    this.#dispatch('seeking');

    if (playing) this.#startStems();

    // The store starts waiting for `seeked` just after setting the time, so it can't fire until then.
    queueMicrotask(() => {
      this.#seeking = false;
      this.#dispatch('seeked', 'timeupdate');
    });
  }

  get duration(): number {
    return this.#duration;
  }

  get seeking(): boolean {
    return this.#seeking;
  }

  // ----------------------------------------
  // Volume
  // ----------------------------------------

  get volume(): number {
    return this.#volume;
  }
  set volume(value: number) {
    this.#volume = value;
    this.#applyVolume();
  }

  get muted(): boolean {
    return this.#muted;
  }
  set muted(value: boolean) {
    this.#muted = value;
    this.#applyVolume();
  }

  #applyVolume(): void {
    this.#master.gain.value = this.#muted ? 0 : this.#volume;
    this.#dispatch('volumechange');
  }

  // ----------------------------------------
  // Text tracks
  // ----------------------------------------

  get textTracks(): TextTrackList {
    return this.#textHost.textTracks;
  }

  addTextTrack(kind: TextTrackKind, label?: string, language?: string): TextTrack {
    return this.#textHost.addTextTrack(kind, label, language);
  }

  // ----------------------------------------
  // Helpers
  // ----------------------------------------

  /** Resolve a path from the manifest against the manifest's URL. */
  #resolve(path: string): string {
    return new URL(path, this.#currentSrc).href;
  }

  async #fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, signal && { signal });
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);

    // SAFETY: `scripts/fetch-song.ts` writes these files in the shapes `song.ts` describes.
    return response.json() as Promise<T>;
  }

  #once(type: string): Promise<void> {
    return new Promise((resolve) => this.addEventListener(type, () => resolve(), { once: true }));
  }

  #dispatch(...types: string[]): void {
    for (const type of types) this.dispatchEvent(new Event(type));
  }
}

/** The part to show first: Expert Guitar where the chart has it. */
function defaultPart(song: Song): Part {
  return song.parts.find((part) => part.instrument === 'guitar' && part.difficulty === 'expert') ?? song.parts[0]!;
}
