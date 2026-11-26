import {
  type CanPlayTypeResult,
  EMPTY_TIME_RANGES,
  type ErrorLike,
  MediaError,
  type MediaPreloadType,
  type Video,
} from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise } from '@videojs/utils/function';
import { isFunction } from '@videojs/utils/predicate';

import { GifLoadError, type GifSource, loadGif } from './gif';

export interface GifAdapterProps {
  src: string;
  autoplay: boolean;
  loop: boolean;
  preload: MediaPreloadType;
  crossOrigin: string | null;
  playbackRate: number;
}

// Native media fires `timeupdate` every 250ms or so; GIF frames can be far
// shorter, so advancing frames re-dispatches only after this much media time.
const TIMEUPDATE_INTERVAL_MS = 250;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_ENOUGH_DATA = 4;

/** A canvas, or anything that paints like one: `attach()` only needs a 2D context from it. */
function isCanvasTarget(target: EventTarget | null): target is HTMLCanvasElement {
  return target !== null && 'getContext' in target && isFunction(target.getContext);
}

/** Map a load failure onto the native error codes the error feature reads. */
function toMediaError(error: GifLoadError): MediaError {
  return new MediaError(
    error.message,
    error.kind === 'network' ? MediaError.MEDIA_ERR_NETWORK : MediaError.MEDIA_ERR_DECODE
  );
}

/**
 * Plays an animated GIF like a video: drives a `<canvas>` with its own clock over the frame timeline a `GifSource`
 * provides, so playback can actually pause, seek, loop on demand, and change rate — none of which an `<img>` rendering
 * allows. Fetching and decoding are `loadGif`'s job; this class owns playback state and the media contract.
 *
 * GIFs carry no audio, so the media exposes no volume or mute surface, and the file is fetched with `fetch()`, so the
 * source must be same-origin or served with CORS headers.
 *
 * @fires framechange - Fired whenever `currentFrame` changes, by playback or by a seek.
 */
