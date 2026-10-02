import { Hls } from '@videojs/hlsjs-video';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxVideoAdapter, type MuxSource } from '..';

// Every Mux source fetches its metadata, and native playback fetches the
// manifest alongside; neither should reach the network from here. Tests that
// care about a response stub their own.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Header `{"alg":"HS256"}`, body sets `aud`, empty signature. Unpadded base64url,
// like a real JWT, so it survives a query string untouched.
function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode({ alg: 'HS256' })}.${encode(payload)}.`;
}

const LADDER = [
  { width: 640, height: 360, bitrate: 800_000 },
  { width: 1280, height: 720, bitrate: 2_800_000 },
  { width: 1920, height: 1080, bitrate: 5_000_000 },
  { width: 2560, height: 1440, bitrate: 9_000_000 },
];

/** Give the running engine a rendition ladder and start its real size-capping loop. */
function startCapping(media: MuxVideoAdapter) {
  const engine = media.engine!;

  Object.defineProperty(engine, 'levels', { configurable: true, value: LADDER });
  engine.config.capLevelToPlayerSize = false;
  engine.capLevelToPlayerSize = true;
  return engine;
}

// `source` and `src` request a load on a microtask, so give it a chance to run.
function flushLoad() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('MuxVideoAdapter', () => {
  it('defaults source to null', () => {
    expect(new MuxVideoAdapter().source).toBeNull();
  });

  it('derives src from source.playbackId', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8');
  });

  it('clears src when source is cleared', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };
    media.source = null;

    expect(media.src).toBe('');
  });

  it('derives src from the custom domain and playback params', () => {
    const media = new MuxVideoAdapter();

    media.source = {
      playbackId: 'abc123',
      customDomain: 'example.com',
      playback: {
        maxResolution: '1080p',
        minResolution: '480p',
        renditionOrder: 'desc',
        assetStartTime: 3,
        assetEndTime: 4,
        customParam: 'x',
      },
    };

    const url = new URL(media.src);

    expect(url.hostname).toBe('stream.example.com');
    expect(url.searchParams.get('max_resolution')).toBe('1080p');
    expect(url.searchParams.get('min_resolution')).toBe('480p');
    expect(url.searchParams.get('rendition_order')).toBe('desc');
    expect(url.searchParams.get('asset_start_time')).toBe('3');
    expect(url.searchParams.get('asset_end_time')).toBe('4');
    expect(url.searchParams.get('custom_param')).toBe('x');
  });

  it('applies a playback token and drops all other playback params', () => {
    const media = new MuxVideoAdapter();

    media.source = {
      playbackId: 'abc123',
      playback: { token: 'jwt', maxResolution: '1080p', assetStartTime: 3 },
    };

    const url = new URL(media.src);

    expect(url.searchParams.get('token')).toBe('jwt');
    expect(url.searchParams.has('max_resolution')).toBe(false);
    expect(url.searchParams.has('asset_start_time')).toBe(false);
  });

  it('parses source from a Mux stream src', () => {
    const media = new MuxVideoAdapter();

    media.src = 'https://stream.mux.com/abc123.m3u8';

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8');
    expect(media.source).toEqual({ playbackId: 'abc123' });
  });

  it('parses source from a Mux stream src without the .m3u8 extension', () => {
    const media = new MuxVideoAdapter();

    media.src = 'https://stream.mux.com/abc123?max_resolution=1080p';

    expect(media.source).toEqual({ playbackId: 'abc123', playback: { maxResolution: '1080p' } });
    expect(media.contentData.poster).toBe('https://image.mux.com/abc123/thumbnail.webp');
  });

  it('parses the custom domain and playback params from a Mux stream src', () => {
    const media = new MuxVideoAdapter();

    media.src = 'https://stream.example.com/abc123.m3u8?token=jwt';

    expect(media.source).toEqual({
      playbackId: 'abc123',
      customDomain: 'example.com',
      playback: { token: 'jwt' },
    });
  });

  it('keeps a non-Mux src as a plain source url', () => {
    const media = new MuxVideoAdapter();

    media.src = 'https://example.com/custom.m3u8';

    expect(media.src).toBe('https://example.com/custom.m3u8');
    expect(media.source).toEqual({ src: 'https://example.com/custom.m3u8' });
  });

  it('plays a non-Mux source url given through source', () => {
    const media = new MuxVideoAdapter();

    media.source = { src: 'https://example.com/custom.m3u8', preferPlayback: 'native' };

    expect(media.src).toBe('https://example.com/custom.m3u8');
  });

  it('preserves engine options and caps across a src change', async () => {
    vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

    const media = new MuxVideoAdapter();
    const video = document.createElement('video');

    video.width = 320;
    video.height = 180;
    media.attach(video);
    media.source = {
      playbackId: 'abc123',
      preferPlayback: 'mse',
      engine: { hlsJs: { maxBufferLength: 73 } },
      maxAutoResolution: '1080p',
      capRenditionToPlayerSize: false,
      minAutoResolution: '270p',
    };
    await flushLoad();

    media.src = 'https://stream.mux.com/other.m3u8';
    await flushLoad();

    expect(media.source?.preferPlayback).toBe('mse');
    expect(media.engine!.config.maxBufferLength).toBe(73);

    const engine = startCapping(media);

    expect(engine.autoLevelCapping).toBe(2);

    // Enabling size capping exposes the carried floor independently of the ceiling.
    media.source = { ...media.source, capRenditionToPlayerSize: true };
    expect(engine.autoLevelCapping).toBe(0);

    media.destroy();
  });

  it('keeps source.poster as data, without applying it to the media poster', () => {
    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));

    media.source = { playbackId: 'abc123', poster: { time: 5 } };

    expect(media.source?.poster).toEqual({ time: 5 });
    expect(media.poster).toBe('');
  });

  it('exposes the content poster and storyboard derived from source', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123', poster: { time: 5, ext: 'jpg' }, storyboard: { format: 'jpg' } };

    expect(media.contentData).toEqual({
      poster: 'https://image.mux.com/abc123/thumbnail.jpg?time=5',
      storyboard: 'https://image.mux.com/abc123/storyboard.vtt?format=jpg',
    });
  });

  it('has no content data without a playback id', () => {
    const media = new MuxVideoAdapter();

    expect(media.contentData).toEqual({});

    media.src = 'https://example.com/custom.m3u8';

    expect(media.contentData).toEqual({});
  });

  it('has no content data for signed playback without image tokens', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123', playback: { token: 'jwt' } };

    expect(media.contentData).toEqual({});
  });

  it('dispatches `contentdatachange` when the derived urls change', () => {
    const media = new MuxVideoAdapter();
    const handler = vi.fn();

    media.addEventListener('contentdatachange', handler);

    media.source = { playbackId: 'abc123' };

    expect(handler).toHaveBeenCalledTimes(1);
    expect(media.contentData.poster).toBe('https://image.mux.com/abc123/thumbnail.webp');

    media.source = { playbackId: 'xyz789' };

    expect(handler).toHaveBeenCalledTimes(2);
    expect(media.contentData.poster).toBe('https://image.mux.com/xyz789/thumbnail.webp');
    expect(media.contentData.storyboard).toBe('https://image.mux.com/xyz789/storyboard.vtt?format=webp');
  });

  it('dedupes `contentdatachange` when a source change leaves the urls alone', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };

    const handler = vi.fn();

    media.addEventListener('contentdatachange', handler);

    // A new object, so `sourcechange` still fires, but nothing the images are
    // built from moved.
    media.source = { playbackId: 'abc123', playback: { maxResolution: '720p' } };

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears the content data and announces it when the source is dropped', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };

    const handler = vi.fn();

    media.addEventListener('contentdatachange', handler);

    media.source = null;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(media.contentData).toEqual({});
  });

  it('has the content data in step when `sourcechange` fires', () => {
    const media = new MuxVideoAdapter();
    const seen: (string | null | undefined)[] = [];

    media.addEventListener('sourcechange', () => seen.push(media.contentData.poster));

    media.source = { playbackId: 'abc123' };

    expect(seen).toEqual(['https://image.mux.com/abc123/thumbnail.webp']);
  });

  it('hands back the same content data object until it changes', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };

    const first = media.contentData;

    expect(media.contentData).toBe(first);

    media.source = { playbackId: 'xyz789' };

    expect(media.contentData).not.toBe(first);
  });

  it('does not reload when only image params change', async () => {
    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));
    media.source = { playbackId: 'abc123', preferPlayback: 'native' };
    await flushLoad();

    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // `poster` describes an image, not the stream, so playback must not restart.
    media.source = { playbackId: 'abc123', preferPlayback: 'native', poster: { time: 5 } };
    await flushLoad();

    expect(loadstart).not.toHaveBeenCalled();
  });

  it('inherits maxAutoResolution without restarting playback', async () => {
    vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));
    media.source = { playbackId: 'abc123', maxAutoResolution: '1080p', capRenditionToPlayerSize: false };
    await flushLoad();

    const engine = startCapping(media);
    const loadstart = vi.fn();

    expect(engine.autoLevelCapping).toBe(2);
    media.addEventListener('loadstart', loadstart);

    media.source = { playbackId: 'abc123', maxAutoResolution: '720p', capRenditionToPlayerSize: false };
    await flushLoad();

    expect(engine.autoLevelCapping).toBe(1);
    expect(media.engine).toBe(engine);
    expect(loadstart).not.toHaveBeenCalled();

    media.destroy();
  });

  it('keeps the client-side cap separate from the server-side manifest filter', async () => {
    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));
    // `playback.maxResolution` asks Mux to leave higher renditions out of the
    // manifest; `maxAutoResolution` caps what ABR picks from the ones that
    // arrive. Only the former belongs in the URL.
    media.source = {
      playbackId: 'abc123',
      preferPlayback: 'native',
      playback: { maxResolution: '1080p' },
      maxAutoResolution: '720p',
    };
    await flushLoad();

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8?max_resolution=1080p');
    expect(media.source?.maxAutoResolution).toBe('720p');

    media.destroy();
  });

  it('inherits the player-size caps without restarting playback', async () => {
    vi.spyOn(Hls, 'isSupported').mockReturnValue(true);
    vi.stubGlobal('devicePixelRatio', 1);

    const media = new MuxVideoAdapter();
    const video = document.createElement('video');

    video.width = 320;
    video.height = 180;
    media.attach(video);
    media.source = { playbackId: 'abc123', capRenditionToPlayerSize: false, minAutoResolution: '270p' };
    await flushLoad();

    const engine = startCapping(media);
    const loadstart = vi.fn();

    expect(engine.autoLevelCapping).toBe(3);
    media.addEventListener('loadstart', loadstart);

    media.source = { playbackId: 'abc123', capRenditionToPlayerSize: true, minAutoResolution: '270p' };
    await flushLoad();
    expect(engine.autoLevelCapping).toBe(0);

    media.source = { playbackId: 'abc123', capRenditionToPlayerSize: true, minAutoResolution: '1080p' };
    await flushLoad();
    expect(engine.autoLevelCapping).toBe(2);
    expect(media.engine).toBe(engine);
    expect(loadstart).not.toHaveBeenCalled();

    media.destroy();
  });

  it('keeps the client-side floor separate from the server-side one it resembles', async () => {
    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));
    // `playback.minResolution` asks Mux which renditions to put in the manifest.
    // `minAutoResolution` is unrelated: it bounds how far the element's own size
    // may cap what arrives. Only the former belongs in the URL.
    media.source = {
      playbackId: 'abc123',
      preferPlayback: 'native',
      playback: { minResolution: '480p' },
      minAutoResolution: '720p',
    };
    await flushLoad();

    expect(media.src).toBe('https://stream.mux.com/abc123.m3u8?min_resolution=480p');
    expect(media.source?.minAutoResolution).toBe('720p');

    media.destroy();
  });

  it('reloads when the playback id changes', async () => {
    const media = new MuxVideoAdapter();

    media.attach(document.createElement('video'));
    media.source = { playbackId: 'abc123', preferPlayback: 'native' };
    await flushLoad();

    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    media.source = { playbackId: 'xyz789', preferPlayback: 'native' };
    await flushLoad();

    expect(loadstart).toHaveBeenCalled();
  });

  it('fires sourcechange when source is set', () => {
    const media = new MuxVideoAdapter();
    const onSourceChange = vi.fn(() => media.source);

    media.addEventListener('sourcechange', onSourceChange);

    media.source = { playbackId: 'abc123' };

    expect(onSourceChange).toHaveBeenCalledTimes(1);
    // The new source is readable when the event fires.
    expect(onSourceChange).toHaveReturnedWith({ playbackId: 'abc123' });

    media.source = null;

    expect(onSourceChange).toHaveBeenCalledTimes(2);
  });

  it('ignores the same source object', () => {
    const media = new MuxVideoAdapter();
    const source = { playbackId: 'abc123' };

    media.source = source;

    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);
    media.source = source;

    expect(onSourceChange).not.toHaveBeenCalled();
  });

  it('announces a new source object even when it is equal', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123' };

    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);
    media.source = { playbackId: 'abc123' };

    expect(onSourceChange).toHaveBeenCalledOnce();
  });

  it('fires sourcechange when a Mux stream src is parsed', () => {
    const media = new MuxVideoAdapter();
    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);

    media.src = 'https://stream.mux.com/abc123.m3u8';

    expect(onSourceChange).toHaveBeenCalledTimes(1);
  });

  it('fires sourcechange when a non-Mux src replaces another', () => {
    const media = new MuxVideoAdapter();

    media.src = 'https://example.com/a.m3u8';

    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);
    media.src = 'https://example.com/b.m3u8';

    expect(onSourceChange).toHaveBeenCalledOnce();
    expect(media.source).toEqual({ src: 'https://example.com/b.m3u8' });
  });

  it('ignores a src that already describes the current source', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123', poster: { time: 5 } };

    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);

    // `<mux-video>` reflects the derived URL back to the host, so this has to be
    // a no-op rather than re-deriving and dropping `poster`.
    media.src = 'https://stream.mux.com/abc123.m3u8';

    expect(onSourceChange).not.toHaveBeenCalled();
    expect(media.source).toEqual({ playbackId: 'abc123', poster: { time: 5 } });
  });

  it('ignores an extension-less src that describes the current source', () => {
    const media = new MuxVideoAdapter();

    media.source = { playbackId: 'abc123', poster: { time: 5 } };

    const onSourceChange = vi.fn();

    media.addEventListener('sourcechange', onSourceChange);

    // `src` reads back as the `.m3u8` form, so React re-syncs the authored URL on
    // every render.
    media.src = 'https://stream.mux.com/abc123';

    expect(onSourceChange).not.toHaveBeenCalled();
    expect(media.source).toEqual({ playbackId: 'abc123', poster: { time: 5 } });
  });

  describe('drm', () => {
    const DRM_TOKEN = fakeJwt({ aud: 'd' });
    const PLAYBACK_TOKEN = fakeJwt({ aud: 'v' });

    function setupMse() {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const media = new MuxVideoAdapter();

      media.attach(document.createElement('video'));
      return media;
    }

    /** A CDM that grants access, so key exchange gets as far as the certificate. */
    function stubNativeKeySystem() {
      const session = { addEventListener() {}, generateRequest: async () => {}, close: async () => {} };
      const mediaKeys = { createSession: () => session, setServerCertificate: async () => true };

      vi.stubGlobal('navigator', {
        ...navigator,
        requestMediaKeySystemAccess: async () => ({ createMediaKeys: async () => mediaKeys }),
      });

      // Answers the certificate request, and the metadata one every Mux source
      // makes alongside it.
      const fetchMock = vi.fn(
        async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4), json: async () => [] }) as Response
      );

      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    async function setupNative(source: MuxSource) {
      const media = new MuxVideoAdapter();
      const video = document.createElement('video');

      video.setMediaKeys = async () => {};
      media.attach(video);
      media.source = { playbackId: 'abc123', preferPlayback: 'native', ...source };
      await flushLoad();
      return { media, video };
    }

    /** Jsdom has no `MediaEncryptedEvent`; only these two fields are read. */
    function fireEncrypted(video: HTMLVideoElement) {
      video.dispatchEvent(Object.assign(new Event('encrypted'), { initDataType: 'skd', initData: new ArrayBuffer(8) }));
    }

    it('configures the hls.js engine from a DRM token', async () => {
      const media = setupMse();

      media.source = { playbackId: 'abc123' };
      await flushLoad();
      expect(media.engine!.config.emeEnabled).toBe(false);

      media.source = { playbackId: 'abc123', playback: { token: PLAYBACK_TOKEN }, drm: { token: DRM_TOKEN } };
      await flushLoad();

      expect(media.engine!.config.emeEnabled).toBe(true);
      expect(media.engine!.config.drmSystems).toEqual({
        'com.apple.fps': {
          licenseUrl: `https://license.mux.com/license/fairplay/abc123?token=${DRM_TOKEN}`,
          serverCertificateUrl: `https://license.mux.com/appcert/fairplay/abc123?token=${DRM_TOKEN}`,
        },
        'com.widevine.alpha': { licenseUrl: `https://license.mux.com/license/widevine/abc123?token=${DRM_TOKEN}` },
        'com.microsoft.playready': {
          licenseUrl: `https://license.mux.com/license/playready/abc123?token=${DRM_TOKEN}`,
        },
      });
    });

    it('keeps the Mux token out of the source handed to the engine', async () => {
      const media = setupMse();

      media.source = { playbackId: 'abc123', drm: { token: DRM_TOKEN } };
      await flushLoad();

      // `drm` stays Mux's own authoring input; only the derived license servers
      // reach the HLS layer.
      expect(media.source).toEqual({ playbackId: 'abc123', drm: { token: DRM_TOKEN } });
    });

    it('configures native FairPlay from the same DRM token', async () => {
      const fetchMock = stubNativeKeySystem();
      const { video } = await setupNative({ drm: { token: DRM_TOKEN }, playback: { token: PLAYBACK_TOKEN } });

      fireEncrypted(video);
      await flushLoad();

      // Which engine plays is decided later, so one token configures both paths:
      // the native one reaches Mux's servers rather than failing for want of them.
      expect(fetchMock).toHaveBeenCalledWith(
        `https://license.mux.com/appcert/fairplay/abc123?token=${DRM_TOKEN}`,
        expect.anything()
      );
    });

    it('lets an explicit nativeHls.drmSystems override the derived one', async () => {
      const fetchMock = stubNativeKeySystem();
      const { video } = await setupNative({
        drm: { token: DRM_TOKEN },
        engine: {
          nativeHls: {
            drmSystems: {
              'com.apple.fps': {
                licenseUrl: 'https://drm.example/fairplay',
                serverCertificateUrl: 'https://drm.example/appcert',
              },
            },
          },
        },
      });

      fireEncrypted(video);
      await flushLoad();

      expect(fetchMock).toHaveBeenCalledWith('https://drm.example/appcert', expect.anything());
      expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('license.mux.com'), expect.anything());
    });

    it('lets a license server named alongside the token replace the derived one', async () => {
      const media = setupMse();

      media.source = {
        playbackId: 'abc123',
        drm: { token: DRM_TOKEN, 'com.widevine.alpha': { licenseUrl: 'https://drm.example/widevine' } },
      };
      await flushLoad();

      // `drm` is the standard shape with a Mux token folded in, so the two mix:
      // Widevine is licensed by the caller, the rest by Mux.
      expect(media.engine!.config.drmSystems).toEqual({
        'com.apple.fps': {
          licenseUrl: `https://license.mux.com/license/fairplay/abc123?token=${DRM_TOKEN}`,
          serverCertificateUrl: `https://license.mux.com/appcert/fairplay/abc123?token=${DRM_TOKEN}`,
        },
        'com.widevine.alpha': { licenseUrl: 'https://drm.example/widevine' },
        'com.microsoft.playready': {
          licenseUrl: `https://license.mux.com/license/playready/abc123?token=${DRM_TOKEN}`,
        },
      });
    });

    it('lets an explicit hlsJs.drmSystems override the derived one', async () => {
      const media = setupMse();

      media.source = {
        playbackId: 'abc123',
        drm: { token: DRM_TOKEN },
        engine: { hlsJs: { drmSystems: { 'com.widevine.alpha': { licenseUrl: 'https://drm.example/license' } } } },
      };
      await flushLoad();

      // EME still switches on, but the caller's license servers stand.
      expect(media.engine!.config.emeEnabled).toBe(true);
      expect(media.engine!.config.drmSystems).toEqual({
        'com.widevine.alpha': { licenseUrl: 'https://drm.example/license' },
      });
    });

    it('does not reload for an equivalent DRM token', async () => {
      const media = setupMse();

      media.source = { playbackId: 'abc123', drm: { token: DRM_TOKEN } };
      await flushLoad();

      const loadstart = vi.fn();

      media.addEventListener('loadstart', loadstart);

      media.source = { playbackId: 'abc123', drm: { token: DRM_TOKEN } };
      await flushLoad();

      expect(loadstart).not.toHaveBeenCalled();
    });

    it('reloads when the DRM token changes', async () => {
      const media = setupMse();

      media.source = { playbackId: 'abc123', drm: { token: DRM_TOKEN } };
      await flushLoad();

      const loadstart = vi.fn();

      media.addEventListener('loadstart', loadstart);

      media.source = { playbackId: 'abc123', drm: { token: fakeJwt({ aud: 'd', exp: 1 }) } };
      await flushLoad();

      expect(loadstart).toHaveBeenCalled();
    });
  });

  describe('metadata', () => {
    // The document Mux serves: Apple's JSON chapters, the first chapter standing
    // for the asset.
    const DOCUMENT = [
      {
        'start-time': 0,
        titles: [{ language: 'und', title: 'Big Buck Bunny' }],
        metadata: [{ key: 'com.mux.video.branding', value: 'mux-free-plan' }],
      },
    ];

    function stubFetch(body: unknown = DOCUMENT, status = 200) {
      const fetchMock = vi.fn(async (input: string | URL | Request) => {
        const url = input instanceof Request ? input.url : String(input);
        // The native live mixin fetches the manifest in parallel; only the
        // metadata document is answered here.
        if (!url.includes('metadata.json')) return new Response('', { status: 404 });

        return new Response(JSON.stringify(body), { status });
      });

      vi.stubGlobal('fetch', fetchMock);

      return fetchMock;
    }

    function metadataRequests(fetchMock: ReturnType<typeof stubFetch>) {
      return fetchMock.mock.calls.map(([input]) => String(input)).filter((url) => url.includes('metadata.json'));
    }

    it('has no title until the metadata has loaded', () => {
      stubFetch();

      const media = new MuxVideoAdapter();

      media.source = { playbackId: 'abc123' };

      expect(media.contentData.title).toBeUndefined();
    });

    it('loads the metadata with the source, over hls.js', async () => {
      vi.spyOn(Hls, 'isSupported').mockReturnValue(true);

      const fetchMock = stubFetch();
      const media = new MuxVideoAdapter();
      const handler = vi.fn();

      media.attach(document.createElement('video'));
      media.addEventListener('contentdatachange', handler);
      media.source = { playbackId: 'abc123' };
      await flushLoad();

      expect(media.engine).not.toBeNull();
      expect(metadataRequests(fetchMock)).toEqual(['https://stream.mux.com/abc123/metadata.json']);
      expect(media.contentData).toEqual({
        title: 'Big Buck Bunny',
        'com.mux.video.branding': 'mux-free-plan',
        poster: 'https://image.mux.com/abc123/thumbnail.webp',
        storyboard: 'https://image.mux.com/abc123/storyboard.vtt?format=webp',
      });
      // Once for the URLs with `source`, once for the metadata.
      expect(handler).toHaveBeenCalledTimes(2);

      media.destroy();
    });

    it('loads the metadata with the source, over native playback, with the playback token', async () => {
      const fetchMock = stubFetch();
      const media = new MuxVideoAdapter();

      media.attach(document.createElement('video'));
      media.source = { playbackId: 'abc123', preferPlayback: 'native', playback: { token: 'jwt' } };
      await flushLoad();

      // Signed playback answers 403 without it.
      expect(metadataRequests(fetchMock)).toEqual(['https://stream.mux.com/abc123/metadata.json?token=jwt']);
      expect(media.contentData.title).toBe('Big Buck Bunny');

      media.destroy();
    });

    it('keeps the title when only image params change', async () => {
      const fetchMock = stubFetch();
      const media = new MuxVideoAdapter();

      media.attach(document.createElement('video'));
      media.source = { playbackId: 'abc123', preferPlayback: 'native' };
      await flushLoad();

      // What `poster-time` does through the element: same stream, new object,
      // and no reload to fetch the document again on.
      media.source = { playbackId: 'abc123', preferPlayback: 'native', poster: { time: 3 } };
      await flushLoad();

      expect(media.contentData.title).toBe('Big Buck Bunny');
      expect(media.contentData.poster).toBe('https://image.mux.com/abc123/thumbnail.webp?time=3');
      expect(metadataRequests(fetchMock)).toHaveLength(1);

      media.destroy();
    });

    it('drops the title with the playback id, before the next one loads', async () => {
      const fetchMock = stubFetch();
      const media = new MuxVideoAdapter();

      media.attach(document.createElement('video'));
      media.source = { playbackId: 'abc123', preferPlayback: 'native' };
      await flushLoad();

      const seen: (string | null | undefined)[] = [];

      media.addEventListener('sourcechange', () => seen.push(media.contentData.title));
      media.source = { playbackId: 'xyz789', preferPlayback: 'native' };

      expect(seen).toEqual([undefined]);

      await flushLoad();

      expect(metadataRequests(fetchMock)).toEqual([
        'https://stream.mux.com/abc123/metadata.json',
        'https://stream.mux.com/xyz789/metadata.json',
      ]);
      expect(media.contentData.title).toBe('Big Buck Bunny');

      media.destroy();
    });

    it('clears the title with the source', async () => {
      stubFetch();

      const media = new MuxVideoAdapter();

      media.attach(document.createElement('video'));
      media.source = { playbackId: 'abc123', preferPlayback: 'native' };
      await flushLoad();

      media.source = null;

      expect(media.contentData).toEqual({});
    });

    it('has no title for an asset without metadata', async () => {
      stubFetch([{ 'start-time': 0 }]);

      const media = new MuxVideoAdapter();
      const handler = vi.fn();

      media.attach(document.createElement('video'));
      media.source = { playbackId: 'abc123', preferPlayback: 'native' };
      media.addEventListener('contentdatachange', handler);
      await flushLoad();

      expect(media.contentData.title).toBeUndefined();
      // An empty document changes nothing, so nothing is announced.
      expect(handler).not.toHaveBeenCalled();

      media.destroy();
    });
  });
});
