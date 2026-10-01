import type { Constructor } from '@videojs/utils/types';
import Hls from 'hls.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsAirPlayMixin } from '../airplay-bridge';
import type { HlsEngineHost } from '../types';

function createEngine(url = ''): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    url,
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
    stopLoad: vi.fn(),
  } as unknown as Hls;
}

// The real engine host exposes `target` as a protected getter; the mixin reads
// it internally. Here we model a minimal host with a writable `target` so tests
// can simulate attachment, then bridge to the mixin's expected host shape.
class FakeHost extends EventTarget {
  engine: Hls | null;
  target: HTMLMediaElement | null = null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }

  attach(target: HTMLMediaElement) {
    this.target = target;
  }

  // Mirrors `HTMLMediaAdapter`: media props forward to the attached target
  // and are dropped while nothing is attached.
  get disableRemotePlayback(): boolean {
    return this.target?.disableRemotePlayback ?? false;
  }

  set disableRemotePlayback(value: boolean) {
    if (this.target) this.target.disableRemotePlayback = value;
  }
}

/** Hls.js forces the flag on for ManagedMediaSource inside `attachMedia`. */
function simulateHlsJsMmsAttach(video: HTMLVideoElement) {
  video.disableRemotePlayback = true;
}

const AirPlayHost = HlsJsAirPlayMixin(FakeHost as unknown as Constructor<HlsEngineHost>) as unknown as typeof FakeHost;

function createVideo(initialWireless = false): HTMLVideoElement & { webkitCurrentPlaybackTargetIsWireless: boolean } {
  const video = document.createElement('video') as HTMLVideoElement & {
    webkitCurrentPlaybackTargetIsWireless: boolean;
  };
  let wireless = initialWireless;

  Object.defineProperty(video, 'webkitCurrentPlaybackTargetIsWireless', {
    configurable: true,
    get: () => wireless,
    set: (v: boolean) => {
      wireless = v;
    },
  });
  return video;
}

