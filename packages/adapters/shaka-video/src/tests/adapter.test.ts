import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('shaka-player/dist/shaka-player.compiled-es2021', () => {
  const CONFIG_DEFAULTS = { streaming: { bufferingGoal: 10, rebufferingGoal: 2 } };

  /** Shaka merges every `configure()` call into the current configuration. */
  function merge(target: Record<string, any>, source: Record<string, any>) {
    for (const [key, value] of Object.entries(source)) {
      const isPlainObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      target[key] = isPlainObject ? merge({ ...target[key] }, value) : value;
    }

    return target;
  }

  function create() {
    const listeners = new Map<string, Set<(event: any) => void>>();

    const player = {
      config: {} as Record<string, any>,
      videoTracks: [] as any[],
      audioTracks: [] as any[],
      attach: vi.fn(async () => {}),
      detach: vi.fn(async () => {}),
      load: vi.fn(async (_src?: string, _startTime?: unknown, _mimeType?: string) => {}),
      unload: vi.fn(async () => {}),
      destroy: vi.fn(async () => {}),
      configure: vi.fn((config: Record<string, any>) => {
        player.config = merge(player.config, config);
        return true;
      }),
      resetConfiguration: vi.fn(() => {
        player.config = {};
      }),
      // The real `getConfiguration()` always returns a fully resolved
      // configuration; `config` tracks only what was written.
      getConfiguration: vi.fn(() => merge(structuredClone(CONFIG_DEFAULTS), player.config)),
      getVideoTracks: vi.fn(() => player.videoTracks),
      getAudioTracks: vi.fn(() => player.audioTracks),
      selectVideoTrack: vi.fn(),
      selectAudioTrack: vi.fn(),
      addEventListener: vi.fn((type: string, listener: (event: any) => void) => {
        const typeListeners = listeners.get(type) ?? new Set();

        typeListeners.add(listener);
        listeners.set(type, typeListeners);
      }),
      removeEventListener: vi.fn((type: string, listener: (event: any) => void) => {
        listeners.get(type)?.delete(listener);
      }),
      /** Test-only: dispatch a Shaka player event to its listeners. */
      emit(type: string, event: Record<string, unknown> = {}) {
        for (const listener of [...(listeners.get(type) ?? [])]) listener({ type, ...event });
      },
    };

    return player;
  }

  function Player(this: unknown) {
    return create();
  }

  Player.isBrowserSupported = () => true;

  const polyfill = { installAll: vi.fn() };

  const util = {
    Error: {
      Category: { NETWORK: 1, TEXT: 2, MEDIA: 3, MANIFEST: 4, STREAMING: 5, DRM: 6, PLAYER: 7 },
      Code: { LOAD_INTERRUPTED: 7000, OPERATION_ABORTED: 7001, BAD_HTTP_STATUS: 1001 },
      Severity: { RECOVERABLE: 1, CRITICAL: 2 },
    },
  };

  return { default: { Player, polyfill, util } };
});

import { KeySystems } from '@videojs/media';

import { shaka, ShakaAdapter, type ShakaSource } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

type MockEngine = {
  config: Record<string, any>;
  videoTracks: MockVideoTrack[];
  audioTracks: MockAudioTrack[];
  attach: ReturnType<typeof vi.fn>;
  detach: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  configure: ReturnType<typeof vi.fn>;
  resetConfiguration: ReturnType<typeof vi.fn>;
  selectVideoTrack: ReturnType<typeof vi.fn>;
  selectAudioTrack: ReturnType<typeof vi.fn>;
  emit(type: string, event?: Record<string, unknown>): void;
};

type MockVideoTrack = {
  active: boolean;
  bandwidth: number;
  width?: number;
  height?: number;
  codecs?: string;
  frameRate?: number;
  hdr?: string | null;
};

type MockAudioTrack = {
  active: boolean;
  primary: boolean;
  language: string;
  label?: string | null;
  roles?: string[];
  channelsCount?: number | null;
};

