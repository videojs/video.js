import { MediaError, type RemotePlaybackLike } from '@videojs/media';
import { CustomMediaElement } from '@videojs/media/dom';
import { NativeHlsAdapter } from '@videojs/native-hls-video';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { ContentTypes, Hls, HlsJsAdapter, type HlsSource } from '../index';

// Stands in for `<hlsjs-video>`, so markup reaches the media adapter the same way
// the HTML binding delivers it.
customElements.define('test-airplay-video', CustomMediaElement('video', HlsJsAdapter as never));

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function fireDurationChange(video: HTMLVideoElement, duration: number) {
  Object.defineProperty(video, 'duration', { value: duration, configurable: true });
  video.dispatchEvent(new Event('durationchange'));
}

function fireNativeError(video: HTMLVideoElement, code: number, message = '') {
  Object.defineProperty(video, 'error', {
    value: { code, message },
    configurable: true,
  });
  video.dispatchEvent(new Event('error'));
}

function setup() {
  const video = document.createElement('video');

  document.body.appendChild(video);

  const media = new HlsJsAdapter();

  media.attach(video);

  const handler = vi.fn();

  media.addEventListener('error', handler);

  media.source = { type: ContentTypes.M3U8, preferPlayback: 'native' };
  media.load();

  return { media, video, handler };
}

