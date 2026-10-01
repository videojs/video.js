import { PlayerExtensionCoordinator } from '@videojs/core/dom';
import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GoogleCastExtension, type GoogleCastExtensionProps } from '../index';
import { GoogleCastProvider } from '../provider';
import { ensureCastFramework } from '../registry';
import { currentSession, getCastContext, isHls } from '../utils';

const mocks = vi.hoisted(() => ({
  // Set per test to a fake framework so the provider initializes as if the Cast SDK had loaded.
  castFramework: undefined as typeof cast.framework | undefined,
}));

vi.mock('../registry', async (importOriginal) => {
  const original = await importOriginal<typeof import('../registry')>();

  return {
    ...original,
    get castFramework() {
      return mocks.castFramework;
    },
    ensureCastFramework: vi.fn(() => Promise.resolve({} as typeof cast.framework)),
  };
});

vi.mock('../utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils')>();

  return {
    ...original,
    getCastContext: vi.fn(),
    currentSession: vi.fn(),
    setCastOptions: vi.fn(),
    isHls: vi.fn(async () => false),
    getPlaylistSegmentFormat: vi.fn(async () => undefined),
  };
});

// The test environment's `video.textTracks` is not a spy-friendly EventTarget,
// so use a minimal structural target instead of a real element.
function createTarget(disableRemotePlayback = false) {
  const textTracks = new EventTarget();
  const target = Object.assign(new EventTarget(), {
    textTracks,
    disableRemotePlayback,
    paused: true,
    muted: false,
    pause: vi.fn(),
    querySelectorAll: () => [],
  }) as unknown as HTMLMediaTargetLike;

  return { target, textTracks };
}

/** Just enough of the Cast SDK for the provider to initialize, start a session, and send a load request. */
function createCastSdk() {
  const session = { loadMedia: vi.fn(async () => {}) };
  const context = {
    setOptions: vi.fn(),
    requestSession: vi.fn(async () => {}),
    getCurrentSession: () => session,
    getCastState: () => 'CONNECTED',
    getSessionState: () => 'SESSION_STARTED',
  };

  class RemotePlayer {
    controller: RemotePlayerController | null = null;
    isMuted = false;
    isMediaLoaded = false;
    isPaused = true;
  }

  class RemotePlayerController {
    constructor(player: RemotePlayer) {
      player.controller = this;
    }
    addEventListener() {}
    removeEventListener() {}
  }

  class MediaInfo {
    constructor(
      public contentId: string,
      public contentType: string
    ) {}
  }

  // SAFETY: covers every framework member `onCastFrameworkAvailable`, `requestCastSession`, and `load` touch.
  const framework = {
    RemotePlayer,
    RemotePlayerController,
    RemotePlayerEventType: {
      IS_CONNECTED_CHANGED: 'isConnectedChanged',
      DURATION_CHANGED: 'durationChanged',
      VOLUME_LEVEL_CHANGED: 'volumeLevelChanged',
      IS_MUTED_CHANGED: 'isMutedChanged',
      CURRENT_TIME_CHANGED: 'currentTimeChanged',
      VIDEO_INFO_CHANGED: 'videoInfoChanged',
      IS_PAUSED_CHANGED: 'isPausedChanged',
      PLAYER_STATE_CHANGED: 'playerStateChanged',
      IS_MEDIA_LOADED_CHANGED: 'isMediaLoadedChanged',
    },
    CastState: { NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE', CONNECTING: 'CONNECTING', CONNECTED: 'CONNECTED' },
    SessionState: { SESSION_RESUMED: 'SESSION_RESUMED' },
  } as unknown as typeof cast.framework;

  const chromeCast = {
    isAvailable: true,
    Image: class {
      constructor(public url: string) {}
    },
    media: {
      MediaInfo,
      GenericMediaMetadata: class {},
      LoadRequest: class {
        constructor(public media: MediaInfo) {}
      },
      StreamType: { LIVE: 'LIVE', BUFFERED: 'BUFFERED' },
      HlsSegmentFormat: { FMP4: 'fmp4', TS: 'ts' },
      HlsVideoSegmentFormat: { FMP4: 'fmp4', TS: 'ts' },
    },
  };

  return { framework, chromeCast, context, session };
}

/** A provider with a connected session. `config` is read live, so tests set `src` after the session starts. */
async function createCastingProvider(config: GoogleCastExtensionProps, target = createTarget().target) {
  const sdk = createCastSdk();

  mocks.castFramework = sdk.framework;
  vi.stubGlobal('cast', { framework: sdk.framework });
  vi.stubGlobal('chrome', { cast: sdk.chromeCast });
  // SAFETY: the fakes implement every context and session member the provider reaches on this path.
  vi.mocked(getCastContext).mockReturnValue(sdk.context as unknown as cast.framework.CastContext);
  vi.mocked(currentSession).mockReturnValue(sdk.session as unknown as cast.framework.CastSession);

  const provider = new GoogleCastProvider(config);

  provider.attach(target);
  await provider.requestCastSession();

  return { provider, target, session: sdk.session };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });

  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(ensureCastFramework).mockClear();
});

afterEach(() => {
  mocks.castFramework = undefined;
  vi.mocked(getCastContext).mockReset();
  vi.mocked(currentSession).mockReset();
  vi.unstubAllGlobals();
});

