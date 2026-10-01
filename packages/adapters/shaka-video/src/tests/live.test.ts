import { HTMLVideoAdapter } from '@videojs/media/dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ShakaLiveMixin } from '../live';

function createEngine({ live = false, inProgress = false, maxSegmentDuration = 2, seekEnd = 100 } = {}) {
  const listeners = new Map<string, Set<(event: unknown) => void>>();

  const engine = {
    live,
    inProgress,
    maxSegmentDuration,
    seekEnd,
    loaded: false,
    isLive: vi.fn(() => engine.live),
    isInProgress: vi.fn(() => engine.inProgress),
    getStats: vi.fn(() => ({ maxSegmentDuration: engine.loaded ? engine.maxSegmentDuration : Number.NaN })),
    seekRange: vi.fn(() => ({ start: 0, end: engine.seekEnd })),
    addEventListener(type: string, listener: (event: unknown) => void) {
      const typeListeners = listeners.get(type) ?? new Set();

      typeListeners.add(listener);
      listeners.set(type, typeListeners);
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      listeners.get(type)?.delete(listener);
    },
    emit(type: string) {
      if (type === 'loading' || type === 'unloading') engine.loaded = false;

      if (type === 'loaded') engine.loaded = true;

      for (const listener of [...(listeners.get(type) ?? [])]) listener({ type });
    },
  };

  return engine;
}

class FakeHost extends HTMLVideoAdapter {
  engine: ReturnType<typeof createEngine> | null;

  constructor(engine: ReturnType<typeof createEngine> | null = null) {
    super();
    this.engine = engine;
  }
}

const ShakaLive = ShakaLiveMixin(FakeHost as any) as unknown as new (
  engine?: ReturnType<typeof createEngine> | null
) => FakeHost & { readonly liveEdgeStart: number; readonly targetLiveWindow: number };

function setupWithTarget(engine: ReturnType<typeof createEngine>) {
  const video = document.createElement('video');

  document.body.appendChild(video);
  const media = new ShakaLive(engine);

  media.attach(video);
  return { media, video };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ShakaLiveMixin', () => {
  it('has no live window before anything loads', () => {
    const media = new ShakaLive(createEngine());

    expect(media.targetLiveWindow).toBeNaN();
    expect(media.liveEdgeStart).toBeNaN();
  });

  it('stays without a live window for on-demand loads', () => {
    const engine = createEngine();
    const media = new ShakaLive(engine);

    engine.emit('loaded');

    expect(media.targetLiveWindow).toBeNaN();
    expect(media.liveEdgeStart).toBeNaN();
  });

  it('derives a sliding window and the live edge for live loads', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const media = new ShakaLive(engine);
    const onChange = vi.fn();

    media.addEventListener('targetlivewindowchange', onChange);

    engine.emit('manifestparsed');

    expect(media.targetLiveWindow).toBe(0);
    expect(media.liveEdgeStart).toBeNaN();
    expect(onChange).toHaveBeenCalledOnce();

    engine.emit('loaded');

    expect(media.targetLiveWindow).toBe(0);
    expect(media.liveEdgeStart).toBe(94);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('treats an in-progress recording as a growing window', () => {
    const engine = createEngine({ live: false, inProgress: true });
    const media = new ShakaLive(engine);

    engine.emit('manifestparsed');

    expect(media.targetLiveWindow).toBe(Number.POSITIVE_INFINITY);
  });

  it('reads the live edge off the current seek range', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const media = new ShakaLive(engine);

    engine.emit('manifestparsed');
    engine.emit('loaded');
    expect(media.liveEdgeStart).toBe(94);

    engine.seekEnd = 160;

    expect(media.liveEdgeStart).toBe(154);
  });

  it('resets when a new load starts', () => {
    const engine = createEngine({ live: true });
    const media = new ShakaLive(engine);

    engine.emit('manifestparsed');
    engine.emit('loaded');

    expect(media.targetLiveWindow).toBe(0);
    expect(media.liveEdgeStart).toBe(94);

    engine.emit('loading');

    expect(media.targetLiveWindow).toBeNaN();
    expect(media.liveEdgeStart).toBeNaN();
  });

  it('seeks a paused target to the live edge on the first play', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const { video } = setupWithTarget(engine);

    engine.emit('loading');
    engine.emit('loaded');

    video.dispatchEvent(new Event('play'));

    expect(video.currentTime).toBe(94);
  });

  it('seeks to the live edge when the first play starts the load', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const { video } = setupWithTarget(engine);

    // A deferred load (`preload: 'none'`): the first play is what starts it.
    video.dispatchEvent(new Event('play'));
    engine.emit('loading');
    engine.emit('loaded');

    expect(video.currentTime).toBe(94);
  });

  it('waits for the manifest when play comes first', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const { video } = setupWithTarget(engine);

    engine.emit('loading');

    video.dispatchEvent(new Event('play'));
    expect(video.currentTime).toBe(0);

    engine.emit('loaded');
    expect(video.currentTime).toBe(94);
  });

  it('never rewinds a target already past the edge', () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const { video } = setupWithTarget(engine);

    engine.emit('loading');
    engine.emit('loaded');
    video.currentTime = 200;

    video.dispatchEvent(new Event('play'));

    expect(video.currentTime).toBe(200);
  });

  it("leaves autoplay targets to shaka's own edge positioning", () => {
    const engine = createEngine({ live: true, maxSegmentDuration: 2, seekEnd: 100 });
    const video = document.createElement('video');

    video.autoplay = true;
    document.body.appendChild(video);
    const media = new ShakaLive(engine);

    media.attach(video);
    engine.emit('loaded');

    video.dispatchEvent(new Event('play'));

    expect(video.currentTime).toBe(0);
  });
});
