// Browsers snap near-zero GIF frame delays (0 or 1 hundredths of a second) up
// to 100ms rather than spinning; delays land here already converted to ms.
const MIN_FRAME_DELAY_MS = 20;
const SNAPPED_FRAME_DELAY_MS = 100;

/** Normalize a raw GIF frame delay in ms the way browsers render it. */
export function normalizeFrameDelay(delayMs: number): number {
  return delayMs < MIN_FRAME_DELAY_MS ? SNAPPED_FRAME_DELAY_MS : delayMs;
}

/**
 * A decoded GIF ready for playback: a fixed timing table plus a way to paint any fully composited frame. `GifAdapter`
 * owns the clock and playback state; a frame source owns decoding and frame compositing, so decoder backends (WebCodecs
 * `ImageDecoder`, the JS decoder) stay swappable behind it.
 */
export interface GifFrameSource {
  readonly width: number;
  readonly height: number;
  readonly frameCount: number;
  /** Per-frame delay in ms, already normalized via `normalizeFrameDelay`. */
  readonly delays: readonly number[];
  /**
   * Paint the fully composited frame `index` onto `ctx`. Backends that decode on demand resolve asynchronously and
   * discard a draw once a newer one has been requested, so callers can fire and forget.
   */
  drawFrame(ctx: CanvasRenderingContext2D, index: number): void | Promise<void>;
  destroy(): void;
}
