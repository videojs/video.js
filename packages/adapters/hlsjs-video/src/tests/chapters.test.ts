import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsChaptersMixin } from '../chapters';

// Loading the document is SPF's `loadChaptersTracks`, covered there in a real
// browser; here only what the mixin hands it, and when it aborts, is observed.
const loadChaptersTracks = vi.hoisted(() =>
  vi.fn((..._args: Parameters<typeof import('@videojs/spf/dom').loadChaptersTracks>) => {})
);

vi.mock('@videojs/spf/dom', () => ({ loadChaptersTracks }));

/** The signal of the most recent load. */
function lastSignal(): AbortSignal {
  return loadChaptersTracks.mock.lastCall![2];
}

function createEngine(): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    config: {},
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

const HlsJsChapters = HlsJsChaptersMixin(FakeHost);

function emit(engine: Hls, event: string, data: unknown = {}) {
  (engine as any).emit(event, data);
}

/** Load a multivariant playlist as hls.js reports it: one session-data entry per `DATA-ID`. */
function loadManifest(engine: Hls, url: string, chapters?: Record<string, string>) {
  const sessionData = chapters
    ? { 'com.apple.hls.chapters': { 'DATA-ID': 'com.apple.hls.chapters', ...chapters } }
    : null;

  emit(engine, Hls.Events.MANIFEST_LOADING);
  emit(engine, Hls.Events.MANIFEST_LOADED, { sessionData, url });
}

beforeEach(() => {
  loadChaptersTracks.mockClear();
});

describe('HlsJsChaptersMixin', () => {
  it("loads the chapters document hls.js reports, against the manifest's response URL", () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);
    const video = document.createElement('video');

    host.attach(video);
    loadManifest(engine, 'https://cdn.example.com/redirected/main.m3u8', { URI: 'chapters.json' });

    expect(loadChaptersTracks).toHaveBeenCalledWith(
      video,
      'https://cdn.example.com/redirected/chapters.json',
      expect.any(AbortSignal),
      { preferredLanguage: undefined }
    );
  });

  it("leads with hls.js's subtitle preference", () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    engine.config.subtitlePreference = { lang: 'es' };
    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });

    expect(loadChaptersTracks.mock.lastCall![3]).toEqual({ preferredLanguage: 'es' });
  });

  it('does nothing for a manifest without a chapters URI', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8');
    loadManifest(engine, 'https://example.com/main.m3u8', { VALUE: '[]' });

    expect(loadChaptersTracks).not.toHaveBeenCalled();
  });

  it('waits for media before loading a manifest that arrived first', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);
    const video = document.createElement('video');

    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });

    expect(loadChaptersTracks).not.toHaveBeenCalled();

    host.attach(video);
    emit(engine, Hls.Events.MEDIA_ATTACHED);

    expect(loadChaptersTracks).toHaveBeenCalledOnce();
    expect(loadChaptersTracks.mock.lastCall![0]).toBe(video);
  });

  it('loads once while media stays attached', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });
    emit(engine, Hls.Events.MEDIA_ATTACHED);

    expect(loadChaptersTracks).toHaveBeenCalledOnce();
  });

  it('aborts on detach and loads again on reattach', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });

    const signal = lastSignal();

    emit(engine, Hls.Events.MEDIA_DETACHED);

    expect(signal.aborted).toBe(true);

    emit(engine, Hls.Events.MEDIA_ATTACHED);

    expect(loadChaptersTracks).toHaveBeenCalledTimes(2);
  });

  it('forgets the chapters when a new source starts loading', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });

    const signal = lastSignal();

    emit(engine, Hls.Events.MANIFEST_LOADING);

    expect(signal.aborted).toBe(true);

    // Nothing left to load once media reattaches.
    emit(engine, Hls.Events.MEDIA_ATTACHED);

    expect(loadChaptersTracks).toHaveBeenCalledOnce();
  });

  it('aborts on destroy', () => {
    const engine = createEngine();
    const host = new HlsJsChapters(engine);

    host.attach(document.createElement('video'));
    loadManifest(engine, 'https://example.com/main.m3u8', { URI: 'chapters.json' });
    emit(engine, Hls.Events.DESTROYING);

    expect(lastSignal().aborted).toBe(true);
  });
});
