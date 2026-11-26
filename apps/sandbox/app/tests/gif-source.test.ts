import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createGifSource, type GifFrameSource, loadGif } from '../usecases/gif-video';
import { BLUE, encodeGif, GREEN, RED, WHITE } from './helpers/encode-gif';

const SRC = 'https://example.com/animated.gif';

function fakeFrames(delays: number[], width = 4, height = 3): GifFrameSource & { destroyed: boolean } {
  return {
    width,
    height,
    frameCount: delays.length,
    delays,
    destroyed: false,
    drawFrame: vi.fn(),
    destroy() {
      this.destroyed = true;
    },
  };
}

function makeGif(): Uint8Array<ArrayBuffer> {
  return encodeGif({
    width: 2,
    height: 2,
    colorTable: [...RED, ...GREEN, ...BLUE, ...WHITE],
    frames: [0, 1, 2].map((i) => ({ width: 2, height: 2, indices: [i, i, i, i], delay: 10 })),
  });
}

describe('createGifSource', () => {
  it('lays frames out on a timeline from their delays', () => {
    const source = createGifSource(fakeFrames([100, 200, 50]));

    expect(source.frameCount).toBe(3);
    expect(source.duration).toBe(350);
    expect([0, 1, 2].map((i) => source.startOf(i))).toEqual([0, 100, 300]);
    expect([0, 1, 2].map((i) => source.delayOf(i))).toEqual([100, 200, 50]);
    expect(source.width).toBe(4);
    expect(source.height).toBe(3);
  });

  it('finds the frame on screen at a media time, clamped to the ends', () => {
    const source = createGifSource(fakeFrames([100, 200, 50]));

    expect(source.frameAt(0)).toBe(0);
    expect(source.frameAt(99)).toBe(0);
    expect(source.frameAt(100)).toBe(1);
    expect(source.frameAt(299)).toBe(1);
    expect(source.frameAt(300)).toBe(2);
    expect(source.frameAt(350)).toBe(2);
    expect(source.frameAt(9999)).toBe(2);
    expect(source.frameAt(-5)).toBe(0);
  });

  it('clamps frame lookups and paints through the decoder', () => {
    const frames = fakeFrames([100, 100]);
    const source = createGifSource(frames);
    // SAFETY: the fake decoder never touches the context.
    const ctx = {} as CanvasRenderingContext2D;

    expect(source.startOf(99)).toBe(100);
    expect(source.startOf(-1)).toBe(0);

    source.drawFrame(ctx, 7);
    expect(frames.drawFrame).toHaveBeenCalledWith(ctx, 1);

    source.destroy();
    expect(frames.destroyed).toBe(true);
  });
});

describe('loadGif', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(makeGif(), { status: 200 }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and decodes a GIF into a timed source', async () => {
    const source = await loadGif(SRC);

    expect(fetch).toHaveBeenCalledWith(SRC, { credentials: 'same-origin' });
    expect(source.frameCount).toBe(3);
    expect(source.duration).toBe(300);
    expect([source.width, source.height]).toEqual([2, 2]);
  });

  it('forwards the credentials mode', async () => {
    await loadGif(SRC, { credentials: 'include' });

    expect(fetch).toHaveBeenCalledWith(SRC, expect.objectContaining({ credentials: 'include' }));
  });

  it('reports a network failure when the fetch throws or the status is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    await expect(loadGif(SRC)).rejects.toMatchObject({ name: 'GifLoadError', kind: 'network' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 404 }))
    );
    await expect(loadGif(SRC)).rejects.toMatchObject({ kind: 'network', message: 'Failed to fetch GIF: HTTP 404' });
  });

  it('reports a decode failure when the bytes are not a GIF', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), { status: 200 }))
    );

    await expect(loadGif(SRC)).rejects.toMatchObject({ name: 'GifLoadError', kind: 'decode' });
  });

  it('rejects with the abort reason when aborted during the fetch', async () => {
    const controller = new AbortController();

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
          })
      )
    );

    const loading = loadGif(SRC, { signal: controller.signal });

    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('discards the decoded frames when aborted after the fetch', async () => {
    const controller = new AbortController();
    let release!: (response: Response) => void;

    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (release = resolve)))
    );

    const loading = loadGif(SRC, { signal: controller.signal });

    release(new Response(makeGif(), { status: 200 }));
    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('prefers the native decoder when it can read GIFs', async () => {
    const decode = vi.fn(async () => ({ image: { displayWidth: 2, displayHeight: 2, duration: 100_000, close() {} } }));

    class FakeImageDecoder {
      static isTypeSupported = vi.fn(async () => true);
      tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: 3 } };
      completed = Promise.resolve();
      decode = decode;
      close = vi.fn();
    }

    vi.stubGlobal('ImageDecoder', FakeImageDecoder);

    const source = await loadGif(SRC);

    expect(decode).toHaveBeenCalledTimes(3);
    expect(source.duration).toBe(300);
  });
});
