import { isMediaVolumeCapable, MediaError } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GifAdapter } from '../usecases/gif-video';
import { BLUE, encodeGif, GREEN, RED, WHITE } from './helpers/encode-gif';

const FRAME_COUNT = 4;
const FRAME_DELAY_MS = 100;
const SRC = 'https://example.com/animated.gif';

/** A 2x2 GIF with four solid frames, each `FRAME_DELAY_MS` long. */
function makeGif(delayHundredths = FRAME_DELAY_MS / 10, frameCount = FRAME_COUNT): Uint8Array<ArrayBuffer> {
  return encodeGif({
    width: 2,
    height: 2,
    colorTable: [...RED, ...GREEN, ...BLUE, ...WHITE],
    frames: Array.from({ length: frameCount }, (_, i) => ({
      width: 2,
      height: 2,
      indices: [i % 4, i % 4, i % 4, i % 4],
      delay: delayHundredths,
    })),
  });
}

function stubFetch(bytes: Uint8Array<ArrayBuffer> | (() => Promise<Response>) = makeGif()) {
  const fetchMock = vi.fn(
    bytes instanceof Uint8Array
      ? async () => new Response(bytes, { status: 200, headers: { 'content-type': 'image/gif' } })
      : bytes
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** Flush the microtasks a load's fetch/decode chain awaits. */
async function flush(): Promise<void> {
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 10; i++) await Promise.resolve();

    await vi.dynamicImportSettled();
  }
}

async function createLoadedMedia(): Promise<GifAdapter> {
  const media = new GifAdapter();

  media.src = SRC;
  await flush();

  return media;
}

function recordEvents(media: GifAdapter, types: string[]): string[] {
  const seen: string[] = [];

  for (const type of types) {
    media.addEventListener(type, () => seen.push(type));
  }

  return seen;
}

/** A stand-in for `<canvas>`: an event target that hands out a 2D context, which is all `attach()` looks for. */
function fakeCanvas(ctx: Partial<CanvasRenderingContext2D> | null = { putImageData: vi.fn() }) {
  return Object.assign(new EventTarget(), { width: 0, height: 0, getContext: vi.fn(() => ctx) });
}