describe('HlsJsAirPlayMixin', () => {
  beforeEach(() => {
    // Stub the WebKit AirPlay capability check (jsdom lacks it).
    (globalThis as any).WebKitPlaybackTargetAvailabilityEvent = class {};
  });

  afterEach(() => {
    delete (globalThis as any).WebKitPlaybackTargetAvailabilityEvent;
  });

  it('appends a fallback <source> element on MEDIA_ATTACHED', () => {
    const engine = createEngine('https://example.com/master.m3u8');
    const host = new AirPlayHost(engine);
    const video = createVideo();

    host.target = video;

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    const source = video.querySelector('source');

    expect(source).not.toBeNull();
    expect(source?.type).toBe('application/x-mpegURL');
    expect(source?.src).toContain('master.m3u8');
  });

  describe('disableRemotePlayback', () => {
    it('clears the flag hls.js set when no author opted out', () => {
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.attach(video);
      simulateHlsJsMmsAttach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(video.disableRemotePlayback).toBe(false);
    });

    it('preserves an opt-out set through the media API before attach', () => {
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.disableRemotePlayback = true;
      host.attach(video);
      simulateHlsJsMmsAttach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(video.disableRemotePlayback).toBe(true);
    });

    it('preserves an opt-out set through the media API after attach', () => {
      // `attachMedia` writes the flag synchronously but MEDIA_ATTACHED only
      // fires once the media source opens, so an opt-out can land in between.
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.attach(video);
      simulateHlsJsMmsAttach(video);
      host.disableRemotePlayback = true;

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(video.disableRemotePlayback).toBe(true);
    });

    it('clears the flag again once the author opts back in', () => {
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.disableRemotePlayback = true;
      host.attach(video);
      host.disableRemotePlayback = false;
      simulateHlsJsMmsAttach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(video.disableRemotePlayback).toBe(false);
    });

    it('rebuilds the fallback source when the author opts back in after MEDIA_ATTACHED', () => {
      const engine = createEngine('https://example.com/master.m3u8');
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.disableRemotePlayback = true;
      host.attach(video);
      simulateHlsJsMmsAttach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      const before = video.querySelector('source');

      expect(before).not.toBeNull();
      expect(video.disableRemotePlayback).toBe(true);

      host.disableRemotePlayback = false;

      // A fresh `<source>` node, so WebKit re-reads the alternatives it decides
      // AirPlay routes from, alongside the now-cleared flag.
      const after = video.querySelector('source');

      expect(after).not.toBeNull();
      expect(after).not.toBe(before);
      expect(video.disableRemotePlayback).toBe(false);
    });

    it('does not rebuild before the engine has attached', () => {
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.attach(video);
      host.disableRemotePlayback = true;

      expect(video.querySelector('source')).toBeNull();
    });

    it('leaves the setup alone when the value is reassigned unchanged', () => {
      const engine = createEngine('https://example.com/master.m3u8');
      const host = new AirPlayHost(engine);
      const video = createVideo();

      host.attach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      const before = video.querySelector('source');

      host.disableRemotePlayback = false;

      expect(video.querySelector('source')).toBe(before);
    });

    it('ignores a flag only ever set on the element', () => {
      // The binding layers convert markup and props into media API calls, so a
      // value found on the element alone is hls.js's, not the author's.
      const engine = createEngine();
      const host = new AirPlayHost(engine);
      const video = createVideo();

      video.disableRemotePlayback = true;
      host.attach(video);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(video.disableRemotePlayback).toBe(false);
    });
  });

  it('updates the <source> src on MANIFEST_LOADING', () => {
    const engine = createEngine('https://example.com/old.m3u8');
    const host = new AirPlayHost(engine);
    const video = createVideo();

    host.target = video;

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
    (engine as any).emit(Hls.Events.MANIFEST_LOADING, { url: 'https://example.com/new.m3u8' });

    expect(video.querySelector('source')?.src).toContain('new.m3u8');
  });

  it('calls stopLoad when AirPlay activates', () => {
    const engine = createEngine();
    const host = new AirPlayHost(engine);
    const video = createVideo();

    host.target = video;
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
    (engine.stopLoad as ReturnType<typeof vi.fn>).mockClear();
    (engine.startLoad as ReturnType<typeof vi.fn>).mockClear();

    video.webkitCurrentPlaybackTargetIsWireless = true;
    video.dispatchEvent(new Event('webkitcurrentplaybacktargetiswirelesschanged'));

    expect(engine.stopLoad).toHaveBeenCalled();
    expect(engine.startLoad).not.toHaveBeenCalled();
  });

  it('never calls startLoad across the connect burst', () => {
    // WebKit fires `true → false → true` on first connect. The transient
    // `false` must not resume loading against the MSE mid-handoff; the bridge
    // only ever suspends, so startLoad is never called.
    const engine = createEngine();
    const host = new AirPlayHost(engine);
    const video = createVideo();

    host.target = video;
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
    (engine.startLoad as ReturnType<typeof vi.fn>).mockClear();

    for (const wireless of [true, false, true]) {
      video.webkitCurrentPlaybackTargetIsWireless = wireless;
      video.dispatchEvent(new Event('webkitcurrentplaybacktargetiswirelesschanged'));
    }

    expect(engine.startLoad).not.toHaveBeenCalled();
  });

  it('suspends loading when AirPlay is already active at attach', () => {
    const engine = createEngine();
    const host = new AirPlayHost(engine);
    const video = createVideo(true);

    host.target = video;

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(engine.stopLoad).toHaveBeenCalled();
  });

  it('removes the <source> and stops listening on MEDIA_DETACHED', () => {
    const engine = createEngine();
    const host = new AirPlayHost(engine);
    const video = createVideo();

    host.target = video;
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);

    expect(video.querySelector('source')).toBeNull();

    (engine.stopLoad as ReturnType<typeof vi.fn>).mockClear();
    video.webkitCurrentPlaybackTargetIsWireless = true;
    video.dispatchEvent(new Event('webkitcurrentplaybacktargetiswirelesschanged'));
    expect(engine.stopLoad).not.toHaveBeenCalled();
  });

  it('no-ops when target lacks WebKit AirPlay APIs', () => {
    delete (globalThis as any).WebKitPlaybackTargetAvailabilityEvent;
    const engine = createEngine();
    const host = new AirPlayHost(engine);
    const video = document.createElement('video');

    host.target = video;

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(video.querySelector('source')).toBeNull();
    expect(engine.stopLoad).not.toHaveBeenCalled();
    expect(engine.startLoad).not.toHaveBeenCalled();
  });
});
