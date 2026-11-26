import type { GifFrameSource } from './frame-source';
import { normalizeFrameDelay } from './frame-source';

// Minimal WebCodecs image-decode surface; TypeScript's dom lib does not ship
// `ImageDecoder` yet, so these mirror just the members used here.
interface ImageDecodeResult {
  image: VideoFrame;
}

interface ImageTrack {
  frameCount: number;
}

interface ImageTrackList {
  ready: Promise<void>;
  selectedTrack: ImageTrack | null;
}

interface NativeImageDecoder {
  readonly tracks: ImageTrackList;
  readonly completed: Promise<void>;
  decode(options?: { frameIndex?: number }): Promise<ImageDecodeResult>;
  close(): void;
}

interface ImageDecoderConstructor {
  new (init: { data: BufferSource; type: string }): NativeImageDecoder;
  isTypeSupported(type: string): Promise<boolean>;
}

const GIF_MIME_TYPE = 'image/gif';

function nativeImageDecoder(): ImageDecoderConstructor | undefined {
  if (!('ImageDecoder' in globalThis)) return undefined;

  // SAFETY: the dom lib has no `ImageDecoder` typing; the global is read through the WebCodecs shape used here.
  return (globalThis as { ImageDecoder?: ImageDecoderConstructor }).ImageDecoder;
}

export async function isImageDecoderSupported(): Promise<boolean> {
  const ImageDecoder = nativeImageDecoder();
  if (!ImageDecoder) return false;

  try {
    return await ImageDecoder.isTypeSupported(GIF_MIME_TYPE);
  } catch {
    return false;
  }
}

/**
 * WebCodecs backend for `GifFrameSource`. The browser's decoder owns frame disposal and compositing, and frames
 * re-decode on demand during playback instead of living in memory as RGBA for the life of the media. Only the timing
 * table is walked up front, closing each frame as its duration is collected, since durations surface per decoded
 * frame.
 */
export async function createImageDecoderSource(buffer: ArrayBuffer): Promise<GifFrameSource> {
  const ImageDecoder = nativeImageDecoder();
  if (!ImageDecoder) throw new Error('ImageDecoder is not available.');

  const decoder = new ImageDecoder({ data: buffer, type: GIF_MIME_TYPE });

  try {
    await decoder.tracks.ready;
    await decoder.completed;

    const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
    if (frameCount === 0) throw new Error('GIF contains no frames.');

    const delays: number[] = [];
    let width = 0;
    let height = 0;

    for (let i = 0; i < frameCount; i++) {
      const { image } = await decoder.decode({ frameIndex: i });

      if (i === 0) {
        width = image.displayWidth;
        height = image.displayHeight;
      }

      // VideoFrame durations are in microseconds.
      delays.push(normalizeFrameDelay((image.duration ?? 0) / 1000));
      image.close();
    }

    return new ImageDecoderSource(decoder, width, height, delays);
  } catch (cause) {
    decoder.close();
    throw cause;
  }
}

class ImageDecoderSource implements GifFrameSource {
  readonly width: number;
  readonly height: number;
  readonly delays: readonly number[];

  #decoder: NativeImageDecoder;
  /** Monotonic draw ticket; a decode that is no longer the newest is discarded. */
  #drawSeq = 0;

  constructor(decoder: NativeImageDecoder, width: number, height: number, delays: readonly number[]) {
    this.#decoder = decoder;
    this.width = width;
    this.height = height;
    this.delays = delays;
  }

  get frameCount(): number {
    return this.delays.length;
  }

  async drawFrame(ctx: CanvasRenderingContext2D, index: number): Promise<void> {
    const seq = ++this.#drawSeq;
    let image: VideoFrame;

    try {
      ({ image } = await this.#decoder.decode({ frameIndex: index }));
    } catch {
      // The decoder was closed mid-flight or the frame failed; skip the paint.
      return;
    }

    if (seq !== this.#drawSeq) {
      image.close();
      return;
    }

    // Decoded frames carry the GIF's transparency, so clear before painting.
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.drawImage(image, 0, 0);
    image.close();
  }

  destroy(): void {
    this.#drawSeq += 1;

    try {
      this.#decoder.close();
    } catch {
      // Already closed.
    }
  }
}
