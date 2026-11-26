import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createImageDecoderSource, isImageDecoderSupported } from '../usecases/gif-video';

interface FakeFrame {
  displayWidth: number;
  displayHeight: number;
  duration: number;
  close: ReturnType<typeof vi.fn>;
}

const state = {
  frameCount: 3,
  durations: new Array<number>(),
  supported: true,
};

const createdFrames: FakeFrame[] = [];

function frameFor(index: number): FakeFrame {
  const frame = {
    displayWidth: 4,
    displayHeight: 3,
    duration: state.durations[index] ?? 100_000,
    close: vi.fn(),
  };

  createdFrames.push(frame);

  return frame;
}

class FakeImageDecoder {
  static last: FakeImageDecoder | null = null;
  static isTypeSupported = vi.fn(async () => state.supported);

  tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: state.frameCount } };
  completed = Promise.resolve();
  decode = vi.fn(async (options?: { frameIndex?: number }) => ({ image: frameFor(options?.frameIndex ?? 0) }));
  close = vi.fn();

  constructor() {
    FakeImageDecoder.last = this;
  }
}

function fakeContext() {
  const ctx: Pick<CanvasRenderingContext2D, 'clearRect' | 'drawImage'> = { clearRect: vi.fn(), drawImage: vi.fn() };

  return ctx;
}

/** The source takes the whole context type; the fake implements the two methods it calls. */
function asContext(ctx: ReturnType<typeof fakeContext>): CanvasRenderingContext2D {
  // SAFETY: `drawFrame` only clears and draws, which the fake provides.
  return ctx as CanvasRenderingContext2D;
}

beforeEach(() => {
  state.frameCount = 3;
  state.durations = [];
  state.supported = true;
  createdFrames.length = 0;
  FakeImageDecoder.last = null;
  vi.stubGlobal('ImageDecoder', FakeImageDecoder);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('isImageDecoderSupported', () => {
  it('reports false without an ImageDecoder global', async () => {
    vi.unstubAllGlobals();
    expect(await isImageDecoderSupported()).toBe(false);
  });

  it('reflects isTypeSupported for image/gif', async () => {
    expect(await isImageDecoderSupported()).toBe(true);
    state.supported = false;
    expect(await isImageDecoderSupported()).toBe(false);
  });

  it('reports false when isTypeSupported throws', async () => {
    FakeImageDecoder.isTypeSupported.mockRejectedValueOnce(new Error('nope'));
    expect(await isImageDecoderSupported()).toBe(false);
  });
});

describe('createImageDecoderSource', () => {
  it('reads dimensions and a normalized ms delay table, closing timing frames', async () => {
    // 50ms stays; 5ms and 0 snap to 100ms like browsers render them.
    state.durations = [50_000, 5_000, 0];

    const source = await createImageDecoderSource(new ArrayBuffer(8));

    expect(source.width).toBe(4);
    expect(source.height).toBe(3);
    expect(source.frameCount).toBe(3);
    expect(source.delays).toEqual([50, 100, 100]);

    for (const frame of createdFrames) {
      expect(frame.close).toHaveBeenCalled();
    }
  });

  it('throws and closes the decoder when the track has no frames', async () => {
    state.frameCount = 0;
    await expect(createImageDecoderSource(new ArrayBuffer(8))).rejects.toThrow('no frames');
    expect(FakeImageDecoder.last?.close).toHaveBeenCalled();
  });

  it('paints a decoded frame and closes it', async () => {
    const source = await createImageDecoderSource(new ArrayBuffer(8));
    const ctx = fakeContext();

    await source.drawFrame(asContext(ctx), 1);

    const painted = createdFrames[createdFrames.length - 1]!;

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 4, 3);
    expect(ctx.drawImage).toHaveBeenCalledWith(painted, 0, 0);
    expect(painted.close).toHaveBeenCalled();
  });

  it('discards a stale draw once a newer one has been requested', async () => {
    const source = await createImageDecoderSource(new ArrayBuffer(8));
    const decoder = FakeImageDecoder.last!;
    const ctx = fakeContext();
    const pending = new Map<number, (result: { image: FakeFrame }) => void>();

    decoder.decode.mockImplementation(
      (options?: { frameIndex?: number }) =>
        new Promise<{ image: FakeFrame }>((resolve) => pending.set(options?.frameIndex ?? 0, resolve))
    );

    const stale = source.drawFrame(asContext(ctx), 1);
    const fresh = source.drawFrame(asContext(ctx), 2);
    const freshFrame = frameFor(2);

    pending.get(2)!({ image: freshFrame });
    await fresh;
    expect(ctx.drawImage).toHaveBeenCalledWith(freshFrame, 0, 0);

    const staleFrame = frameFor(1);

    pending.get(1)!({ image: staleFrame });
    await stale;
    expect(staleFrame.close).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
  });

  it('skips the paint when a decode rejects', async () => {
    const source = await createImageDecoderSource(new ArrayBuffer(8));
    const decoder = FakeImageDecoder.last!;
    const ctx = fakeContext();

    decoder.decode.mockRejectedValueOnce(new Error('closed'));

    await expect(source.drawFrame(asContext(ctx), 1)).resolves.toBeUndefined();
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('closes the decoder on destroy', async () => {
    const source = await createImageDecoderSource(new ArrayBuffer(8));

    source.destroy();
    expect(FakeImageDecoder.last?.close).toHaveBeenCalled();
  });
});
