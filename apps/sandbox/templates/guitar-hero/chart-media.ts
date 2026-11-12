import type { CanPlayTypeResult, MediaPreloadType } from '@videojs/media';
import { MediaReadyState } from '@videojs/media';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import { clamp } from '@videojs/utils/number';
import { isAbortError } from '@videojs/utils/predicate';

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

  // A `<video>` fires `timeupdate` about four times a second. Text cues turn active on `timeupdate`, and the game
  // judges notes against them, so this fires every frame: a cue is never more than a frame late.
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

// ----------------------------------------
// Highway
// ----------------------------------------

const LANE_COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#f97316'];
/** Seconds of chart in view above the strike line. */
const LOOK_AHEAD = 1.5;
/** Seconds a passed note takes to fade out below the strike line. */
const FADE_OUT = 0.15;
/** How wide the far end of the highway is, next to the near end. */
const FAR_SCALE = 0.3;

/** Opacity for a note `seconds` from the strike line: solid ahead of it, fading out once past. */
function fade(seconds: number): number {
  return clamp(1 + seconds / FADE_OUT, 0, 1);
}

/** Draws the scrolling note highway every frame, from wherever the media's clock is. */
class Highway {
  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;
  #media: ChartMedia;
  #frame = 0;

  // Layout, in canvas pixels, refreshed every frame so a resize just works.
  #width = 0;
  #height = 0;
  #strikeY = 0;
  #vanishY = 0;
  #laneWidth = 0;

  constructor(canvas: HTMLCanvasElement, media: ChartMedia) {
    this.#canvas = canvas;
    this.#context = canvas.getContext('2d')!;
    this.#media = media;
    this.#draw();
  }

  destroy(): void {
    cancelAnimationFrame(this.#frame);
  }

  #draw = (): void => {
    this.#frame = requestAnimationFrame(this.#draw);

    const time = this.#media.currentTime;
    const notes = this.#media.notes;
    const drums = this.#media.part?.instrument === 'drums';

    this.#layout();
    this.#drawBoard();
    this.#drawTargets();

    // Far notes first, so near ones overlap them.
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i]!;
      const from = note.time - time;
      const to = from + note.length;
      if (from > LOOK_AHEAD || to < -FADE_OUT) continue;

      if (note.length > 0) {
        this.#context.globalAlpha = fade(to);
        this.#drawTail(note.lane, Math.max(from, 0), Math.min(to, LOOK_AHEAD));
      }

      // A held note's gem has long gone by, and the perspective can't place it any nearer.
      if (from < -FADE_OUT) continue;

      this.#context.globalAlpha = fade(from);

      // On drums, lane 0 is the kick pedal: a bar across the whole highway.
      if (drums && note.lane === 0) this.#drawKick(from);
      else this.#drawGem(note.lane, from);
    }

    this.#context.globalAlpha = 1;
  };

  #layout(): void {
    this.#width = this.#canvas.width;
    this.#height = this.#canvas.height;
    this.#strikeY = this.#height * 0.86;
    this.#laneWidth = Math.min(this.#width * 0.9, this.#height * 0.9) / 5;

    // Place the vanishing point so that `LOOK_AHEAD` lands near the top edge.
    const topY = this.#height * 0.03;
    this.#vanishY = (topY - FAR_SCALE * this.#strikeY) / (1 - FAR_SCALE);
  }

  /** Perspective scale for a moment `seconds` from now: 1 on the strike line, `FAR_SCALE` at the look-ahead. */
  #scale(seconds: number): number {
    return 1 / (1 + (seconds / LOOK_AHEAD) * (1 / FAR_SCALE - 1));
  }

  #y(seconds: number): number {
    return this.#vanishY + (this.#strikeY - this.#vanishY) * this.#scale(seconds);
  }

  /** The x of a lane's center (or edge, for fractional lanes) at a moment `seconds` from now. */
  #x(lane: number, seconds: number): number {
    return this.#width / 2 + (lane - 2) * this.#laneWidth * this.#scale(seconds);
  }

  #drawBoard(): void {
    const ctx = this.#context;
    const near = -FADE_OUT * 1.5;

    ctx.fillStyle = '#07070c';
    ctx.fillRect(0, 0, this.#width, this.#height);

    const board = ctx.createLinearGradient(0, this.#y(LOOK_AHEAD), 0, this.#height);
    board.addColorStop(0, '#0d0d16');
    board.addColorStop(1, '#22222f');
    ctx.fillStyle = board;
    this.#quad(-0.5, 4.5, LOOK_AHEAD, near);

    ctx.strokeStyle = 'rgb(255 255 255 / 0.12)';
    ctx.lineWidth = Math.max(1, this.#laneWidth * 0.015);

    for (let edge = -0.5; edge <= 4.5; edge++) {
      ctx.beginPath();
      ctx.moveTo(this.#x(edge, LOOK_AHEAD), this.#y(LOOK_AHEAD));
      ctx.lineTo(this.#x(edge, near), this.#y(near));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgb(255 255 255 / 0.6)';
    this.#quad(-0.5, 4.5, 0.004, -0.004);
  }

  /** Fill the stretch of highway between lanes `left` and `right`, from `far` to `near` seconds away. */
  #quad(left: number, right: number, far: number, near: number): void {
    const ctx = this.#context;

    ctx.beginPath();
    ctx.moveTo(this.#x(left, far), this.#y(far));
    ctx.lineTo(this.#x(right, far), this.#y(far));
    ctx.lineTo(this.#x(right, near), this.#y(near));
    ctx.lineTo(this.#x(left, near), this.#y(near));
    ctx.fill();
  }

  #drawTargets(): void {
    const ctx = this.#context;
    const radius = this.#laneWidth * 0.34;

    for (let lane = 0; lane < 5; lane++) {
      ctx.beginPath();
      ctx.ellipse(this.#x(lane, 0), this.#strikeY, radius, radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#101018';
      ctx.fill();
      ctx.lineWidth = radius * 0.22;
      ctx.strokeStyle = LANE_COLORS[lane]!;
      ctx.stroke();
    }
  }

  #drawTail(lane: number, from: number, to: number): void {
    this.#context.fillStyle = LANE_COLORS[lane]!;
    this.#quad(lane - 0.08, lane + 0.08, to, from);
  }

  #drawGem(lane: number, seconds: number): void {
    const ctx = this.#context;
    const radius = this.#laneWidth * 0.3 * this.#scale(seconds);
    const x = this.#x(lane, seconds);
    const y = this.#y(seconds);

    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = LANE_COLORS[lane]!;
    ctx.fill();
    ctx.lineWidth = radius * 0.18;
    ctx.strokeStyle = 'rgb(255 255 255 / 0.9)';
    ctx.stroke();
  }

  #drawKick(seconds: number): void {
    const half = 0.03;

    this.#context.fillStyle = LANE_COLORS[4]!;
    this.#quad(-0.4, 4.4, seconds + half, seconds - half);
  }
}