function setup({ preload = 'auto' as const }: { preload?: ShakaAdapter['preload'] } = {}) {
  const video = document.createElement('video');

  document.body.appendChild(video);

  const media = new ShakaAdapter();

  // Most suites exercise source, configuration, and error semantics, which
  // read clearest when every assignment reaches the engine immediately; the
  // preload suite opts back into the deferring defaults it is about.
  media.preload = preload;
  media.attach(video);

  return { media, video, engine: media.engine as unknown as MockEngine };
}

/** Engine calls are queued, and track list events are dispatched a microtask later. */
async function flush() {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}

/** What the element itself configures on a fresh or reset engine. */
const ELEMENT_DEFAULTS = { abr: { restrictToElementSize: true } };

const MANIFEST = 'https://example.com/manifest.mpd';
const OTHER_MANIFEST = 'https://example.com/other.m3u8';

const VIDEO_TRACKS: MockVideoTrack[] = [
  { active: true, bandwidth: 6_000_000, width: 1920, height: 1080, codecs: 'avc1.640028', frameRate: 30 },
  { active: false, bandwidth: 3_000_000, width: 1280, height: 720, codecs: 'avc1.64001f', frameRate: 30 },
];

const AUDIO_TRACKS: MockAudioTrack[] = [
  { active: true, primary: true, language: 'en', label: 'English', roles: ['main'], channelsCount: 2 },
  { active: false, primary: false, language: 'fr', label: 'French', roles: ['alternate'], channelsCount: 2 },
];

/** Shaka announces the tracks of an asset once it is loaded. */
function loadTracks(engine: MockEngine, videoTracks = VIDEO_TRACKS, audioTracks = AUDIO_TRACKS) {
  engine.videoTracks = videoTracks.map((track) => ({ ...track }));
  engine.audioTracks = audioTracks.map((track) => ({ ...track }));
  engine.emit('trackschanged');
}

function shakaError(overrides: Record<string, unknown> = {}) {
  return { severity: 2, category: 1, code: 1001, data: [], message: 'Bad HTTP status', ...overrides };
}

