import { describe, expect, it, vi } from 'vite-plus/test';

import { DecodedGifSource, GifDisposal, parseGif } from '../usecases/gif-video';
import { BLUE, commentExtension, encodeGif, GREEN, pixelAt, RED, WHITE } from './helpers/encode-gif';

const PALETTE = [...RED, ...GREEN, ...BLUE, ...WHITE];
const TRANSPARENT = [0, 0, 0, 0];
const opaque = (rgb: number[]) => [...rgb, 255];

describe('parseGif', () => {
  it('reads the logical screen, frame geometry, timing, and loop count', () => {
    const gif = parseGif(
      encodeGif({
        width: 4,
        height: 3,
        colorTable: PALETTE,
        loopCount: 0,
        frames: [
          { width: 4, height: 3, indices: Array(12).fill(0), delay: 10, disposal: GifDisposal.leave },
          { width: 2, height: 1, left: 1, top: 1, indices: [2, 2], delay: 25, disposal: GifDisposal.restoreBackground },
        ],
      })
    );

    expect(gif.width).toBe(4);
    expect(gif.height).toBe(3);
    expect(gif.loopCount).toBe(0);
    expect(gif.frames).toHaveLength(2);
    expect(gif.frames[0]).toMatchObject({ left: 0, top: 0, width: 4, height: 3, delayMs: 100, transparentIndex: -1 });
    expect(gif.frames[1]).toMatchObject({ left: 1, top: 1, width: 2, height: 1, delayMs: 250 });
    expect(gif.frames[1]!.disposal).toBe(GifDisposal.restoreBackground);
    expect([...gif.frames[1]!.indices]).toEqual([2, 2]);
  });

  it('decodes LZW runs that grow the code size and reset the table', () => {
    // 64x64 of a repeating pattern pushes the dictionary through several code-size bumps.
    const width = 64;
    const height = 64;
    const indices = Array.from({ length: width * height }, (_, i) => (i * 7 + Math.floor(i / width)) % 4);
    const gif = parseGif(encodeGif({ width, height, colorTable: PALETTE, frames: [{ width, height, indices }] }));

    expect([...gif.frames[0]!.indices]).toEqual(indices);
  });

  it('puts interlaced rows back in scan order', () => {
    const width = 1;
    const height = 10;
    const indices = Array.from({ length: height }, (_, row) => row % 4);
    const gif = parseGif(
      encodeGif({ width, height, colorTable: PALETTE, frames: [{ width, height, indices, interlaced: true }] })
    );

    expect([...gif.frames[0]!.indices]).toEqual(indices);
  });

  it('prefers a local color table and records the transparent index', () => {
    const gif = parseGif(
      encodeGif({
        width: 1,
        height: 1,
        colorTable: PALETTE,
        frames: [{ width: 1, height: 1, indices: [1], colorTable: [...WHITE, ...BLUE], transparentIndex: 1 }],
      })
    );

    expect([...gif.frames[0]!.colorTable]).toEqual([...WHITE, ...BLUE]);
    expect(gif.frames[0]!.transparentIndex).toBe(1);
  });

  it('skips extension blocks it does not understand and tolerates a frame without graphic control', () => {
    const gif = parseGif(
      encodeGif({
        width: 1,
        height: 1,
        colorTable: PALETTE,
        extraExtensions: [commentExtension('made by a test')],
        frames: [{ width: 1, height: 1, indices: [3], noGraphicControl: true }],
      })
    );

    expect(gif.frames).toHaveLength(1);
    expect(gif.frames[0]).toMatchObject({ delayMs: 0, disposal: GifDisposal.unspecified, transparentIndex: -1 });
    expect(gif.loopCount).toBeUndefined();
  });

  it('rejects data that is not a GIF or has no frames', () => {
    expect(() => parseGif(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrow('Not a GIF file.');

    const empty = encodeGif({ width: 1, height: 1, colorTable: PALETTE, frames: [] });

    expect(() => parseGif(empty)).toThrow('no frames');
  });

  it('rejects a file that ends mid-structure', () => {
    const whole = encodeGif({
      width: 2,
      height: 2,
      colorTable: PALETTE,
      frames: [{ width: 2, height: 2, indices: [0, 1, 2, 3] }],
    });

    expect(() => parseGif(whole.subarray(0, whole.length - 6))).toThrow('Unexpected end of GIF data.');
  });
});

describe('DecodedGifSource', () => {
  function sourceFor(frames: Parameters<typeof encodeGif>[0]['frames'], width = 2, height = 2) {
    return new DecodedGifSource(parseGif(encodeGif({ width, height, colorTable: PALETTE, frames })));
  }

  it('normalizes delays the way browsers render them', () => {
    const source = sourceFor([
      { width: 2, height: 2, indices: [0, 0, 0, 0], delay: 0 },
      { width: 2, height: 2, indices: [0, 0, 0, 0], delay: 1 },
      { width: 2, height: 2, indices: [0, 0, 0, 0], delay: 2 },
      { width: 2, height: 2, indices: [0, 0, 0, 0], delay: 30 },
    ]);

    // 0 and 1 hundredths snap to 100ms; 2 hundredths is a real 20ms and stays.
    expect(source.delays).toEqual([100, 100, 20, 300]);
    expect(source.frameCount).toBe(4);
  });

  it('paints palette colors and leaves transparent pixels untouched', () => {
    const source = sourceFor([
      { width: 2, height: 2, indices: [0, 1, 2, 3] },
      // A patch at (1, 1) whose other pixel is transparent, so only one pixel changes.
      { width: 2, height: 1, left: 0, top: 1, indices: [1, 1], transparentIndex: 1, colorTable: [...WHITE, ...GREEN] },
    ]);

    const first = source.pixelsAt(0);

    expect(pixelAt(first, 2, 0, 0)).toEqual(opaque(RED));
    expect(pixelAt(first, 2, 1, 0)).toEqual(opaque(GREEN));
    expect(pixelAt(first, 2, 0, 1)).toEqual(opaque(BLUE));
    expect(pixelAt(first, 2, 1, 1)).toEqual(opaque(WHITE));

    const second = source.pixelsAt(1);

    // Transparent index 1 in the local table skips both pixels of the patch: the row keeps frame 0's colors.
    expect(pixelAt(second, 2, 0, 1)).toEqual(opaque(BLUE));
    expect(pixelAt(second, 2, 1, 1)).toEqual(opaque(WHITE));
  });

  it('clears a frame rectangle to transparent on restore-to-background disposal', () => {
    const source = sourceFor([
      { width: 2, height: 2, indices: [0, 0, 0, 0] },
      { width: 1, height: 1, left: 1, top: 0, indices: [2], disposal: GifDisposal.restoreBackground },
      { width: 1, height: 1, left: 0, top: 1, indices: [1] },
    ]);

    expect(pixelAt(source.pixelsAt(1), 2, 1, 0)).toEqual(opaque(BLUE));

    const third = source.pixelsAt(2);

    expect(pixelAt(third, 2, 1, 0)).toEqual(TRANSPARENT);
    expect(pixelAt(third, 2, 0, 0)).toEqual(opaque(RED));
    expect(pixelAt(third, 2, 0, 1)).toEqual(opaque(GREEN));
  });

  it('puts the previous canvas back on restore-previous disposal', () => {
    const source = sourceFor([
      { width: 2, height: 2, indices: [0, 0, 0, 0] },
      { width: 2, height: 2, indices: [2, 2, 2, 2], disposal: GifDisposal.restorePrevious },
      { width: 1, height: 1, indices: [1] },
    ]);

    expect(pixelAt(source.pixelsAt(1), 2, 1, 1)).toEqual(opaque(BLUE));

    const third = source.pixelsAt(2);

    expect(pixelAt(third, 2, 0, 0)).toEqual(opaque(GREEN));
    expect(pixelAt(third, 2, 1, 1)).toEqual(opaque(RED));
  });

  it('replays from the first frame on a backward seek', () => {
    const source = sourceFor([
      { width: 2, height: 2, indices: [0, 0, 0, 0] },
      { width: 2, height: 2, indices: [1, 1, 1, 1] },
      { width: 2, height: 2, indices: [2, 2, 2, 2] },
    ]);

    expect(pixelAt(source.pixelsAt(2), 2, 0, 0)).toEqual(opaque(BLUE));
    expect(pixelAt(source.pixelsAt(0), 2, 0, 0)).toEqual(opaque(RED));
    expect(pixelAt(source.pixelsAt(1), 2, 0, 0)).toEqual(opaque(GREEN));
  });

  it('clips a frame that overruns the logical screen', () => {
    const source = sourceFor([{ width: 3, height: 3, left: 1, top: 1, indices: Array(9).fill(2) }]);
    const pixels = source.pixelsAt(0);

    expect(pixelAt(pixels, 2, 0, 0)).toEqual(TRANSPARENT);
    expect(pixelAt(pixels, 2, 1, 1)).toEqual(opaque(BLUE));
    expect(pixels).toHaveLength(2 * 2 * 4);
  });

  it('hands the composited pixels to the canvas as ImageData', () => {
    class FakeImageData {
      constructor(
        readonly data: Uint8ClampedArray,
        readonly width: number,
        readonly height: number
      ) {}
    }

    vi.stubGlobal('ImageData', FakeImageData);

    const source = sourceFor([{ width: 2, height: 2, indices: [0, 1, 2, 3] }]);
    const painted: ImageData[] = [];
    const ctx: Pick<CanvasRenderingContext2D, 'putImageData'> = {
      putImageData: (image: ImageData, x: number, y: number) => {
        expect([x, y]).toEqual([0, 0]);
        painted.push(image);
      },
    };

    // SAFETY: the source calls `putImageData` and nothing else on the context.
    source.drawFrame(ctx as CanvasRenderingContext2D, 0);

    expect(painted).toHaveLength(1);
    expect(painted[0]).toMatchObject({ width: 2, height: 2 });
    expect(pixelAt(painted[0]!.data, 2, 1, 0)).toEqual(opaque(GREEN));
    vi.unstubAllGlobals();
  });
});
