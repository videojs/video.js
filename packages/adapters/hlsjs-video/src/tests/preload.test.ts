import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsPreloadMixin } from '../preload';

function createEngine(): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    config: {
      maxBufferLength: 30,
      maxBufferSize: 60_000_000,
    },
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: any[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      for (const fn of listeners.get(event) ?? []) fn(event, ...args);
    },
    startLoad: vi.fn(),
    resumeBuffering: vi.fn(),
    media: null,
  } as unknown as Hls;
}

class FakeHost extends HTMLVideoAdapter {
  engine: Hls | null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }

  // Re-expose the now-protected `target` for test assertions.
  override get target(): HTMLVideoElement | null {
    return super.target as HTMLVideoElement | null;
  }
}

const PreloadHost = HlsJsPreloadMixin(FakeHost);

describe('HlsJsPreloadMixin', () => {
  it('defaults preload to metadata', () => {
    const host = new PreloadHost(null);

    expect(host.preload).toBe('metadata');
  });

  it('syncs stored preload to native element on MEDIA_ATTACHED', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'none';
    expect(host.target).toBeNull();

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(video.preload).toBe('none');
  });

  it('applies preload set before attach when MEDIA_ATTACHED fires', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'auto';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(engine.startLoad).toHaveBeenCalled();
    expect(video.preload).toBe('auto');
  });

  it('starts metadata-level load for preload=metadata', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'metadata';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(engine.startLoad).toHaveBeenCalled();
    expect(engine.config.maxBufferLength).toBe(1);
    expect(engine.config.maxBufferSize).toBe(1);
  });

  it('raises buffer limits in place on play when preload=metadata', () => {
    // A second `startLoad()` would abort the in-flight segment and leave hls.js
    // cancelling and re-requesting on every tick, forever. See #1979.
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'metadata';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    (engine.startLoad as ReturnType<typeof vi.fn>).mockClear();

    video.dispatchEvent(new Event('play'));

    expect(engine.startLoad).not.toHaveBeenCalled();
    expect(engine.resumeBuffering).toHaveBeenCalled();
    expect(engine.config.maxBufferLength).toBe(30);
    expect(engine.config.maxBufferSize).toBe(60_000_000);
  });

  it('starts loading on play when preload=none', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'none';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(engine.startLoad).not.toHaveBeenCalled();

    video.dispatchEvent(new Event('play'));

    expect(engine.startLoad).toHaveBeenCalledTimes(1);
    expect(engine.config.maxBufferLength).toBe(30);
    expect(engine.config.maxBufferSize).toBe(60_000_000);
  });

  it('starts loading once across repeated engine events', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'metadata';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MANIFEST_LOADING);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(engine.startLoad).toHaveBeenCalledTimes(1);
    expect(engine.config.maxBufferLength).toBe(1);
  });

  it('starts loading again for a new source', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'metadata';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
    (engine.startLoad as ReturnType<typeof vi.fn>).mockClear();

    // `loadSource()` stops loading before announcing the manifest.
    (engine as any).emit(Hls.Events.MANIFEST_LOADING);

    expect(engine.startLoad).toHaveBeenCalledTimes(1);
  });

  it('applies preload to native element immediately when target exists', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    const video = document.createElement('video');

    host.attach(video);

    host.preload = 'auto';

    expect(video.preload).toBe('auto');
  });

  it('cleans up on MEDIA_DETACHED', () => {
    const engine = createEngine();
    const host = new PreloadHost(engine);

    host.preload = 'metadata';

    const video = document.createElement('video');

    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    (engine.startLoad as ReturnType<typeof vi.fn>).mockClear();

    (engine.resumeBuffering as ReturnType<typeof vi.fn>).mockClear();
    (engine as any).emit(Hls.Events.MEDIA_DETACHED);

    video.dispatchEvent(new Event('play'));
    expect(engine.startLoad).not.toHaveBeenCalled();
    expect(engine.resumeBuffering).not.toHaveBeenCalled();
  });
});
