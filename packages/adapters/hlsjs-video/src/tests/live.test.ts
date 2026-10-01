import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsLiveMixin } from '../live';

function createEngine(userConfig: Record<string, unknown> = {}): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    config: { ...userConfig },
    userConfig: { ...userConfig },
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
  } as unknown as Hls;
}

class FakeHost extends HTMLVideoAdapter {
  engine: Hls | null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }
}

const HlsJsLive = HlsJsLiveMixin(FakeHost);

// Minimal LevelDetails shape — only the fields the mixin reads.
function levelDetails(overrides: Record<string, unknown>) {
  return {
    live: false,
    type: null,
    partList: null,
    partHoldBack: 0,
    partTarget: 0,
    holdBack: 0,
    targetduration: 6,
    totalduration: 0,
    ...overrides,
  } as any;
}

function emitLevelLoaded(engine: Hls, details: unknown) {
  (engine as any).emit(Hls.Events.LEVEL_LOADED, { details });
}

function setTargetSeekable(host: FakeHost, ranges: [number, number][]) {
  const video = document.createElement('video');

  Object.defineProperty(video, 'seekable', {
    configurable: true,
    get() {
      return {
        length: ranges.length,
        start: (i: number) => ranges[i]?.[0] ?? 0,
        end: (i: number) => ranges[i]?.[1] ?? 0,
      } as TimeRanges;
    },
  });
  host.attach(video);
  return video;
}