export class GifAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: GifAdapterProps = {
    src: '',
    autoplay: false,
    loop: false,
    preload: 'metadata',
    crossOrigin: null,
    playbackRate: 1,
  };

  #canvas: HTMLCanvasElement | null = null;

  #src = GifAdapter.defaultProps.src;
  #autoplay = GifAdapter.defaultProps.autoplay;
  #loop = GifAdapter.defaultProps.loop;
  #preload = GifAdapter.defaultProps.preload;
  #crossOrigin = GifAdapter.defaultProps.crossOrigin;
  #playbackRate = GifAdapter.defaultProps.playbackRate;
  #defaultPlaybackRate = GifAdapter.defaultProps.playbackRate;

  #source: GifSource | null = null;

  #paused = true;
  #ended = false;
  #seeking = false;
  #readyState: number = READY_STATE_HAVE_NOTHING;
  #error: ErrorLike | null = null;

  #frameIndex = 0;
  /** Index of the last frame handed to the source to paint, -1 when none. */
  #renderedIndex = -1;
  /** Media time already spent inside the current frame, in ms. */
  #frameElapsed = 0;
  /** Wall-clock timestamp of the last schedule, for measuring elapsed time. */
  #frameClock = 0;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #lastTimeupdate = 0;
  #pendingSeek: number | null = null;

  #abort: AbortController | null = null;
  #loadComplete: PublicPromise<void> | null = null;

  /** GIF playback is self-driven, so there is no third-party engine underneath. */
  get engine(): null {
    return null;
  }

  get target(): HTMLCanvasElement | null {
    return this.#canvas;
  }

  /** Bind the canvas the frames render into. Playback state survives detach; only drawing stops. */
  attach(target: EventTarget | null): void {
    if (!isCanvasTarget(target) || this.#canvas === target) return;

    if (this.#canvas) this.detach();

    this.#canvas = target;

    if (this.#source) {
      this.#sizeCanvas();
      this.#renderedIndex = -1;
      this.#render(this.#frameIndex);
    }
  }

  detach(): void {
    if (!this.#canvas) return;

    this.#canvas = null;
    this.#renderedIndex = -1;
  }

  override destroy(): void {
    this.#stopClock();
    this.#abort?.abort();
    this.#abort = null;
    this.#loadComplete?.resolve();
    this.#source?.destroy();
    this.#source = null;
    this.detach();
    super.destroy();
  }

  get src(): string {
    return this.#src;
  }

  /** Setting a source resets playback and fetches it, unless `preload` is `'none'` and `autoplay` is off. */
  set src(value: string) {
    if (this.#src === value) return;

    this.#src = value;
    void this.load();
  }

  get currentSrc(): string {
    return this.#source ? this.#src : '';
  }

  get readyState(): number {
    return this.#readyState;
  }

  get preload(): MediaPreloadType {
    return this.#preload;
  }

  set preload(value: MediaPreloadType) {
    this.#preload = value;
  }

  get crossOrigin(): string | null {
    return this.#crossOrigin;
  }

  set crossOrigin(value: string | null) {
    this.#crossOrigin = value;
  }

  canPlayType(type: string): CanPlayTypeResult {
    return /^image\/gif\s*(;|$)/i.test(type) ? 'probably' : '';
  }

  /** Reset playback and fetch the current source, honoring `preload: 'none'` until playback demands data. */
  async load(): Promise<void> {
    this.#abort?.abort();
    this.#abort = null;
    this.#stopClock();

    const hadData = this.#source !== null;
    // A seek queued before any metadata is a start position for this load; one
    // left over from a previous source is not.
    const pendingSeek = hadData ? null : this.#pendingSeek;

    this.#resetState();
    this.#pendingSeek = pendingSeek;

    if (hadData) this.dispatchEvent(new Event('emptied'));

    if (!this.#src) return;

    if (this.#preload === 'none' && !this.#autoplay) return;

    await this.#loadSource();
  }

  async #loadSource(): Promise<void> {
    const abort = new AbortController();

    this.#abort = abort;

    const loadComplete = (this.#loadComplete ??= createPublicPromise<void>());

    this.dispatchEvent(new Event('loadstart'));

    let source: GifSource;

    try {
      source = await loadGif(this.#src, {
        signal: abort.signal,
        credentials: this.#crossOrigin === 'use-credentials' ? 'include' : 'same-origin',
      });
    } catch (cause) {
      // A newer load superseded this one; its own outcome is the one that counts.
      if (abort.signal.aborted) return;

      this.#fail(cause instanceof GifLoadError ? toMediaError(cause) : new MediaError(String(cause)));
      return;
    }

    this.#source = source;
    this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;

    this.dispatchEvent(new Event('durationchange'));
    this.dispatchEvent(new Event('loadedmetadata'));
    this.dispatchEvent(new Event('resize'));

    if (this.#pendingSeek !== null) {
      const time = this.#pendingSeek;

      this.#pendingSeek = null;
      this.#seekTo(time);
    }

    this.#sizeCanvas();
    this.#render(this.#frameIndex);

    this.dispatchEvent(new Event('loadeddata'));
    this.dispatchEvent(new Event('canplay'));
    this.dispatchEvent(new Event('canplaythrough'));

    loadComplete.resolve();
    this.#loadComplete = null;

    if (!this.#paused) {
      this.#startClock();
      this.dispatchEvent(new Event('playing'));
    } else if (this.#autoplay) {
      void this.play();
    }
  }

  #fail(error: MediaError): void {
    // A later `play()` may retry the fetch; a stale controller would block it.
    this.#abort = null;
    this.#error = error;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.dispatchEvent(new Event('error'));
    // Settle so `play()` callers reject on the stored error instead of hanging.
    this.#loadComplete?.resolve();
    this.#loadComplete = null;
  }

  get paused(): boolean {
    return this.#paused;
  }

  get ended(): boolean {
    return this.#ended;
  }

  get seeking(): boolean {
    return this.#seeking;
  }

  async play(): Promise<void> {
    if (!this.#src) {
      throw new DOMException('No media source.', 'NotSupportedError');
    }

    if (this.#ended) this.#seekTo(0);

    const wasPaused = this.#paused;

    this.#paused = false;
    this.#ended = false;

    if (wasPaused) this.dispatchEvent(new Event('play'));

    if (!this.#source) {
      if (!this.#abort) void this.#loadSource();

      await (this.#loadComplete ??= createPublicPromise<void>());

      if (this.#error) {
        throw new DOMException(this.#error.message, 'NotSupportedError');
      }

      return;
    }

    if (wasPaused) {
      this.#startClock();
      this.dispatchEvent(new Event('playing'));
    }
  }

  pause(): void {
    if (this.#paused) return;

    this.#syncElapsed();
    this.#stopClock();
    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  get currentTime(): number {
    const source = this.#source;
    if (!source) return this.#pendingSeek ?? 0;

    let elapsed = this.#frameElapsed;

    if (!this.#paused && this.#timer !== null) {
      elapsed += (performance.now() - this.#frameClock) * this.#playbackRate;
    }

    return Math.min(source.startOf(this.#frameIndex) + elapsed, source.duration) / 1000;
  }

  set currentTime(value: number) {
    if (!this.#source) {
      // No frame timeline to land on yet; applied once metadata arrives.
      this.#pendingSeek = value;
      return;
    }

    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
    this.#seekTo(value);
    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
    this.#dispatchTimeupdate();
  }

  #seekTo(seconds: number): void {
    const source = this.#source;
    if (!source) return;

    const ms = Math.min(Math.max(seconds * 1000, 0), source.duration);
    const index = source.frameAt(ms);
    const changed = index !== this.#frameIndex;

    this.#frameIndex = index;
    this.#frameElapsed = ms - source.startOf(index);

    if (this.#ended && ms < source.duration) this.#ended = false;

    this.#render(index);

    if (changed) this.#dispatchFramechange();

    if (!this.#paused) this.#startClock();
  }

  get duration(): number {
    return this.#source ? this.#source.duration / 1000 : Number.NaN;
  }

  /** How many frames the GIF has, 0 before metadata. */
  get frameCount(): number {
    return this.#source?.frameCount ?? 0;
  }

  /** The frame on screen, 0-based. */
  get currentFrame(): number {
    return this.#frameIndex;
  }

  /** Seek to the start of frame `index`, clamped to the frames the GIF has. Dispatches `seeking` and `seeked`. */
  seekToFrame(index: number): void {
    if (!this.#source) return;

    this.currentTime = this.#source.startOf(index) / 1000;
  }

  get autoplay(): boolean {
    return this.#autoplay;
  }

  set autoplay(value: boolean) {
    this.#autoplay = value;

    if (value && this.#paused && this.#source) void this.play();
  }

  get loop(): boolean {
    return this.#loop;
  }

  set loop(value: boolean) {
    this.#loop = value;
  }

  get playbackRate(): number {
    return this.#playbackRate;
  }

  set playbackRate(value: number) {
    if (this.#playbackRate === value) return;

    // Bank time spent at the old rate before the new one changes the clock's scale.
    this.#syncElapsed();
    this.#playbackRate = value;

    if (!this.#paused && this.#source) this.#startClock();

    this.dispatchEvent(new Event('ratechange'));
  }

  get defaultPlaybackRate(): number {
    return this.#defaultPlaybackRate;
  }

  set defaultPlaybackRate(value: number) {
    this.#defaultPlaybackRate = value;
  }

  get buffered() {
    // The whole file decodes up front, so once loaded everything is buffered.
    return this.#source ? createTimeRange(0, this.duration) : EMPTY_TIME_RANGES;
  }

  get seekable() {
    return this.#source ? createTimeRange(0, this.duration) : EMPTY_TIME_RANGES;
  }

  get error(): ErrorLike | null {
    return this.#error;
  }

  get videoWidth(): number {
    return this.#source?.width ?? 0;
  }

  get videoHeight(): number {
    return this.#source?.height ?? 0;
  }

  #resetState(): void {
    this.#source?.destroy();
    this.#source = null;
    this.#frameIndex = 0;
    this.#renderedIndex = -1;
    this.#frameElapsed = 0;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#pendingSeek = null;
    this.#error = null;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#lastTimeupdate = 0;
    this.#loadComplete?.resolve();
    this.#loadComplete = null;
  }

  // ----------------------------------------
  // Playback clock
  // ----------------------------------------

  /** Fold wall-clock time since the last schedule into `#frameElapsed`. */
  #syncElapsed(): void {
    if (this.#timer === null) return;

    const now = performance.now();

    this.#frameElapsed += (now - this.#frameClock) * this.#playbackRate;
    this.#frameClock = now;
  }

  #startClock(): void {
    this.#stopClock();

    const source = this.#source;
    if (!source) return;

    const remaining = source.delayOf(this.#frameIndex) - this.#frameElapsed;

    this.#frameClock = performance.now();
    this.#timer = setTimeout(this.#advance, Math.max(remaining / this.#playbackRate, 0));
  }

  #stopClock(): void {
    if (this.#timer === null) return;

    clearTimeout(this.#timer);
    this.#timer = null;
  }

  #advance = (): void => {
    const source = this.#source;
    if (!source) return;

    this.#timer = null;
    this.#frameElapsed = 0;

    if (this.#frameIndex + 1 >= source.frameCount) {
      if (this.#loop) {
        this.#frameIndex = 0;
        this.#render(0);
        this.#dispatchFramechange();
        this.#maybeTimeupdate();
        this.#startClock();
        return;
      }

      // Natural end: `paused` flips without a `pause` event, per native media.
      this.#frameElapsed = source.delayOf(this.#frameIndex);
      this.#paused = true;
      this.#ended = true;
      this.#dispatchTimeupdate();
      this.dispatchEvent(new Event('ended'));
      return;
    }

    this.#frameIndex += 1;
    this.#render(this.#frameIndex);
    this.#dispatchFramechange();
    this.#maybeTimeupdate();
    this.#startClock();
  };

  #maybeTimeupdate(): void {
    const now = this.#source?.startOf(this.#frameIndex) ?? 0;
    if (Math.abs(now - this.#lastTimeupdate) < TIMEUPDATE_INTERVAL_MS) return;

    this.#dispatchTimeupdate();
  }

  /** `timeupdate` is throttled like native media; frame-level UI listens for this instead. */
  #dispatchFramechange(): void {
    this.dispatchEvent(new Event('framechange'));
  }

  #dispatchTimeupdate(): void {
    this.#lastTimeupdate = (this.#source?.startOf(this.#frameIndex) ?? 0) + this.#frameElapsed;
    this.dispatchEvent(new Event('timeupdate'));
  }

  // ----------------------------------------
  // Rendering
  // ----------------------------------------

  #sizeCanvas(): void {
    const source = this.#source;
    const canvas = this.#canvas;
    if (!source || !canvas) return;

    canvas.width = source.width;
    canvas.height = source.height;
  }

  /** Ask the source to paint frame `index`; the clock never waits on a paint. */
  #render(index: number): void {
    const canvas = this.#canvas;
    const source = this.#source;
    if (!canvas || !source || index === this.#renderedIndex) return;

    // Canvas-less environments return null; playback state still advances.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.#renderedIndex = index;
    // An on-demand backend paints asynchronously and discards stale draws
    // itself, so a late frame never overwrites a newer one.
    void source.drawFrame(ctx, index);
  }
}