describe('GoogleCastProvider', () => {
  it('does not load the cast framework before a target is attached', () => {
    const provider = new GoogleCastProvider({});

    void provider.remote;

    expect(ensureCastFramework).not.toHaveBeenCalled();
  });

  it('does not load the cast framework on attach', () => {
    const provider = new GoogleCastProvider({});
    const { target } = createTarget();

    provider.attach(target);

    expect(ensureCastFramework).not.toHaveBeenCalled();
  });

  it('loads the cast framework when remote is read while attached', () => {
    const provider = new GoogleCastProvider({});
    const { target } = createTarget();

    provider.attach(target);
    void provider.remote;

    expect(ensureCastFramework).toHaveBeenCalledTimes(1);
  });

  it('does not load the cast framework when remote playback is disabled', () => {
    const provider = new GoogleCastProvider({});
    const { target } = createTarget(true);

    provider.attach(target);
    void provider.remote;

    expect(ensureCastFramework).not.toHaveBeenCalled();
  });

  it('adds and removes the text track change listener on attach/detach', () => {
    const provider = new GoogleCastProvider({});
    const { target, textTracks } = createTarget();
    const add = vi.spyOn(textTracks, 'addEventListener');
    const remove = vi.spyOn(textTracks, 'removeEventListener');

    provider.attach(target);
    expect(add).toHaveBeenCalledWith('change', expect.any(Function));

    provider.detach();
    expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0]![1]);
  });

  it('removes the text track change listener on destroy', () => {
    const provider = new GoogleCastProvider({});
    const { target, textTracks } = createTarget();
    const add = vi.spyOn(textTracks, 'addEventListener');
    const remove = vi.spyOn(textTracks, 'removeEventListener');

    provider.attach(target);
    provider.destroy();

    expect(remove).toHaveBeenCalledWith('change', add.mock.calls[0]![1]);
    expect(provider.target).toBeNull();
  });

  describe('load', () => {
    it('claims the source before the load request is awaited', async () => {
      const config: GoogleCastExtensionProps = {};
      const { provider, session } = await createCastingProvider(config);
      const hls = deferred<boolean>();

      vi.mocked(isHls).mockReturnValueOnce(hls.promise);
      config.src = 'https://example.com/video.mp4';

      const loading = provider.load();

      // A `loadstart` arriving here must see the source as already on its way.
      expect(provider.loadedSrc).toBe('https://example.com/video.mp4');
      expect(session.loadMedia).not.toHaveBeenCalled();

      hls.resolve(false);
      await loading;

      expect(session.loadMedia).toHaveBeenCalledTimes(1);
      expect(provider.loadedSrc).toBe('https://example.com/video.mp4');
    });

    it('sends nothing to the receiver without a source, as for an embed with no cast src', async () => {
      const { provider, session } = await createCastingProvider({});

      session.loadMedia.mockClear();
      await provider.load();

      expect(session.loadMedia).not.toHaveBeenCalled();
      expect(provider.loadedSrc).toBeNull();
    });

    it('casts an explicit src from media with no DOM children, such as an embed', async () => {
      const { target } = createTarget();

      Reflect.deleteProperty(target, 'querySelectorAll');

      const config: GoogleCastExtensionProps = {};
      const { provider, session } = await createCastingProvider(config, target);

      config.src = 'https://example.com/stream.m3u8';
      await provider.load();

      expect(session.loadMedia).toHaveBeenCalledTimes(1);
    });

    it('releases the claim when the load request fails', async () => {
      const config: GoogleCastExtensionProps = {};
      const { provider, session } = await createCastingProvider(config);

      session.loadMedia.mockRejectedValueOnce(new Error('LOAD_FAILED'));
      config.src = 'https://example.com/video.mp4';

      await expect(provider.load()).rejects.toThrow('LOAD_FAILED');

      expect(provider.loadedSrc).toBeNull();
    });

    it('keeps a newer claim when an older load fails', async () => {
      const config: GoogleCastExtensionProps = {};
      const { provider, session } = await createCastingProvider(config);
      const first = deferred<boolean>();

      vi.mocked(isHls).mockReturnValueOnce(first.promise);
      config.src = 'https://example.com/first.mp4';

      const loadingFirst = provider.load();

      config.src = 'https://example.com/second.mp4';
      await provider.load();

      session.loadMedia.mockRejectedValueOnce(new Error('LOAD_FAILED'));
      first.resolve(false);
      await expect(loadingFirst).rejects.toThrow('LOAD_FAILED');

      expect(provider.loadedSrc).toBe('https://example.com/second.mp4');
    });
  });
});

describe('GoogleCastExtension', () => {
  /** A real `<video>`, so the extension treats it as castable, whose `textTracks` the provider can listen to. */
  function createVideo() {
    const video = document.createElement('video');

    Object.defineProperty(video, 'textTracks', { value: new EventTarget() });

    return video;
  }

  it('loads the cast framework when the player reads remote while attached', () => {
    vi.stubGlobal('chrome', {});

    const video = createVideo();
    const googleCast = new GoogleCastExtension();
    const coordinator = new PlayerExtensionCoordinator(() => {});

    coordinator.register(googleCast);
    coordinator.attach({ media: video, container: null });
    expect(ensureCastFramework).not.toHaveBeenCalled();

    // The extension's override must expose `remote` as an accessor so player
    // reads reach the provider's lazy-loading getter.
    void (coordinator.getStoreMedia(video) as unknown as HTMLMediaTargetLike).remote;

    expect(ensureCastFramework).toHaveBeenCalled();
  });

  it('does not load the cast framework when remote is read after detach', () => {
    vi.stubGlobal('chrome', {});

    const video = createVideo();
    const googleCast = new GoogleCastExtension();
    const coordinator = new PlayerExtensionCoordinator(() => {});

    coordinator.register(googleCast);
    coordinator.attach({ media: video, container: null });
    coordinator.detach();

    void (coordinator.getStoreMedia(video) as unknown as HTMLMediaTargetLike).remote;

    expect(ensureCastFramework).not.toHaveBeenCalled();
  });
});