class FakeImageData {
  constructor(
    readonly data: Uint8ClampedArray,
    readonly width: number,
    readonly height: number
  ) {}
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('ImageData', FakeImageData);
  stubFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('GifAdapter', () => {
  it('starts with default props and no metadata', () => {
    const media = new GifAdapter();

    expect(media.src).toBe(GifAdapter.defaultProps.src);
    expect(media.paused).toBe(true);
    expect(media.duration).toBeNaN();
    expect(media.readyState).toBe(0);
    expect(media.videoWidth).toBe(0);
    expect(media.videoHeight).toBe(0);
    expect(media.buffered.length).toBe(0);
    expect(media.frameCount).toBe(0);
  });

  it('has no volume surface, so volume UI reads it as unavailable', () => {
    expect(isMediaVolumeCapable(new GifAdapter())).toBe(false);
  });

  it('reports GIF sources as playable via canPlayType', () => {
    const media = new GifAdapter();

    expect(media.canPlayType('image/gif')).toBe('probably');
    expect(media.canPlayType('image/GIF; something')).toBe('probably');
    expect(media.canPlayType('video/mp4')).toBe('');
    expect(media.canPlayType('image/gifv')).toBe('');
  });

  it('loads metadata when a source is set', async () => {
    const media = new GifAdapter();
    const seen = recordEvents(media, [
      'loadstart',
      'durationchange',
      'loadedmetadata',
      'loadeddata',
      'canplay',
      'canplaythrough',
    ]);

    media.src = SRC;
    await flush();

    expect(seen).toEqual(['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']);
    expect(media.duration).toBeCloseTo((FRAME_COUNT * FRAME_DELAY_MS) / 1000);
    expect(media.readyState).toBe(4);
    expect(media.videoWidth).toBe(2);
    expect(media.videoHeight).toBe(2);
    expect(media.frameCount).toBe(FRAME_COUNT);
    expect(media.currentSrc).toBe(SRC);
  });

  it('reports the full range as buffered and seekable once loaded', async () => {
    const media = await createLoadedMedia();

    expect(media.buffered.length).toBe(1);
    expect(media.buffered.start(0)).toBe(0);
    expect(media.buffered.end(0)).toBeCloseTo(0.4);
    expect(media.seekable.end(0)).toBeCloseTo(0.4);
  });

  it('does not fetch until playback with preload none', async () => {
    const fetchMock = stubFetch();
    const media = new GifAdapter();

    media.preload = 'none';
    media.src = SRC;
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();

    const playing = media.play();

    await flush();
    await playing;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(media.paused).toBe(false);
  });

  it('plays through frames and ends without loop', async () => {
    const media = await createLoadedMedia();
    const seen = recordEvents(media, ['play', 'playing', 'ended']);

    await media.play();
    expect(seen).toEqual(['play', 'playing']);
    expect(media.paused).toBe(false);

    vi.advanceTimersByTime(FRAME_COUNT * FRAME_DELAY_MS + 10);

    expect(seen).toEqual(['play', 'playing', 'ended']);
    expect(media.ended).toBe(true);
    // Natural end pauses without a `pause` event, like native media.
    expect(media.paused).toBe(true);
    expect(media.currentTime).toBeCloseTo(media.duration);
    expect(media.currentFrame).toBe(FRAME_COUNT - 1);
  });

  it('wraps around instead of ending when loop is on', async () => {
    const media = await createLoadedMedia();

    media.loop = true;
    await media.play();

    vi.advanceTimersByTime(FRAME_COUNT * FRAME_DELAY_MS + FRAME_DELAY_MS / 2);

    expect(media.ended).toBe(false);
    expect(media.paused).toBe(false);
    expect(media.currentTime).toBeLessThan(media.duration);
  });

  it('restarts from the beginning when played after ending', async () => {
    const media = await createLoadedMedia();

    await media.play();
    vi.advanceTimersByTime(FRAME_COUNT * FRAME_DELAY_MS + 10);
    expect(media.ended).toBe(true);

    await media.play();
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBeLessThan(media.duration);
  });

  it('pauses and resumes at the same position', async () => {
    const media = await createLoadedMedia();
    const seen = recordEvents(media, ['pause']);

    await media.play();

    vi.advanceTimersByTime(FRAME_DELAY_MS * 2);
    media.pause();

    expect(seen).toEqual(['pause']);
    expect(media.paused).toBe(true);

    const pausedAt = media.currentTime;

    expect(pausedAt).toBeCloseTo(0.2, 1);

    vi.advanceTimersByTime(FRAME_DELAY_MS * 2);
    expect(media.currentTime).toBe(pausedAt);
  });

  it('seeks to a time and dispatches seeking and seeked', async () => {
    const media = await createLoadedMedia();
    const seen = recordEvents(media, ['seeking', 'seeked', 'timeupdate']);

    media.currentTime = 0.25;

    expect(seen).toEqual(['seeking', 'seeked', 'timeupdate']);
    expect(media.currentTime).toBeCloseTo(0.25);
    expect(media.currentFrame).toBe(2);
    expect(media.seeking).toBe(false);
  });

  it('clamps seeks to the seekable range', async () => {
    const media = await createLoadedMedia();

    media.currentTime = 99;
    expect(media.currentTime).toBeCloseTo(media.duration);
    media.currentTime = -5;
    expect(media.currentTime).toBe(0);
  });

  it('applies a seek set before metadata once frames arrive', async () => {
    const media = new GifAdapter();

    media.currentTime = 0.25;
    expect(media.currentTime).toBe(0.25);

    media.src = SRC;
    await flush();

    expect(media.currentTime).toBeCloseTo(0.25);
  });

  it('scales frame timing by playbackRate', async () => {
    const media = await createLoadedMedia();
    const seen = recordEvents(media, ['ratechange']);

    media.playbackRate = 2;
    expect(seen).toEqual(['ratechange']);

    await media.play();
    // At 2x, the 400ms of frames elapse in 200ms of wall clock.
    vi.advanceTimersByTime(FRAME_COUNT * (FRAME_DELAY_MS / 2) + 10);
    expect(media.ended).toBe(true);
  });

  it('rejects play() without a source', async () => {
    const media = new GifAdapter();

    await expect(media.play()).rejects.toMatchObject({ name: 'NotSupportedError' });
  });

  it('reports a network MediaError when the fetch fails', async () => {
    stubFetch(async () => {
      throw new Error('offline');
    });

    const media = new GifAdapter();
    const seen = recordEvents(media, ['error']);

    media.src = SRC;
    await flush();

    expect(seen).toEqual(['error']);
    expect(media.error).toMatchObject({ code: MediaError.MEDIA_ERR_NETWORK });
    expect(media.readyState).toBe(0);
  });

  it('reports a network MediaError on an HTTP error status', async () => {
    stubFetch(async () => new Response('nope', { status: 404 }));

    const media = new GifAdapter();

    media.src = SRC;
    await flush();

    expect(media.error).toMatchObject({ code: MediaError.MEDIA_ERR_NETWORK });
  });

  it('reports a decode MediaError when the bytes are not a GIF', async () => {
    stubFetch(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]));

    const media = new GifAdapter();
    const seen = recordEvents(media, ['error']);

    media.src = SRC;
    await flush();

    expect(seen).toEqual(['error']);
    expect(media.error).toMatchObject({ code: MediaError.MEDIA_ERR_DECODE });
  });

  it('rejects play() when loading fails', async () => {
    stubFetch(async () => {
      throw new Error('offline');
    });

    const media = new GifAdapter();

    media.preload = 'none';
    media.src = SRC;
    await flush();

    const playing = media.play();

    playing.catch(() => {});
    await flush();
    await expect(playing).rejects.toMatchObject({ name: 'NotSupportedError' });
  });