describe('HlsJsLiveMixin', () => {
  describe('defaults', () => {
    it('starts with `NaN` for both values', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      expect(host.targetLiveWindow).toBeNaN();
      expect(host.liveEdgeStart).toBeNaN();
    });
  });

  describe('targetLiveWindow derivation', () => {
    it('is `0` for standard live', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      const handler = vi.fn();

      host.addEventListener('targetlivewindowchange', handler);

      emitLevelLoaded(engine, levelDetails({ live: true, type: null, holdBack: 18 }));

      expect(host.targetLiveWindow).toBe(0);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('is `Infinity` for an `EVENT` playlist (DVR)', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      emitLevelLoaded(engine, levelDetails({ live: true, type: 'EVENT', holdBack: 18 }));

      expect(host.targetLiveWindow).toBe(Number.POSITIVE_INFINITY);
    });

    it('resets the window and announces an ended EVENT playlist', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const handler = vi.fn();

      host.addEventListener('targetlivewindowchange', handler);
      emitLevelLoaded(engine, levelDetails({ live: true, type: 'EVENT', holdBack: 18 }));
      expect(host.targetLiveWindow).toBe(Infinity);
      expect(handler).toHaveBeenCalledOnce();

      emitLevelLoaded(engine, levelDetails({ live: false, type: 'EVENT' }));

      expect(host.targetLiveWindow).toBeNaN();
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('dedupes `targetlivewindowchange` when the value does not change', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      const handler = vi.fn();

      host.addEventListener('targetlivewindowchange', handler);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('liveEdgeStart derivation', () => {
    it('uses `holdBack` for standard live (`seekable.end - holdBack`)', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 12, targetduration: 6 }));

      expect(host.liveEdgeStart).toBe(48);
    });

    it('falls back to `targetduration * 3` when `holdBack` is absent', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 0, targetduration: 6 }));

      expect(host.liveEdgeStart).toBe(42);
    });

    it('uses `partHoldBack` for low-latency live', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, partList: [{}], partHoldBack: 2, partTarget: 0.5 }));

      expect(host.liveEdgeStart).toBe(58);
    });

    it('falls back to `partTarget * 2` when `partHoldBack` is absent', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, partList: [{}], partHoldBack: 0, partTarget: 0.5 }));

      expect(host.liveEdgeStart).toBe(59);
    });

    it('is `NaN` when no seekable range is available', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, []);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect(host.liveEdgeStart).toBeNaN();
    });

    it('is `NaN` when the stream is not live', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, type: 'EVENT', holdBack: 18 }));
      expect(host.liveEdgeStart).toBe(42);

      emitLevelLoaded(engine, levelDetails({ live: false, type: 'EVENT' }));

      expect(host.liveEdgeStart).toBeNaN();
    });

    it('reflects the current `seekable` on every read', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      let end = 60;
      const video = document.createElement('video');

      Object.defineProperty(video, 'seekable', {
        configurable: true,
        get() {
          return {
            length: 1,
            start: () => 0,
            end: () => end,
          } as TimeRanges;
        },
      });
      host.attach(video);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect(host.liveEdgeStart).toBe(42);

      end = 120;
      expect(host.liveEdgeStart).toBe(102);
    });
  });

  describe('seek-to-live on first play', () => {
    function emitManifestLoading(engine: Hls) {
      (engine as any).emit(Hls.Events.MANIFEST_LOADING);
    }

    it('seeks to `liveEdgeStart` on the first `play` event', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18, targetduration: 6 }));

      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(42);
    });

    it('does not seek when `autoplay` is set', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      video.autoplay = true;

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(0);
    });

    it('only seeks on the first play (subsequent plays are ignored)', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      video.dispatchEvent(new Event('play'));
      expect(video.currentTime).toBe(42);

      video.currentTime = 30;
      video.dispatchEvent(new Event('play'));
      expect(video.currentTime).toBe(30);
    });

    it('does not seek backwards when already at or past the live edge', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      video.currentTime = 50;
      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(50);
    });

    it('does not seek after an EVENT playlist ends', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, type: 'EVENT', holdBack: 18 }));
      expect(host.liveEdgeStart).toBe(42);

      emitLevelLoaded(engine, levelDetails({ live: false, type: 'EVENT' }));

      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(0);
    });

    it('defers the seek until `liveEdgeStart` becomes finite (preload="none")', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      // Manifest is requested at startup but `LEVEL_LOADED` only arrives after `play`.
      emitManifestLoading(engine);
      video.dispatchEvent(new Event('play'));
      expect(video.currentTime).toBe(0);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect(video.currentTime).toBe(42);
    });

    it('re-arms on a subsequent source load', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));
      video.dispatchEvent(new Event('play'));
      expect(video.currentTime).toBe(42);

      video.currentTime = 0;
      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));
      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(42);
    });

    it('disarms on `MEDIA_DETACHED`', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);
      const video = setTargetSeekable(host, [[0, 60]]);

      emitManifestLoading(engine);
      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      (engine as any).emit(Hls.Events.MEDIA_DETACHED);
      expect(host.liveEdgeStart).toBe(42);

      video.dispatchEvent(new Event('play'));

      expect(video.currentTime).toBe(0);
    });
  });

  describe('hls.js config updates', () => {
    it('applies low-latency defaults when partList is present', () => {
      const engine = createEngine({ abrBandWidthFactor: 0.95 });
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, partList: [{}], partHoldBack: 2, partTarget: 0.5 }));

      expect((engine as any).config.backBufferLength).toBe(4);
      expect((engine as any).config.maxFragLookUpTolerance).toBe(0.001);
      expect((engine as any).config.abrBandWidthUpFactor).toBe(0.95);
    });

    it('applies standard live defaults when partList is absent', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect((engine as any).config.backBufferLength).toBe(8);
    });

    it('respects user-supplied overrides', () => {
      const engine = createEngine({ backBufferLength: 30 });
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));

      expect((engine as any).config.backBufferLength).toBe(30);
    });

    it('does not touch config for non-live streams', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, type: 'EVENT', holdBack: 18 }));
      expect(engine.config.backBufferLength).toBe(8);

      engine.config.backBufferLength = 73;
      emitLevelLoaded(engine, levelDetails({ live: false, type: 'EVENT' }));

      expect(engine.config.backBufferLength).toBe(73);
    });
  });

  describe('reset', () => {
    it('resets on `MANIFEST_LOADING`', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));
      expect(host.targetLiveWindow).toBe(0);

      const handler = vi.fn();

      host.addEventListener('targetlivewindowchange', handler);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);

      expect(host.targetLiveWindow).toBeNaN();
      expect(host.liveEdgeStart).toBeNaN();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('resets on `DESTROYING`', () => {
      const engine = createEngine();
      const host = new HlsJsLive(engine);

      setTargetSeekable(host, [[0, 60]]);

      emitLevelLoaded(engine, levelDetails({ live: true, holdBack: 18 }));
      expect(host.targetLiveWindow).toBe(0);

      (engine as any).emit(Hls.Events.DESTROYING);

      expect(host.targetLiveWindow).toBeNaN();
      expect(host.liveEdgeStart).toBeNaN();
    });
  });
});