describe('HlsJsAdapter', () => {
  describe('error event delegation', () => {
    it('dispatches only the enriched error, not the raw native error', () => {
      const { video, handler } = setup();

      fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'network failure');

      expect(handler).toHaveBeenCalledOnce();

      const event = handler.mock.calls[0]![0] as ErrorEvent;

      expect(event).toBeInstanceOf(ErrorEvent);
      expect(event.error).toBeInstanceOf(MediaError);
      expect(event.error.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    });

    it('exposes enriched error via the error getter', () => {
      const { media, video } = setup();

      expect(media.error).toBeNull();

      fireNativeError(video, MediaError.MEDIA_ERR_DECODE, 'decode failure');

      expect(media.error).toBeInstanceOf(MediaError);
      expect(media.error!.code).toBe(MediaError.MEDIA_ERR_DECODE);
    });
  });

  describe('event forwarding through delegate', () => {
    it('forwards non-error events from native video once', () => {
      const { media, video } = setup();

      const playHandler = vi.fn();

      media.addEventListener('play', playHandler);

      video.dispatchEvent(new Event('play'));

      expect(playHandler).toHaveBeenCalledOnce();
    });

    it('forwards events added before load', () => {
      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);

      const pauseHandler = vi.fn();

      media.addEventListener('pause', pauseHandler);

      media.source = { type: ContentTypes.M3U8, preferPlayback: 'native' };
      media.load();

      video.dispatchEvent(new Event('pause'));

      expect(pauseHandler).toHaveBeenCalledOnce();
    });
  });

  describe('loadstart', () => {
    it('dispatches loadstart to listeners once per load', () => {
      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);

      const handler = vi.fn();

      media.addEventListener('loadstart', handler);

      media.load();

      expect(handler).toHaveBeenCalledOnce();
    });

    it('does not forward the native loadstart from the target', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('loadstart', handler);

      video.dispatchEvent(new Event('loadstart'));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('source', () => {
    it('recreates the engine when new engine options are assigned', () => {
      const { media, video } = setup();

      fireDurationChange(video, Infinity);
      expect(media.streamType).toBe('live');

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      // New hls.js option values must recreate the engine to take effect.
      media.source = {
        type: ContentTypes.M3U8,
        preferPlayback: 'native',
        engine: { hlsJs: { maxBufferLength: 60 } },
      };
      media.load();

      // Teardown `live` → `unknown`, then the new delegate re-detects `live`.
      expect(handler).toHaveBeenCalledTimes(2);
      expect(media.streamType).toBe('live');
    });

    it('does not recreate the engine for a structurally equal source', () => {
      const { media, video } = setup();

      const source = {
        type: ContentTypes.M3U8,
        preferPlayback: 'native',
        engine: { hlsJs: { maxBufferLength: 60 } },
      } as const;

      media.source = { ...source };
      media.load();

      fireDurationChange(video, Infinity);
      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      // Same option values in a new object (e.g. an inline React prop).
      media.source = { ...source };
      media.load();

      // No engine teardown → no streamType churn.
      expect(handler).not.toHaveBeenCalled();
    });

    it('preserves engine options when src changes', () => {
      const { media } = setup();

      media.src = 'https://example.com/video.m3u8';

      expect(media.source).toEqual({
        src: 'https://example.com/video.m3u8',
        type: ContentTypes.M3U8,
        preferPlayback: 'native',
      });
    });

    it('derives src from source and fires sourcechange', () => {
      const media = new HlsJsAdapter();
      const handler = vi.fn();

      media.addEventListener('sourcechange', handler);

      media.source = { src: 'https://example.com/video.m3u8' };

      expect(media.src).toBe('https://example.com/video.m3u8');
      expect(handler).toHaveBeenCalledOnce();

      media.source = null;

      expect(media.src).toBe('');
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('recreates the engine when inferred content type changes', () => {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);

      media.src = 'https://example.com/video.mp4';
      media.load();

      expect(media.engine).toBeNull();

      media.src = 'https://example.com/video.m3u8';
      media.load();

      expect(media.engine).not.toBeNull();
    });

    it('replaces the source rather than merging it', () => {
      const { media } = setup();

      media.source = { engine: { hlsJs: { maxBufferLength: 60 } } };

      // A new source object signals a fresh start: options set in `setup()` are
      // dropped rather than merged.
      expect(media.source).toEqual({ engine: { hlsJs: { maxBufferLength: 60 } } });
    });
  });

  describe('content type', () => {
    // An extensionless URL, so the engine decision rests on `type` alone.
    const SRC = 'https://example.com/asset?id=42';

    function createMseMedia() {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);

      return media;
    }

    it.each([
      'application/vnd.apple.mpegurl',
      'application/x-mpegURL',
      'application/x-mpegurl',
      'APPLICATION/VND.APPLE.MPEGURL',
      'application/mpegurl',
      'audio/mpegurl',
      'audio/x-mpegurl',
      'application/vnd.apple.mpegurl; charset=utf-8',
    ])('plays `%s` through hls.js', (type) => {
      const media = createMseMedia();

      media.source = { src: SRC, type };
      media.load();

      expect(media.engine).toBeInstanceOf(Hls);
      expect(media.videoRenditions).toBeDefined();
    });

    it.each(['video/mp4', 'VIDEO/MP4'])('hands `%s` to the browser', (type) => {
      const media = createMseMedia();

      media.source = { src: SRC, type };
      media.load();

      expect(media.engine).toBeNull();
      expect(media.videoRenditions).toBeUndefined();
    });

    it('hands an unrecognized type to the browser and warns in dev', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = createMseMedia();

      media.source = { src: 'https://example.com/master.m3u8', type: 'application/octet-stream' };
      media.load();

      expect(media.engine).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('application/octet-stream'));
    });

    it('does not warn for a recognized alias', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = createMseMedia();

      media.source = { src: SRC, type: 'application/x-mpegURL' };
      media.load();

      expect(warn).not.toHaveBeenCalled();
    });

    it('does not recreate the engine when only the HLS spelling changes', () => {
      const media = createMseMedia();

      media.source = { src: SRC, type: 'application/vnd.apple.mpegurl' };
      media.load();

      const engine = media.engine;

      media.source = { src: SRC, type: 'application/x-mpegURL' };
      media.load();

      expect(media.engine).toBe(engine);
    });
  });

  describe('drm', () => {
    const WIDEVINE_LICENSE = 'https://license.test/widevine';
    const FAIRPLAY_LICENSE = 'https://license.test/fairplay';

    function setupMse(source: HlsSource) {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);
      media.source = { ...source, src: 'https://example.com/video.m3u8' };
      media.load();

      return { media, video };
    }

    const drmEngine = { emeEnabled: true, drmSystems: { 'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE } } };
    const drm = {
      'com.apple.fps': { licenseUrl: FAIRPLAY_LICENSE, serverCertificateUrl: 'https://license.test/appcert' },
      'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE },
    };

    it('licenses the hls.js engine from `source.drm`', () => {
      const { media } = setupMse({ drm });

      // hls.js takes the same shape, and only negotiates keys while EME is on.
      expect(media.engine!.config.emeEnabled).toBe(true);
      expect(media.engine!.config.drmSystems).toEqual(drm);
    });

    it('leaves EME alone when `source.drm` names nothing', () => {
      const { media } = setupMse({ drm: {} });

      expect(media.engine!.config.emeEnabled).toBe(false);
    });

    it('describes licensing without acting on it for an explicit `emeEnabled: false`', () => {
      const { media } = setupMse({ drm, engine: { hlsJs: { emeEnabled: false } } });

      expect(media.engine!.config.emeEnabled).toBe(false);
      expect(media.engine!.config.drmSystems).toEqual(drm);
    });

    it('lets `engine.hlsJs.drmSystems` replace `source.drm`', () => {
      const { media } = setupMse({ drm, engine: { hlsJs: { drmSystems: drmEngine.drmSystems } } });

      // An escape hatch replaces what it is an escape from, rather than merging:
      // the FairPlay server named in `drm` is gone.
      expect(media.engine!.config.drmSystems).toEqual({ 'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE } });
      expect(media.engine!.config.emeEnabled).toBe(true);
    });

    it('recreates the engine when a `source.drm` license server changes', () => {
      const { media } = setupMse({ drm });
      const engine = media.engine;

      // Same license servers in a new object (e.g. an inline React prop).
      media.source = { src: media.src, drm: { ...drm } };
      media.load();
      expect(media.engine).toBe(engine);

      media.source = { src: media.src, drm: { 'com.widevine.alpha': { licenseUrl: 'https://other.test/widevine' } } };
      media.load();
      expect(media.engine).not.toBe(engine);
    });

    it('hands DRM options straight to the hls.js engine', () => {
      const { media } = setupMse({ engine: { hlsJs: drmEngine } });

      expect(media.engine!.config.emeEnabled).toBe(true);
      expect(media.engine!.config.drmSystems).toEqual({ 'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE } });
    });

    it('leaves EME disabled for unprotected playback', () => {
      const { media } = setupMse({});

      expect(media.engine!.config.emeEnabled).toBe(false);
    });

    it('reuses the engine for an equivalent DRM config', () => {
      const { media } = setupMse({ engine: { hlsJs: drmEngine } });
      const engine = media.engine;

      // Same license servers in a new object (e.g. an inline React prop).
      media.source = {
        src: media.src,
        engine: {
          hlsJs: { emeEnabled: true, drmSystems: { 'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE } } },
        },
      };
      media.load();

      expect(media.engine).toBe(engine);
    });

    it('recreates the engine when a license server changes', () => {
      const { media } = setupMse({ engine: { hlsJs: drmEngine } });
      const engine = media.engine;

      media.source = {
        src: media.src,
        engine: {
          hlsJs: {
            emeEnabled: true,
            drmSystems: { 'com.widevine.alpha': { licenseUrl: 'https://other.test/widevine' } },
          },
        },
      };
      media.load();

      expect(media.engine).not.toBe(engine);
      expect(media.engine!.config.drmSystems).toEqual({
        'com.widevine.alpha': { licenseUrl: 'https://other.test/widevine' },
      });
    });

    it('warns when native playback is taken and no FairPlay server is named', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { media } = setup();

      media.source = { ...media.source, engine: { hlsJs: drmEngine } };
      media.load();

      expect(media.engine).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`source.drm`'));
    });

    it('names the configuration it is licensing against when it warns', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { media } = setup();

      // `source.drm` names FairPlay, but the escape hatch replaces it and does
      // not — so the field to go and look at is the escape hatch.
      media.source = {
        ...media.source,
        drm,
        engine: { nativeHls: { drmSystems: { 'com.widevine.alpha': { licenseUrl: WIDEVINE_LICENSE } } } },
      };
      media.load();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`source.engine.nativeHls.drmSystems`'));
    });

    it('hands `source.drm` to the native delegate', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const requestMediaKeySystemAccess = vi.fn(() => new Promise<never>(() => {}));

      vi.stubGlobal('navigator', { ...navigator, requestMediaKeySystemAccess });

      const { media, video } = setup();

      // Every system named, as a source describing both paths would: the native
      // delegate takes the FairPlay entry and leaves the rest to an MSE engine.
      media.source = { ...media.source, drm };
      media.load();

      // jsdom has no `MediaEncryptedEvent`; only these two fields are read.
      video.dispatchEvent(Object.assign(new Event('encrypted'), { initDataType: 'skd', initData: new ArrayBuffer(8) }));
      await Promise.resolve();

      expect(media.engine).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      expect(requestMediaKeySystemAccess).toHaveBeenCalledWith('com.apple.fps', expect.any(Array));
    });

    it('recreates the native delegate when `source.drm` changes', () => {
      const { media, video } = setup();

      media.source = { ...media.source, drm };
      media.load();

      fireDurationChange(video, Infinity);
      expect(media.streamType).toBe('live');

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.source = { ...media.source, drm: { ...drm } };
      media.load();
      // Structurally equal, so the delegate playing it is left alone.
      expect(handler).not.toHaveBeenCalled();

      media.source = { ...media.source, drm: { 'com.apple.fps': { licenseUrl: 'https://other.test/fairplay' } } };
      media.load();

      // Teardown `live` → `unknown`, then the new delegate re-detects `live`.
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('hands `nativeHls` to the native delegate', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const requestMediaKeySystemAccess = vi.fn(() => new Promise<never>(() => {}));

      vi.stubGlobal('navigator', { ...navigator, requestMediaKeySystemAccess });

      const { media, video } = setup();

      media.source = {
        ...media.source,
        engine: {
          hlsJs: drmEngine,
          nativeHls: { drmSystems: { 'com.apple.fps': { licenseUrl: FAIRPLAY_LICENSE } } },
        },
      };
      media.load();

      // jsdom has no `MediaEncryptedEvent`; only these two fields are read.
      video.dispatchEvent(Object.assign(new Event('encrypted'), { initDataType: 'skd', initData: new ArrayBuffer(8) }));
      await Promise.resolve();

      expect(media.engine).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      expect(requestMediaKeySystemAccess).toHaveBeenCalledWith('com.apple.fps', expect.any(Array));
    });

    it('recreates the native delegate when `nativeHls` changes', () => {
      const { media, video } = setup();

      media.source = {
        ...media.source,
        engine: { nativeHls: { drmSystems: { 'com.apple.fps': { licenseUrl: FAIRPLAY_LICENSE } } } },
      };
      media.load();

      fireDurationChange(video, Infinity);
      expect(media.streamType).toBe('live');

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.source = {
        ...media.source,
        engine: { nativeHls: { drmSystems: { 'com.apple.fps': { licenseUrl: 'https://other.test/fairplay' } } } },
      };
      media.load();

      // Teardown `live` → `unknown`, then the new delegate re-detects `live`.
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('leaves the native delegate alone for a structurally equal `nativeHls`', () => {
      const { media, video } = setup();
      const nativeHls = { drmSystems: { 'com.apple.fps': { licenseUrl: FAIRPLAY_LICENSE } } };

      media.source = { ...media.source, engine: { nativeHls: { ...nativeHls } } };
      media.load();

      fireDurationChange(video, Infinity);
      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.source = { ...media.source, engine: { nativeHls: { ...nativeHls } } };
      media.load();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('rendition caps', () => {
    const M3U8 = 'https://example.com/video.m3u8';
    const built: HlsJsAdapter[] = [];

    afterEach(async () => {
      // Let any queued load settle, then tear the engines down, so no manifest
      // request outlives the test that started it.
      await Promise.resolve();

      while (built.length) built.pop()!.destroy();
    });

    function setupMse(source: HlsSource = {}) {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const video = document.createElement('video');

      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      built.push(media);
      media.attach(video);
      media.source = { ...source, src: M3U8 };
      media.load();

      return { media, video };
    }

    /**
     * Minimal stand-in for an `Hls` instance, enough to build the controller the element installed and ask it what the
     * current policy resolves to.
     */
    function probeEngine(levels: Array<{ width: number; height: number; bitrate: number }>) {
      const listeners = new Map<string, Array<{ fn: (...args: any[]) => void; ctx: unknown }>>();

      return {
        levels,
        autoLevelCapping: -1,
        autoLevelEnabled: true,
        logger: { log: () => {} },
        config: { capLevelToPlayerSize: false, ignoreDevicePixelRatio: true, maxDevicePixelRatio: Infinity },
        on(event: string, fn: (...args: any[]) => void, ctx?: unknown) {
          listeners.set(event, [...(listeners.get(event) ?? []), { fn, ctx }]);
        },
        off: () => {},
        emit(event: string, data: unknown) {
          for (const { fn, ctx } of listeners.get(event) ?? []) fn.call(ctx, event, data);
        },
      } as unknown as Hls;
    }

    const LADDER = [
      { width: 640, height: 360, bitrate: 800_000 },
      { width: 1280, height: 720, bitrate: 2_800_000 },
      { width: 1920, height: 1080, bitrate: 5_000_000 },
    ];

    /**
     * What the engine's installed cap controller resolves the policy to now.
     *
     * The probe defaults to a viewport larger than the whole ladder, so the player-size ceiling never binds and a
     * requested resolution is what is being measured. Pass a smaller one to measure the size cap itself.
     */
    function cappedIndex(media: HlsJsAdapter, playerSize = { width: 4096, height: 2160 }) {
      const engine = probeEngine(LADDER);
      const Controller = media.engine!.config.capLevelController;
      const controller = new Controller(engine);

      const probeVideo = document.createElement('video');

      probeVideo.width = playerSize.width;
      probeVideo.height = playerSize.height;
      (engine as any).emit(Hls.Events.MEDIA_ATTACHING, { media: probeVideo });

      const index = controller.getMaxLevel(LADDER.length - 1);

      controller.destroy();
      return index;
    }

    /** Small enough that every rung but the lowest is above what it needs. */
    const SMALL_PLAYER = { width: 320, height: 180 };

    it('installs its own cap-level controller over the hls.js default', () => {
      const { media } = setupMse();

      expect(media.engine!.config.capLevelController).not.toBe(Hls.DefaultConfig.capLevelController);
    });

    it('caps automatic selection at the requested resolution', () => {
      const { media } = setupMse({ maxAutoResolution: '720p' });

      expect(cappedIndex(media)).toBe(1);
    });

    it('does not recreate the engine when only the cap changes', () => {
      const { media } = setupMse({ maxAutoResolution: '1080p' });
      const engine = media.engine;

      media.source = { src: M3U8, maxAutoResolution: '720p' };
      media.load();

      // Capping is a playback preference, not engine construction: rebuilding
      // here would tear down the buffer and lose ABR's bandwidth estimate.
      expect(media.engine).toBe(engine);
      expect(cappedIndex(media)).toBe(1);
    });

    it('applies a cap added after playback started', () => {
      const { media } = setupMse();
      const engine = media.engine;

      expect(cappedIndex(media)).toBe(2);

      media.source = { src: M3U8, maxAutoResolution: '360p' };

      expect(media.engine).toBe(engine);
      expect(cappedIndex(media)).toBe(0);
    });

    it('returns to uncapped selection when the key is removed', () => {
      const { media } = setupMse({ maxAutoResolution: '360p' });

      media.source = { src: M3U8 };

      expect(cappedIndex(media)).toBe(2);
    });

    it('keeps the cap when only src changes', () => {
      const { media } = setupMse({ maxAutoResolution: '720p' });

      media.src = 'https://example.com/other.m3u8';

      expect(media.source).toEqual({ src: 'https://example.com/other.m3u8', maxAutoResolution: '720p' });
      expect(cappedIndex(media)).toBe(1);
    });

    it('carries the cap onto an engine rebuilt for new hls.js options', () => {
      const { media } = setupMse({ maxAutoResolution: '720p' });
      const engine = media.engine;

      media.source = { src: M3U8, maxAutoResolution: '720p', engine: { hlsJs: { maxBufferLength: 60 } } };
      media.load();

      expect(media.engine).not.toBe(engine);
      expect(cappedIndex(media)).toBe(1);
    });

    it('warns and ignores the cap on native playback', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const media = new HlsJsAdapter();

      built.push(media);
      media.attach(document.createElement('video'));
      media.source = { src: M3U8, type: ContentTypes.M3U8, preferPlayback: 'native', maxAutoResolution: '720p' };
      media.load();

      expect(media.engine).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('`maxAutoResolution` requires the hls.js (MSE) engine')
      );
    });

    describe('capRenditionToPlayerSize', () => {
      it('caps to the element size by default', () => {
        const { media } = setupMse();

        // 320 device px is covered by the 640×360 rung, but the default floor
        // holds the ceiling at 720p rather than dropping that far.
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(1);
      });

      it('stops capping to the element size when switched off', () => {
        const { media } = setupMse({ capRenditionToPlayerSize: false });

        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });

      it('does not recreate the engine when only the toggle changes', () => {
        const { media } = setupMse();
        const engine = media.engine;

        media.source = { src: M3U8, capRenditionToPlayerSize: false };
        media.load();

        expect(media.engine).toBe(engine);
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });

      it('keeps a false toggle when only src changes', () => {
        // A falsy value still has to survive the carry-over, which a truthiness
        // check on the way through would drop.
        const { media } = setupMse({ capRenditionToPlayerSize: false });

        media.src = 'https://example.com/other.m3u8';

        expect(media.source?.capRenditionToPlayerSize).toBe(false);
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });

      it('returns to capping when the key is removed', () => {
        const { media } = setupMse({ capRenditionToPlayerSize: false });

        media.source = { src: M3U8 };

        expect(cappedIndex(media, SMALL_PLAYER)).toBe(1);
      });
    });

    describe('minAutoResolution', () => {
      it('floors the size cap at the resolution named', () => {
        const { media } = setupMse({ minAutoResolution: '1080p' });

        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });

      it('does not raise an explicit maxAutoResolution', () => {
        const { media } = setupMse({ maxAutoResolution: '360p', minAutoResolution: '1080p' });

        // The ceiling the caller asked for is the stricter instruction. A floor
        // bounds how far the element's size may cap, and nothing else.
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(0);
      });

      it('weakens to nothing at the bottom of the ladder', () => {
        // There is no rung under 270p, so naming it lifts the floor for any
        // real ladder — the way to ask for strict player-size capping.
        const { media } = setupMse({ minAutoResolution: '270p' });

        expect(cappedIndex(media, SMALL_PLAYER)).toBe(0);
      });

      it('does not recreate the engine when only the floor changes', () => {
        const { media } = setupMse({ minAutoResolution: '720p' });
        const engine = media.engine;

        media.source = { src: M3U8, minAutoResolution: '1080p' };
        media.load();

        expect(media.engine).toBe(engine);
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });

      it('keeps the floor when only src changes', () => {
        const { media } = setupMse({ minAutoResolution: '1080p' });

        media.src = 'https://example.com/other.m3u8';

        expect(media.source?.minAutoResolution).toBe('1080p');
        expect(cappedIndex(media, SMALL_PLAYER)).toBe(2);
      });
    });

    it('warns about every cap native playback ignores', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const media = new HlsJsAdapter();

      built.push(media);
      media.attach(document.createElement('video'));
      media.source = {
        src: M3U8,
        type: ContentTypes.M3U8,
        preferPlayback: 'native',
        capRenditionToPlayerSize: false,
        minAutoResolution: '720p',
      };
      media.load();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('`capRenditionToPlayerSize`, `minAutoResolution` require the hls.js (MSE) engine')
      );
    });
  });

  describe('remote playback load', () => {
    // While the element's own remote playback session is connected, the adapter
    // leaves the engine alone and defers to the element's `load()`.
    function setupConnected(load: () => Promise<void>) {
      const video = document.createElement('video');

      Object.defineProperty(video, 'remote', {
        value: { state: 'connected' } as RemotePlaybackLike,
        configurable: true,
      });
      Object.defineProperty(video, 'load', { value: load, configurable: true });
      document.body.appendChild(video);

      const media = new HlsJsAdapter();

      media.attach(video);

      return { media };
    }

    it('awaits the element load while connected', async () => {
      let resolveLoad!: () => void;
      const load = vi.fn(() => new Promise<void>((resolve) => (resolveLoad = resolve)));
      const { media } = setupConnected(load);

      let settled = false;
      const result = media.load().then(() => {
        settled = true;
      });

      expect(load).toHaveBeenCalledTimes(1);
      await Promise.resolve();
      expect(settled).toBe(false);

      resolveLoad();
      await result;
      expect(settled).toBe(true);
    });

    it('rejects when the element load rejects', async () => {
      const load = vi.fn(() => Promise.reject(new Error('receiver failed')));
      const { media } = setupConnected(load);

      await expect(media.load()).rejects.toThrow('receiver failed');
    });
  });

  describe('destroy', () => {
    it('removes forwarding listeners from the native element', () => {
      const { media, video } = setup();

      const playHandler = vi.fn();

      media.addEventListener('play', playHandler);

      video.dispatchEvent(new Event('play'));
      expect(playHandler).toHaveBeenCalledOnce();

      media.destroy();
      playHandler.mockClear();

      video.dispatchEvent(new Event('play'));
      expect(playHandler).not.toHaveBeenCalled();
    });
  });

  describe('property proxying', () => {
    it('proxies paused from the native element', () => {
      const { media } = setup();

      expect(media.paused).toBe(true);
    });

    it('proxies volume to the native element', () => {
      const { media, video } = setup();

      media.volume = 0.5;
      expect(video.volume).toBe(0.5);
    });
  });

  describe('streamType', () => {
    it('defaults to `unknown` before load', () => {
      const media = new HlsJsAdapter();

      expect(media.streamType).toBe('unknown');
    });

    it('auto-detects `live` from a native delegate with infinite duration', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      fireDurationChange(video, Infinity);

      expect(media.streamType).toBe('live');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('auto-detects `on-demand` from a native delegate with finite duration', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      fireDurationChange(video, 120);

      expect(media.streamType).toBe('on-demand');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('dedupes `streamtypechange` when the detected value does not change', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      fireDurationChange(video, 120);
      fireDurationChange(video, 240);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('dispatches `streamtypechange` once per transition when the engine is recreated', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      fireDurationChange(video, Infinity);
      expect(media.streamType).toBe('live');

      handler.mockClear();
      // `engine.hlsJs.debug` is part of `HlsJsAdapter`'s engine key — toggling it
      // recreates the native delegate without switching playback engines.
      media.source = { type: ContentTypes.M3U8, preferPlayback: 'native', engine: { hlsJs: { debug: true } } };
      media.load();

      // Teardown: a single `live` → `unknown`, then the new delegate re-detects
      // `live` from the same element during `attach`.
      expect(handler).toHaveBeenCalledTimes(2);
      expect(media.streamType).toBe('live');
    });

    it('does not emit a transient auto-detected `streamType` before a user override when the native delegate is recreated', () => {
      const { media, video } = setup();

      Object.defineProperty(video, 'duration', { value: 120, configurable: true });
      media.streamType = 'live';
      expect(media.streamType).toBe('live');

      const seen: string[] = [];

      media.addEventListener('streamtypechange', () => {
        seen.push(media.streamType);
      });

      // Recreates the native delegate; duration would otherwise sync-detect as `on-demand`.
      media.source = { type: ContentTypes.M3U8, preferPlayback: 'native', engine: { hlsJs: { debug: true } } };
      media.load();

      expect(seen).not.toContain('on-demand');
      expect(media.streamType).toBe('live');
    });

    it('lets user-set values win over auto-detection', () => {
      const { media, video } = setup();

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.streamType = 'live';
      expect(media.streamType).toBe('live');
      expect(handler).toHaveBeenCalledOnce();

      fireDurationChange(video, 120);
      expect(media.streamType).toBe('live');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('clears the user override when set back to `unknown`', () => {
      const { media, video } = setup();

      media.streamType = 'live';
      fireDurationChange(video, 120);
      expect(media.streamType).toBe('live');

      media.streamType = 'unknown';

      expect(media.streamType).toBe('on-demand');
    });

    it('dispatches `streamtypechange` when set before a delegate exists', () => {
      const media = new HlsJsAdapter();
      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.streamType = 'live';

      expect(media.streamType).toBe('live');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('preserves a user-set value across `load()` on the same engine', () => {
      const { media, video } = setup();

      media.streamType = 'live';

      const handler = vi.fn();

      media.addEventListener('streamtypechange', handler);

      media.load();

      expect(media.streamType).toBe('live');
      expect(handler).not.toHaveBeenCalled();

      fireDurationChange(video, 120);
      expect(media.streamType).toBe('live');
      expect(handler).not.toHaveBeenCalled();
    });

    it('preserves a user-set value across engine recreation', () => {
      const { media } = setup();

      media.streamType = 'live';
      expect(media.streamType).toBe('live');

      media.source = { type: ContentTypes.M3U8, preferPlayback: 'mse' };
      media.load();

      expect(media.streamType).toBe('live');
    });

    it('stops preserving after the user override is cleared with `unknown`', () => {
      const { media } = setup();

      media.streamType = 'live';
      media.streamType = 'unknown';

      media.source = { type: ContentTypes.M3U8, preferPlayback: 'mse' };
      media.load();

      expect(media.streamType).toBe('unknown');
    });
  });

  describe('live edge', () => {
    it('defaults to `NaN` for both values before load', () => {
      const media = new HlsJsAdapter();

      expect(media.liveEdgeStart).toBeNaN();
      expect(media.targetLiveWindow).toBeNaN();
    });

    it('forwards `NaN` from the native delegate', () => {
      const { media } = setup();

      expect(media.liveEdgeStart).toBeNaN();
      expect(media.targetLiveWindow).toBeNaN();
    });

    it('returns `NaN` again after destroy', () => {
      const { media } = setup();

      media.destroy();

      expect(media.liveEdgeStart).toBeNaN();
      expect(media.targetLiveWindow).toBeNaN();
    });
  });

  describe('disableRemotePlayback', () => {
    /**
     * Jsdom implements neither WebKit's AirPlay APIs nor a `textTracks` list the hls.js mixins can subscribe to, so the
     * AirPlay bridge needs both stubbed before it will run against a video element.
     */
    function stubAirPlay(video: HTMLVideoElement) {
      Object.defineProperty(video, 'webkitCurrentPlaybackTargetIsWireless', {
        configurable: true,
        writable: true,
        value: false,
      });
      Object.defineProperty(video, 'textTracks', {
        configurable: true,
        value: Object.assign(new EventTarget(), { length: 0, [Symbol.iterator]: () => [][Symbol.iterator]() }),
      });
      return video;
    }

    function createAirPlayVideo() {
      const video = stubAirPlay(document.createElement('video'));

      document.body.appendChild(video);
      return video;
    }

    function createMseMedia() {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);
      return new HlsJsAdapter();
    }

    /** Builds the hls.js engine and attaches it to the already-attached element. */
    function loadMse(media: HlsJsAdapter) {
      media.source = { src: 'https://example.com/master.m3u8', type: ContentTypes.M3U8 };
      media.load();
    }

    /** Hls.js forces the flag on for ManagedMediaSource inside `attachMedia`. */
    function simulateHlsJsMmsAttach(video: HTMLVideoElement) {
      video.disableRemotePlayback = true;
    }

    /** Hls.js emits MEDIA_ATTACHED only once the media source opens. */
    function fireMediaAttached(media: HlsJsAdapter, video: HTMLVideoElement) {
      media.engine!.trigger(Hls.Events.MEDIA_ATTACHED, { media: video } as any);
      // The bridge appends the AirPlay fallback source in the same pass; if it
      // is missing the bridge never ran and the assertions below prove nothing.
      expect(video.querySelector('source')).not.toBeNull();
    }

    beforeEach(() => {
      (globalThis as any).WebKitPlaybackTargetAvailabilityEvent = class {};
    });

    afterEach(() => {
      delete (globalThis as any).WebKitPlaybackTargetAvailabilityEvent;
    });

    it('enables AirPlay when nothing opted out', () => {
      const video = createAirPlayVideo();
      const media = createMseMedia();

      media.attach(video);
      loadMse(media);

      simulateHlsJsMmsAttach(video);
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(false);
    });

    it('honors a disableremoteplayback attribute on the custom element', () => {
      // The binding layer converts markup into a media API call, so the opt-out
      // is known before an engine exists rather than read off the element.
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);
      document.body.innerHTML = '<test-airplay-video disableremoteplayback></test-airplay-video>';

      const el = document.querySelector('test-airplay-video') as HTMLElement & { adapter: HlsJsAdapter };
      const video = stubAirPlay(el.shadowRoot!.querySelector('video')!);
      const media = el.adapter;

      expect(media.disableRemotePlayback).toBe(true);

      loadMse(media);
      simulateHlsJsMmsAttach(video);
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(true);
    });

    it('honors an opt-out set before attach once the engine attaches', () => {
      // React's ordering: `useSyncProps` sets the prop during render, the ref
      // attaches on commit, and the engine is built after that.
      const video = createAirPlayVideo();
      const media = createMseMedia();

      media.disableRemotePlayback = true;
      media.attach(video);
      loadMse(media);

      simulateHlsJsMmsAttach(video);
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(true);
    });

    it('ignores a flag only ever set on the video element', () => {
      const video = createAirPlayVideo();

      video.disableRemotePlayback = true;

      const media = createMseMedia();

      media.attach(video);
      loadMse(media);
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(false);
    });

    it('honors the media API set before the engine is created', () => {
      const video = createAirPlayVideo();
      const media = createMseMedia();

      media.attach(video);
      media.disableRemotePlayback = true;

      loadMse(media);

      simulateHlsJsMmsAttach(video);
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(true);
    });

    it('honors the media API set after the engine attached', () => {
      const video = createAirPlayVideo();
      const media = createMseMedia();

      media.attach(video);
      loadMse(media);

      simulateHlsJsMmsAttach(video);
      media.disableRemotePlayback = true;
      fireMediaAttached(media, video);

      expect(video.disableRemotePlayback).toBe(true);
    });
  });
});

describe('NativeHlsAdapter streamType', () => {
  function setupNative() {
    const video = document.createElement('video');

    document.body.appendChild(video);
    const media = new NativeHlsAdapter();

    media.attach(video);
    return { media, video };
  }

  it('defaults to `unknown`', () => {
    const media = new NativeHlsAdapter();

    expect(media.streamType).toBe('unknown');
  });

  it('detects `live` and fires `streamtypechange`', () => {
    const { media, video } = setupNative();

    const handler = vi.fn();

    media.addEventListener('streamtypechange', handler);

    fireDurationChange(video, Infinity);

    expect(media.streamType).toBe('live');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('honors a user override and clears it on `unknown`', () => {
    const { media, video } = setupNative();

    media.streamType = 'live';
    fireDurationChange(video, 120);
    expect(media.streamType).toBe('live');

    media.streamType = 'unknown';
    expect(media.streamType).toBe('on-demand');
  });
});