  it('empties state when the source is replaced', async () => {
    const media = await createLoadedMedia();
    const seen = recordEvents(media, ['emptied']);

    await media.play();
    vi.advanceTimersByTime(FRAME_DELAY_MS);

    media.src = '';
    await flush();

    expect(seen).toEqual(['emptied']);
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    expect(media.paused).toBe(true);
    expect(media.readyState).toBe(0);
    expect(media.currentSrc).toBe('');
  });

  it('starts playback once loaded when autoplay is set', async () => {
    const media = new GifAdapter();

    media.autoplay = true;
    media.src = SRC;
    await flush();

    expect(media.paused).toBe(false);
  });

  it('sizes an attached canvas to the GIF dimensions and paints the current frame', async () => {
    const media = await createLoadedMedia();
    const ctx: Pick<CanvasRenderingContext2D, 'putImageData'> = { putImageData: vi.fn() };
    const canvas = fakeCanvas(ctx);

    media.attach(canvas);

    expect(canvas.width).toBe(2);
    expect(canvas.height).toBe(2);
    expect(media.target).toBe(canvas);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    media.detach();
    expect(media.target).toBeNull();
  });

  it('ignores a target that is not a canvas', async () => {
    const media = await createLoadedMedia();

    media.attach(new EventTarget());
    expect(media.target).toBeNull();
  });

  it('keeps playing without a 2D context', async () => {
    const media = await createLoadedMedia();

    media.attach(fakeCanvas(null));
    await media.play();
    vi.advanceTimersByTime(FRAME_DELAY_MS * 2 + 10);

    expect(media.currentFrame).toBe(2);
  });

  it('seeks to a frame by index and announces painted frames', async () => {
    const media = await createLoadedMedia();
    const frames: number[] = [];

    media.attach(fakeCanvas());
    media.addEventListener('framechange', () => frames.push(media.currentFrame));

    media.seekToFrame(2);
    expect(media.currentFrame).toBe(2);
    expect(media.currentTime).toBeCloseTo(0.2);

    media.seekToFrame(99);
    expect(media.currentFrame).toBe(FRAME_COUNT - 1);

    media.seekToFrame(-1);
    expect(media.currentFrame).toBe(0);
    expect(frames).toEqual([2, FRAME_COUNT - 1, 0]);
  });

  it('normalizes near-zero frame delays the way browsers do', async () => {
    stubFetch(makeGif(0, 2));

    const media = await createLoadedMedia();

    // Two zero-delay frames snap to 100ms each.
    expect(media.duration).toBeCloseTo(0.2);
  });

  it('tracks played ranges while playing', async () => {
    const media = await createLoadedMedia();

    await media.play();
    vi.advanceTimersByTime(FRAME_DELAY_MS * 3);
    media.pause();

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBeGreaterThan(0);
  });

  it('stops the clock and releases the source on destroy', async () => {
    const media = await createLoadedMedia();

    await media.play();
    media.destroy();
    vi.advanceTimersByTime(FRAME_COUNT * FRAME_DELAY_MS + 10);

    expect(media.ended).toBe(false);
    expect(media.target).toBeNull();
  });

  describe('with WebCodecs ImageDecoder available', () => {
    function makeVideoFrame(durationUs: number) {
      return {
        displayWidth: 2,
        displayHeight: 2,
        duration: durationUs,
        close: vi.fn(),
      };
    }

    let decodeSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      decodeSpy = vi.fn(async () => ({ image: makeVideoFrame(FRAME_DELAY_MS * 1000) }));

      class FakeImageDecoder {
        static isTypeSupported = vi.fn(async (type: string) => type === 'image/gif');
        tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: FRAME_COUNT } };
        completed = Promise.resolve();
        decode = decodeSpy;
        close = vi.fn();
      }

      vi.stubGlobal('ImageDecoder', FakeImageDecoder);
      // The bytes never reach the JS decoder on this path, so anything will do.
      stubFetch(new Uint8Array(8));
    });

    it('prefers the native decoder over the JS decoder', async () => {
      const media = await createLoadedMedia();

      expect(media.duration).toBeCloseTo((FRAME_COUNT * FRAME_DELAY_MS) / 1000);
      expect(media.videoWidth).toBe(2);
      expect(media.videoHeight).toBe(2);
      expect(media.error).toBeNull();
      expect(decodeSpy).toHaveBeenCalledTimes(FRAME_COUNT);
    });

    it('plays through frames and ends on the native path', async () => {
      const media = await createLoadedMedia();
      const seen = recordEvents(media, ['ended']);

      await media.play();
      vi.advanceTimersByTime(FRAME_COUNT * FRAME_DELAY_MS + 10);

      expect(seen).toEqual(['ended']);
      expect(media.ended).toBe(true);
    });

    it('paints decoded frames onto the attached canvas', async () => {
      const media = await createLoadedMedia();
      const ctx: Pick<CanvasRenderingContext2D, 'clearRect' | 'drawImage'> = { clearRect: vi.fn(), drawImage: vi.fn() };

      media.attach(fakeCanvas(ctx));
      await flush();

      expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    });
  });
});
