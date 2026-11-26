import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { frameFeature, isMediaFrameCapable } from '../usecases/features';
import { GifAdapter } from '../usecases/gif-video';
import { BLUE, encodeGif, GREEN, RED, WHITE } from './helpers/encode-gif';

const FRAME_COUNT = 4;
const SRC = 'https://example.com/animated.gif';

function makeGif(): Uint8Array<ArrayBuffer> {
  return encodeGif({
    width: 2,
    height: 2,
    colorTable: [...RED, ...GREEN, ...BLUE, ...WHITE],
    frames: Array.from({ length: FRAME_COUNT }, (_, i) => ({ width: 2, height: 2, indices: [i, i, i, i], delay: 10 })),
  });
}

async function flush(): Promise<void> {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}

async function createAttachedStore() {
  const media = new GifAdapter();
  const store = createStore<PlayerTarget>()(combine(frameFeature));

  store.attach({ media, container: null });
  media.src = SRC;
  await flush();

  return { media, store };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(makeGif(), { status: 200 }))
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('isMediaFrameCapable', () => {
  it('recognizes the frame surface', () => {
    expect(isMediaFrameCapable(new GifAdapter())).toBe(true);
    expect(isMediaFrameCapable(Object.assign(new EventTarget(), { play: async () => undefined }))).toBe(false);
  });
});

describe('frameFeature', () => {
  it('marks a media without frames unsupported', () => {
    const store = createStore<PlayerTarget>()(combine(frameFeature));

    expect(store.frameAvailability).toBe('unavailable');

    store.attach({ media: Object.assign(new EventTarget(), { play: async () => undefined }), container: null });

    expect(store.frameAvailability).toBe('unsupported');
    expect(store.frameCount).toBe(0);
    expect(() => store.stepFrame(1)).not.toThrow();
  });

  it('reads the frame table once the media loads', async () => {
    const { store } = await createAttachedStore();

    expect([store.frameAvailability, store.frameCount, store.currentFrame]).toEqual(['available', FRAME_COUNT, 0]);
  });

  it('follows the frame on screen as playback advances', async () => {
    const { media, store } = await createAttachedStore();

    await media.play();
    vi.advanceTimersByTime(100 * 2 + 10);

    expect(store.currentFrame).toBe(2);
  });

  it('steps frames while pausing, clamped to the media', async () => {
    const { media, store } = await createAttachedStore();

    await media.play();
    store.stepFrame(1);

    expect(media.paused).toBe(true);
    expect(store.currentFrame).toBe(1);
    expect(media.currentTime).toBeCloseTo(0.1);

    store.stepFrame(-5);
    expect(store.currentFrame).toBe(0);

    store.stepFrame(99);
    expect(store.currentFrame).toBe(FRAME_COUNT - 1);
  });

  it('seeks to a frame while pausing', async () => {
    const { media, store } = await createAttachedStore();

    await media.play();
    store.seekToFrame(2);

    expect(media.paused).toBe(true);
    expect(store.currentFrame).toBe(2);

    store.seekToFrame(0);
    expect(store.currentFrame).toBe(0);
  });

  it('empties when the source goes away', async () => {
    const { media, store } = await createAttachedStore();

    media.src = '';
    await flush();

    expect(store.frameCount).toBe(0);
    expect(store.currentFrame).toBe(0);
  });
});
