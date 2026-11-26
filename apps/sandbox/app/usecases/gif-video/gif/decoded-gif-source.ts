import type { GifFrameSource } from './frame-source';
import { normalizeFrameDelay } from './frame-source';
import { GifDisposal, type GifFrame, type ParsedGif, parseGif } from './gif-decoder';

/**
 * JS backend for `GifFrameSource`, used where WebCodecs `ImageDecoder` cannot decode GIFs. Frames stay as palette
 * indices; this composites them forward into one RGBA buffer following each frame's disposal, and hands the buffer to
 * the canvas as `ImageData`.
 */
export function createDecodedGifSource(buffer: ArrayBuffer): GifFrameSource {
  return new DecodedGifSource(parseGif(buffer));
}

/** A composited frame plus the pixels disposal 3 would need put back. */
export class DecodedGifSource implements GifFrameSource {
  readonly width: number;
  readonly height: number;
  readonly delays: readonly number[];

  #frames: readonly GifFrame[];
  /** The composited canvas, RGBA. */
  #pixels: Uint8ClampedArray<ArrayBuffer>;
  /** Copy of the canvas taken before a `restorePrevious` frame was drawn, so disposal can put it back. */
  #previous: Uint8ClampedArray<ArrayBuffer> | null = null;
  /** Index of the frame currently composited, -1 when the canvas is blank. */
  #compositedIndex = -1;

  constructor(gif: ParsedGif) {
    this.width = gif.width;
    this.height = gif.height;
    this.#frames = gif.frames;
    this.delays = gif.frames.map((frame) => normalizeFrameDelay(frame.delayMs));
    this.#pixels = new Uint8ClampedArray(gif.width * gif.height * 4);
  }

  get frameCount(): number {
    return this.#frames.length;
  }

  /** The composited RGBA pixels of frame `index`. Exposed for tests and for callers that want to copy a still. */
  pixelsAt(index: number): Uint8ClampedArray<ArrayBuffer> {
    this.#compositeUpTo(index);

    return this.#pixels;
  }

  drawFrame(ctx: CanvasRenderingContext2D, index: number): void {
    if (index < 0 || index >= this.#frames.length) return;

    this.#compositeUpTo(index);
    ctx.putImageData(new ImageData(this.#pixels, this.width, this.height), 0, 0);
  }

  destroy(): void {
    this.#frames = [];
    this.#pixels = new Uint8ClampedArray(0);
    this.#previous = null;
    this.#compositedIndex = -1;
  }

  /**
   * GIF frames are deltas over the canvas left by the previous one, so a forward jump applies only the frames in
   * between, and a backward jump clears and replays from frame 0.
   */
  #compositeUpTo(index: number): void {
    if (index === this.#compositedIndex) return;

    let from = this.#compositedIndex + 1;

    if (index < this.#compositedIndex) {
      this.#pixels.fill(0);
      this.#previous = null;
      from = 0;
    }

    for (let i = from; i <= index; i++) {
      if (i > 0) this.#dispose(this.#frames[i - 1]!);

      this.#draw(this.#frames[i]!);
    }

    this.#compositedIndex = index;
  }

  /** Apply what the frame's disposal says happens to its rectangle once its delay is up. */
  #dispose(frame: GifFrame): void {
    if (frame.disposal === GifDisposal.restoreBackground) {
      this.#clearRect(frame);
    } else if (frame.disposal === GifDisposal.restorePrevious && this.#previous) {
      this.#pixels.set(this.#previous);
      this.#previous = null;
    }
  }

  #clearRect(frame: GifFrame): void {
    const right = Math.min(frame.left + frame.width, this.width);
    const bottom = Math.min(frame.top + frame.height, this.height);

    for (let y = frame.top; y < bottom; y++) {
      this.#pixels.fill(0, (y * this.width + frame.left) * 4, (y * this.width + right) * 4);
    }
  }

  #draw(frame: GifFrame): void {
    if (frame.disposal === GifDisposal.restorePrevious) this.#previous = this.#pixels.slice();

    const { colorTable, transparentIndex, indices } = frame;
    const right = Math.min(frame.left + frame.width, this.width);
    const bottom = Math.min(frame.top + frame.height, this.height);

    for (let y = frame.top; y < bottom; y++) {
      let source = (y - frame.top) * frame.width;
      let target = (y * this.width + frame.left) * 4;

      for (let x = frame.left; x < right; x++, source++, target += 4) {
        const colorIndex = indices[source]!;
        if (colorIndex === transparentIndex) continue;

        const entry = colorIndex * 3;

        this.#pixels[target] = colorTable[entry] ?? 0;
        this.#pixels[target + 1] = colorTable[entry + 1] ?? 0;
        this.#pixels[target + 2] = colorTable[entry + 2] ?? 0;
        this.#pixels[target + 3] = 255;
      }
    }
  }
}