describe('ShakaAdapter', () => {
  describe('constructor', () => {
    it('installs the browser polyfills shaka does not install itself', () => {
      new ShakaAdapter();
      expect(shaka.polyfill.installAll).toHaveBeenCalled();

      const installs = vi.mocked(shaka.polyfill.installAll).mock.calls.length;

      new ShakaAdapter();

      // Installing patches globals, so it happens once however many elements there are.
      expect(shaka.polyfill.installAll).toHaveBeenCalledTimes(installs);
    });
  });

  describe('attach', () => {
    it('attaches the engine to the target', async () => {
      const { engine, video } = setup();

      await flush();

      expect(engine.attach).toHaveBeenCalledWith(video);
    });

    it('loads a source that was assigned before there was a target', async () => {
      const video = document.createElement('video');
      const media = new ShakaAdapter();
      const engine = media.engine as unknown as MockEngine;

      media.src = MANIFEST;
      await flush();
      expect(engine.load).not.toHaveBeenCalled();

      media.attach(video);
      await flush();

      expect(engine.attach).toHaveBeenCalledWith(video);
      expect(engine.load).toHaveBeenCalledExactlyOnceWith(MANIFEST, undefined, undefined);
    });

    it('leaves the target it is already attached to alone', async () => {
      const { media, engine, video } = setup();

      await flush();

      media.attach(video);
      await flush();

      expect(engine.attach).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('detaches and destroys the engine', async () => {
      const { media, engine } = setup();

      await flush();

      media.destroy();
      await flush();

      expect(engine.destroy).toHaveBeenCalled();
      expect(media.engine).toBeNull();
    });
  });

  describe('source', () => {
    it('forwards shaka configuration to the player', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();

      expect(engine.config).toEqual({ ...ELEMENT_DEFAULTS, streaming: { bufferingGoal: 30 } });
    });

    it('derives src and loads the manifest', async () => {
      const { media, engine } = setup();
      const sourcechange = vi.fn();

      media.addEventListener('sourcechange', sourcechange);

      media.source = { src: MANIFEST };
      await flush();

      expect(media.src).toBe(MANIFEST);
      expect(engine.load).toHaveBeenCalledExactlyOnceWith(MANIFEST, undefined, undefined);
      expect(sourcechange).toHaveBeenCalledTimes(1);
    });

    it('hands the source type to shaka as the type to parse the manifest as', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, type: 'application/dash+xml' };
      await flush();

      expect(engine.load).toHaveBeenCalledWith(MANIFEST, undefined, 'application/dash+xml');
    });

    it('leaves the engine alone for a structurally equal source', async () => {
      const { media, engine } = setup();
      const source: ShakaSource = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };

      media.source = source;
      await flush();

      const sourcechange = vi.fn();

      media.addEventListener('sourcechange', sourcechange);
      engine.load.mockClear();
      engine.configure.mockClear();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();

      expect(engine.load).not.toHaveBeenCalled();
      expect(engine.configure).not.toHaveBeenCalled();
      expect(sourcechange).toHaveBeenCalledTimes(1);
    });

    it('does not reload the manifest when only shaka configuration changes', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();
      engine.load.mockClear();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 60 } } } };
      await flush();

      expect(engine.load).not.toHaveBeenCalled();
      expect(engine.config).toEqual({ ...ELEMENT_DEFAULTS, streaming: { bufferingGoal: 60 } });
    });

    it('resets configuration instead of merging when a shaka option is dropped', async () => {
      const { media, engine } = setup();

      media.source = {
        src: MANIFEST,
        engine: { shaka: { streaming: { bufferingGoal: 30, rebufferingGoal: 5 } } },
      };
      await flush();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();

      expect(engine.resetConfiguration).toHaveBeenCalled();
      expect(engine.config).toEqual({ ...ELEMENT_DEFAULTS, streaming: { bufferingGoal: 30 } });
    });

    it('hands a new source to shaka without waiting for the load in flight', async () => {
      const { media, engine } = setup();

      // A manifest that never resolves is what a new source has to cut short.
      engine.load.mockImplementation(() => new Promise(() => {}));

      media.source = { src: MANIFEST };
      await flush();

      media.source = { src: OTHER_MANIFEST };
      await flush();

      expect(engine.load).toHaveBeenNthCalledWith(2, OTHER_MANIFEST, undefined, undefined);
    });

    it('unloads when src is cleared', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST };
      await flush();

      media.source = null;
      await flush();

      expect(media.src).toBe('');
      expect(engine.unload).toHaveBeenCalled();
    });

    it('translates source drm into shaka license servers and certificates', async () => {
      const { media, engine } = setup();

      media.source = {
        src: MANIFEST,
        drm: {
          [KeySystems.WIDEVINE]: { licenseUrl: 'https://example.com/widevine' },
          [KeySystems.FAIRPLAY]: {
            licenseUrl: 'https://example.com/fairplay',
            serverCertificateUrl: 'https://example.com/cert',
          },
        },
      };
      await flush();

      expect(engine.config.drm).toEqual({
        servers: {
          [KeySystems.WIDEVINE]: 'https://example.com/widevine',
          [KeySystems.FAIRPLAY]: 'https://example.com/fairplay',
        },
        advanced: {
          [KeySystems.FAIRPLAY]: { serverCertificateUri: 'https://example.com/cert' },
        },
      });
    });

    it('lets shaka license servers replace the source drm configuration', async () => {
      const { media, engine } = setup();

      media.source = {
        src: MANIFEST,
        drm: { [KeySystems.WIDEVINE]: { licenseUrl: 'https://example.com/widevine' } },
        engine: { shaka: { drm: { servers: { [KeySystems.PLAYREADY]: 'https://example.com/playready' } } } },
      };
      await flush();

      expect(engine.config.drm).toEqual({
        servers: { [KeySystems.PLAYREADY]: 'https://example.com/playready' },
      });
    });
  });

  describe('src', () => {
    it('preserves source configuration across a src change', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();
      engine.configure.mockClear();

      media.src = OTHER_MANIFEST;
      await flush();

      expect(media.source).toEqual({
        src: OTHER_MANIFEST,
        engine: { shaka: { streaming: { bufferingGoal: 30 } } },
      });
      expect(engine.load).toHaveBeenLastCalledWith(OTHER_MANIFEST, undefined, undefined);
      expect(engine.configure).not.toHaveBeenCalled();
    });

    it('fires sourcechange through the source setter', async () => {
      const { media } = setup();
      const sourcechange = vi.fn();

      media.addEventListener('sourcechange', sourcechange);

      media.src = MANIFEST;
      await flush();

      expect(sourcechange).toHaveBeenCalledTimes(1);
      expect(media.source).toEqual({ src: MANIFEST });
    });
  });

  describe('preload', () => {
    it('clamps buffering for metadata until the first play', async () => {
      const { video, media, engine } = setup({ preload: 'metadata' });

      media.source = { src: MANIFEST };
      await flush();

      expect(engine.load).toHaveBeenCalledWith(MANIFEST, undefined, undefined);
      expect(engine.config.streaming).toEqual({ bufferingGoal: 1, rebufferingGoal: 1 });

      video.dispatchEvent(new Event('play'));

      expect(engine.config.streaming).toEqual({ bufferingGoal: 10, rebufferingGoal: 2 });
    });

    it('keeps a metadata clamp across a configuration re-apply', async () => {
      const { media, engine } = setup({ preload: 'metadata' });

      media.source = { src: MANIFEST };
      await flush();
      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 60 } } } };
      await flush();

      expect(engine.config.streaming).toEqual({ bufferingGoal: 1, rebufferingGoal: 1 });
    });

    it('restores the real goals when a source replaces a clamped one', async () => {
      const { video, media, engine } = setup({ preload: 'metadata' });

      media.source = { src: MANIFEST };
      await flush();
      media.source = { src: OTHER_MANIFEST };
      await flush();

      video.dispatchEvent(new Event('play'));

      expect(engine.config.streaming).toEqual({ bufferingGoal: 10, rebufferingGoal: 2 });
    });

    it('lifts the clamp when a replacing load starts with play intent', async () => {
      const { video, media, engine } = setup({ preload: 'metadata' });

      media.source = { src: MANIFEST };
      await flush();

      video.autoplay = true;
      media.source = { src: OTHER_MANIFEST };
      await flush();

      expect(engine.config.streaming).toEqual({ bufferingGoal: 10, rebufferingGoal: 2 });
    });

    it('holds the load for none until the first play', async () => {
      const { video, media, engine } = setup({ preload: 'none' });

      media.source = { src: MANIFEST };
      await flush();

      expect(engine.load).not.toHaveBeenCalled();

      video.dispatchEvent(new Event('play'));

      expect(engine.load).toHaveBeenCalledWith(MANIFEST, undefined, undefined);
    });

    it('loads immediately for none when the target will autoplay', async () => {
      const { video, media, engine } = setup({ preload: 'none' });

      video.autoplay = true;

      media.source = { src: MANIFEST };
      await flush();

      expect(engine.load).toHaveBeenCalledWith(MANIFEST, undefined, undefined);
    });

    it('releases a held load when preload widens', async () => {
      const { media, engine } = setup({ preload: 'none' });

      media.source = { src: MANIFEST };
      await flush();
      media.preload = 'auto';

      expect(engine.load).toHaveBeenCalledWith(MANIFEST, undefined, undefined);
    });

    it('holds only the newest source when one replaces a held one', async () => {
      const { video, media, engine } = setup({ preload: 'none' });

      media.source = { src: MANIFEST };
      await flush();
      media.source = { src: OTHER_MANIFEST };
      await flush();

      video.dispatchEvent(new Event('play'));

      expect(engine.load).toHaveBeenCalledTimes(1);
      expect(engine.load).toHaveBeenCalledWith(OTHER_MANIFEST, undefined, undefined);
    });

    it('drops a held load when the source clears', async () => {
      const { video, media, engine } = setup({ preload: 'none' });

      media.source = { src: MANIFEST };
      await flush();
      media.source = null;
      await flush();

      video.dispatchEvent(new Event('play'));

      expect(engine.load).not.toHaveBeenCalled();
      expect(engine.unload).toHaveBeenCalled();
    });

    it('mirrors onto the target element', () => {
      const { video, media } = setup();

      media.preload = 'none';

      expect(video.preload).toBe('none');
    });
  });

  describe('videoRenditions', () => {
    it('mirrors the video tracks of the loaded asset', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      expect([...media.videoRenditions].map((rendition) => rendition.height)).toEqual([1080, 720]);
      expect([...media.videoRenditions].map((rendition) => rendition.id)).toEqual(['0', '1']);
      expect([...media.videoRenditions].map((rendition) => rendition.bitrate)).toEqual([6_000_000, 3_000_000]);
    });

    it('marks the video track shaka is playing active', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      expect([...media.videoRenditions].map((rendition) => rendition.active)).toEqual([true, false]);

      engine.videoTracks = [
        { ...VIDEO_TRACKS[0]!, active: false },
        { ...VIDEO_TRACKS[1]!, active: true },
      ];
      engine.emit('adaptation');

      expect([...media.videoRenditions].map((rendition) => rendition.active)).toEqual([false, true]);
    });

    it('leaves the list alone when the same tracks are announced again', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      const [rendition] = [...media.videoRenditions];

      engine.emit('trackschanged');
      await flush();

      expect([...media.videoRenditions][0]).toBe(rendition);
    });

    it('pins the selected track and turns shaka adaptation off', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      media.videoRenditions[1]!.selected = true;
      await flush();

      expect(engine.config.abr).toEqual({ restrictToElementSize: true, enabled: false });
      expect(engine.selectVideoTrack).toHaveBeenCalledWith(engine.videoTracks[1]);
    });

    it('hands adaptation back to shaka when the selection is cleared', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      media.videoRenditions[1]!.selected = true;
      await flush();

      media.videoRenditions[1]!.selected = false;
      await flush();

      expect(engine.config.abr).toEqual({ restrictToElementSize: true, enabled: true });
    });

    it('leaves shaka configuration alone when nothing was ever pinned', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { shaka: { abr: { enabled: false } } } };
      loadTracks(engine);
      await flush();

      const change = vi.fn();

      media.videoRenditions.addEventListener('change', change);
      engine.configure.mockClear();
      engine.selectVideoTrack.mockClear();

      // Coalesce selection and clearing before either can pin an engine track.
      media.videoRenditions[0]!.selected = true;
      media.videoRenditions[0]!.selected = false;
      await flush();

      expect(change).toHaveBeenCalledOnce();
      expect(engine.config.abr.enabled).toBe(false);
      expect(engine.configure).not.toHaveBeenCalled();
      expect(engine.selectVideoTrack).not.toHaveBeenCalled();
    });

    it('re-pins the selected track when shaka configuration is re-applied', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      loadTracks(engine);
      await flush();

      media.videoRenditions[1]!.selected = true;
      await flush();
      engine.selectVideoTrack.mockClear();

      media.source = { src: MANIFEST, engine: { shaka: { streaming: { bufferingGoal: 30 } } } };
      await flush();

      expect(engine.config.abr).toEqual({ restrictToElementSize: true, enabled: false });
      expect(engine.selectVideoTrack).toHaveBeenCalledWith(engine.videoTracks[1]);
    });

    it('drops renditions and restores adaptation when the source changes', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      loadTracks(engine);
      await flush();

      media.videoRenditions[1]!.selected = true;
      await flush();

      media.src = OTHER_MANIFEST;
      await flush();

      expect([...media.videoRenditions]).toEqual([]);
      expect(engine.config.abr).toEqual({ restrictToElementSize: true, enabled: true });
    });

    it('stops mirroring tracks once destroyed', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      media.destroy();
      await flush();

      loadTracks(engine, [{ active: true, bandwidth: 1_000_000, width: 640, height: 360 }]);
      await flush();

      expect([...media.videoRenditions]).toEqual([]);
    });
  });

  describe('audioTracks', () => {
    it('mirrors the audio tracks of the loaded asset', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      expect([...media.audioTracks].map((track) => track.language)).toEqual(['en', 'fr']);
      expect([...media.audioTracks].map((track) => track.kind)).toEqual(['main', 'alternative']);
      expect([...media.audioTracks].map((track) => track.enabled)).toEqual([true, false]);
    });

    it('selects the enabled audio track', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      media.audioTracks[1]!.enabled = true;
      await flush();

      expect(engine.selectAudioTrack).toHaveBeenCalledWith(engine.audioTracks[1]);
      expect([...media.audioTracks].map((track) => track.enabled)).toEqual([false, true]);
    });

    it('mirrors the audio track shaka switched to', async () => {
      const { media, engine } = setup();

      loadTracks(engine);
      await flush();

      engine.audioTracks = [
        { ...AUDIO_TRACKS[0]!, active: false },
        { ...AUDIO_TRACKS[1]!, active: true },
      ];
      engine.emit('audiotrackchanged');
      await flush();

      expect([...media.audioTracks].map((track) => track.enabled)).toEqual([false, true]);
    });
  });

  describe('error', () => {
    it('reports a failed load', async () => {
      const { media, engine } = setup();
      const onError = vi.fn();

      media.addEventListener('error', onError);

      engine.load.mockRejectedValueOnce(shakaError());
      media.src = MANIFEST;
      await flush();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(media.error).toMatchObject({ code: 2, fatal: true, context: 'shaka-1001' });
    });

    it('reports an engine error event', async () => {
      const { media, engine } = setup();
      const onError = vi.fn();

      media.addEventListener('error', onError);

      engine.emit('error', { detail: shakaError({ category: 6, code: 6001 }) });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(media.error).toMatchObject({ code: 5, fatal: true });
    });

    it('leaves a recoverable failure to shaka to retry', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { media, engine } = setup();
      const onError = vi.fn();

      media.addEventListener('error', onError);

      engine.emit('error', { detail: shakaError({ severity: 1 }) });

      // Announcing it would put the error UI over playback that is still going.
      expect(onError).not.toHaveBeenCalled();
      expect(media.error).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('recoverable'), expect.anything());
    });

    it('reports a failure once when shaka both rejects and announces it', async () => {
      const { media, engine } = setup();
      const onError = vi.fn();

      media.addEventListener('error', onError);

      // Shaka hands the same failure to the `error` event and to the call it broke.
      const failure = shakaError({ category: 6, code: 6001 });

      engine.load.mockImplementationOnce(async () => {
        engine.emit('error', { detail: failure });
        throw failure;
      });

      media.src = MANIFEST;
      await flush();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(media.error).toMatchObject({ code: 5, fatal: true });
    });

    it('does not re-announce a failure against the source an error handler fell back to', async () => {
      const { media, engine } = setup();
      const onError = vi.fn();

      // The `error` event lands first; the rejection of the load it broke is
      // still in flight when the handler starts a new one.
      const failure = shakaError();

      engine.load.mockImplementationOnce(async () => {
        engine.emit('error', { detail: failure });
        await Promise.resolve();
        throw failure;
      });

      media.addEventListener('error', () => {
        onError();
        media.src = OTHER_MANIFEST;
      });

      media.src = MANIFEST;
      await flush();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(engine.load).toHaveBeenLastCalledWith(OTHER_MANIFEST, undefined, undefined);
      expect(media.error).toBeNull();
    });

    it('ignores a load that a newer one replaced', async () => {
      const { media, engine } = setup();
      const onError = vi.fn();

      media.addEventListener('error', onError);

      engine.load.mockRejectedValueOnce(shakaError({ category: 7, code: 7000 }));
      media.src = MANIFEST;
      await flush();

      expect(onError).not.toHaveBeenCalled();
      expect(media.error).toBeNull();
    });
  });
});
