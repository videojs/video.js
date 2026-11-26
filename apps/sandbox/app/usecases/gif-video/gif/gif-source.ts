import { createDecodedGifSource } from './decoded-gif-source';
import type { GifFrameSource } from './frame-source';
import { createImageDecoderSource, isImageDecoderSupported } from './image-decoder-source';

/**
 * A GIF ready to play: its geometry, its frame timeline in media time, and a way to paint any frame. Everything about
 * the file ends here; the adapter that plays it only runs a clock against `delayOf` and `startOf`.
 */
export interface GifSource {
  readonly width: number;
  readonly height: number;
  readonly frameCount: number;
  /** Length of the whole animation in ms. */
  readonly duration: number;
  /** Media time in ms at which frame `index` starts. */
  startOf(index: number): number;
  /** How long frame `index` stays on screen, in ms. */
  delayOf(index: number): number;
  /** The frame on screen at media time `ms`, clamped to the frames the GIF has. */
  frameAt(ms: number): number;
  /**
   * Paint the fully composited frame `index` onto `ctx`. Backends that decode on demand resolve asynchronously and
   * discard a draw once a newer one has been requested, so callers can fire and forget.
   */
  drawFrame(ctx: CanvasRenderingContext2D, index: number): void | Promise<void>;
  destroy(): void;
}

/** Why a GIF could not be loaded: the bytes never arrived, or they were not a GIF the decoder could read. */
export class GifLoadError extends Error {
  readonly kind: 'network' | 'decode';

  constructor(kind: 'network' | 'decode', message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GifLoadError';
    this.kind = kind;
  }
}

export interface LoadGifOptions {
  /** Abort the fetch, and discard the decode if it is already under way. */
  signal?: AbortSignal | undefined;
  /** Forwarded to `fetch`; an adapter derives it from its `crossOrigin`. */
  credentials?: RequestCredentials | undefined;
}

/**
 * Decode the GIF bytes with the browser's WebCodecs `ImageDecoder` where it can read GIFs, and with the JS decoder
 * elsewhere.
 */
async function decode(buffer: ArrayBuffer): Promise<GifFrameSource> {
  if (await isImageDecoderSupported()) {
    return createImageDecoderSource(buffer);
  }

  return createDecodedGifSource(buffer);
}

/**
 * Fetch and decode a GIF. Rejects with a `GifLoadError` that says which step failed, or with the signal's reason once
 * aborted.
 */
export async function loadGif(url: string, options: LoadGifOptions = {}): Promise<GifSource> {
  const { signal, credentials = 'same-origin' } = options;
  const init: RequestInit = { credentials };

  if (signal) init.signal = signal;

  let buffer: ArrayBuffer;

  try {
    const response = await fetch(url, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    buffer = await response.arrayBuffer();
  } catch (cause) {
    if (signal?.aborted) throw signal.reason;

    const reason = cause instanceof Error ? cause.message : String(cause);

    throw new GifLoadError('network', `Failed to fetch GIF: ${reason}`, { cause });
  }

  let frames: GifFrameSource;

  try {
    frames = await decode(buffer);
  } catch (cause) {
    if (signal?.aborted) throw signal.reason;

    throw new GifLoadError('decode', 'Failed to decode GIF.', { cause });
  }

  if (signal?.aborted) {
    frames.destroy();
    throw signal.reason;
  }

  return createGifSource(frames);
}

/** Put a frame timeline over a decoder's per-frame delays. */
export function createGifSource(frames: GifFrameSource): GifSource {
  return new TimedGifSource(frames);
}

class TimedGifSource implements GifSource {
  readonly #frames: GifFrameSource;
  /** Cumulative start time of each frame in ms; one extra entry holds the total. */
  readonly #starts: number[] = [0];

  constructor(frames: GifFrameSource) {
    this.#frames = frames;

    for (const delay of frames.delays) {
      this.#starts.push(this.#starts[this.#starts.length - 1]! + delay);
    }
  }

  get width(): number {
    return this.#frames.width;
  }

  get height(): number {
    return this.#frames.height;
  }

  get frameCount(): number {
    return this.#frames.frameCount;
  }

  get duration(): number {
    return this.#starts[this.frameCount]!;
  }

  startOf(index: number): number {
    return this.#starts[this.#clamp(index)]!;
  }

  delayOf(index: number): number {
    return this.#frames.delays[this.#clamp(index)]!;
  }

  frameAt(ms: number): number {
    const last = this.frameCount - 1;

    for (let i = 0; i < last; i++) {
      if (ms < this.#starts[i + 1]!) return i;
    }

    return last;
  }

  drawFrame(ctx: CanvasRenderingContext2D, index: number): void | Promise<void> {
    return this.#frames.drawFrame(ctx, this.#clamp(index));
  }

  destroy(): void {
    this.#frames.destroy();
  }

  #clamp(index: number): number {
    return Math.min(Math.max(Math.trunc(index), 0), this.frameCount - 1);
  }
}
