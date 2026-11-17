import { PlayerExtensionCoordinator } from '@videojs/core/dom';
import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GoogleCastExtension, type GoogleCastExtensionProps } from '../index';
import { GoogleCastProvider } from '../provider';
import { ensureCastFramework } from '../registry';
import { currentSession, getCastContext, getPlaylistSegmentFormat, isHls } from '../utils';

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
    getPlaylistSegmentFormat: vi.fn(async () => ({ videoFormat: undefined, audioFormat: undefined })),
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

interface FakeCastTrack {
  trackId: number;
  type: string;
  trackContentId?: string;
  language?: string;
  name?: string;
}

interface FakeLoadRequest {
  media: { contentId: string; tracks?: FakeCastTrack[] };
  activeTrackIds: number[];
  currentTime: number;
  autoplay: boolean;
}

/**
 * Just enough of the Cast SDK for the provider to initialize, start or resume a session, and send load requests. The
 * receiver's media takes on what each load request sends, as a real receiver reports it back.
 */
function createCastSdk() {
  const media = {
    media: { contentId: '', tracks: [] as FakeCastTrack[] },
    activeTrackIds: [] as number[],
    playbackRate: 1,
    idleReason: null,
    addUpdateListener: vi.fn(),
    removeUpdateListener: vi.fn(),
    getStatus: vi.fn((_request: chrome.cast.media.GetStatusRequest, resolve: () => void) => resolve()),
    editTracksInfo: vi.fn(
      (request: { activeTrackIds: number[] }, resolve: () => void, _reject: (error: Error) => void) => {
        media.activeTrackIds = request.activeTrackIds;
        resolve();
      }
    ),
  };

  type FakeMedia = Omit<typeof media, 'idleReason'> & { idleReason: string | null };
  // A session lists every media it had, idle ones included, in the order they loaded.
  const mediaList: FakeMedia[] = [media];
  const session = {
    loadMedia: vi.fn(async (request: FakeLoadRequest) => {
      media.media = { contentId: request.media.contentId, tracks: request.media.tracks ?? [] };
      media.activeTrackIds = request.activeTrackIds;
    }),
    getSessionObj: () => ({ media: mediaList }),
    getMediaSession: () => mediaList.find((entry) => !entry.idleReason) ?? null,
  };
  const context = {
    sessionState: 'SESSION_STARTED',
    setOptions: vi.fn(),
    requestSession: vi.fn(async () => {}),
    getCurrentSession: () => session,
    getCastState: () => 'CONNECTED',
    getSessionState: () => context.sessionState,
  };
  let player: RemotePlayer | null = null;

  class RemotePlayer {
    controller: RemotePlayerController | null = null;
    isMuted = false;
    isMediaLoaded = false;
    isPaused = true;
    currentTime = 0;
  }

  class RemotePlayerController {
    readonly listeners = new Map<string, () => void>();

    constructor(remotePlayer: RemotePlayer) {
      remotePlayer.controller = this;
      player = remotePlayer;
    }
    addEventListener(type: string, listener: () => void) {
      this.listeners.set(type, listener);
    }
    removeEventListener(type: string) {
      this.listeners.delete(type);
    }
  }

  class MediaInfo {
    constructor(
      public contentId: string,
      public contentType: string
    ) {}
  }

  // SAFETY: covers every framework member `onCastFrameworkAvailable`, `requestCastSession`, and `load` touch.
  const framework = {
    // `currentMedia()` reaches the context through `utils`' own `currentSession()`, which the module mock can't replace.
    CastContext: { getInstance: () => context },
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
      HlsSegmentFormat: { AAC: 'aac', FMP4: 'fmp4', TS: 'ts' },
      HlsVideoSegmentFormat: { FMP4: 'fmp4', MPEG2_TS: 'mpeg2_ts' },
      Track: class {
        constructor(
          public trackId: number,
          public type: string
        ) {}
      },
      TrackType: { TEXT: 'TEXT', AUDIO: 'AUDIO' },
      TextTrackType: { CAPTIONS: 'CAPTIONS', SUBTITLES: 'SUBTITLES' },
      EditTracksInfoRequest: class {
        constructor(public activeTrackIds: number[]) {}
      },
      GetStatusRequest: class {},
      PlayerState: { IDLE: 'IDLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', BUFFERING: 'BUFFERING' },
      IdleReason: { FINISHED: 'FINISHED' },
    },
  };

  return {
    framework,
    chromeCast,
    context,
    session,
    media,
    mediaList,
    get player() {
      return player!;
    },
  };
}

function installCastSdk() {
  const sdk = createCastSdk();

  mocks.castFramework = sdk.framework;
  vi.stubGlobal('cast', { framework: sdk.framework });
  vi.stubGlobal('chrome', { cast: sdk.chromeCast });
  // SAFETY: the fake context implements every member the provider reaches on these paths.
  vi.mocked(getCastContext).mockReturnValue(sdk.context as unknown as cast.framework.CastContext);
  // SAFETY: the fake session implements every member the provider reaches on these paths.
  vi.mocked(currentSession).mockReturnValue(sdk.session as unknown as cast.framework.CastSession);

  return sdk;
}

/** A provider with a connected session. `config` is read live, so tests set `src` after the session starts. */
async function createCastingProvider(config: GoogleCastExtensionProps, target = createTarget().target) {
  const sdk = installCastSdk();
  const provider = new GoogleCastProvider(config);

  provider.attach(target);
  await provider.requestCastSession();

  return { provider, target, session: sdk.session, sdk };
}

interface FakeTextTrack {
  kind: string;
  label: string;
  language: string;
  mode: TextTrackMode;
}

interface TrackInit {
  src?: string;
  kind?: string;
  label?: string;
  language?: string;
  mode?: TextTrackMode;
}

/** A target whose text tracks can be added and removed, each backed by a `<track>` child when it has a `src`. */
function createTrackTarget() {
  const tracks: FakeTextTrack[] = [];
  const elements: { src: string; kind: string; label: string; srclang: string; track: FakeTextTrack }[] = [];
  const textTracks = Object.assign(new EventTarget(), {
    [Symbol.iterator]: () => tracks[Symbol.iterator](),
  });
  // SAFETY: covers every target member the provider reads while loading, casting, and syncing text tracks.
  const target = Object.assign(new EventTarget(), {
    textTracks,
    disableRemotePlayback: false,
    paused: true,
    muted: false,
    currentTime: 0,
    pause: vi.fn(),
    querySelectorAll: () => [...elements],
  }) as unknown as HTMLMediaTargetLike;

  function addTrack({ src, kind = 'subtitles', label = '', language = '', mode = 'disabled' }: TrackInit) {
    const track = { kind, label, language, mode };

    tracks.push(track);

    if (src) elements.push({ src, kind, label, srclang: language, track });

    textTracks.dispatchEvent(new Event('addtrack'));

    return track;
  }

  function removeTrack(track: FakeTextTrack) {
    tracks.splice(tracks.indexOf(track), 1);

    const index = elements.findIndex((el) => el.track === track);

    if (index >= 0) elements.splice(index, 1);

    textTracks.dispatchEvent(new Event('removetrack'));
  }

  return { target, addTrack, removeTrack };
}

/** Let the provider's coalesced track list check run. */
function flushTrackListSync() {
  return new Promise((resolve) => setTimeout(resolve));
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

    it.each([
      ['fMP4', { videoFormat: 'm4s', audioFormat: 'm4s' }, 'fmp4', 'fmp4'],
      ['TS', { videoFormat: 'ts', audioFormat: 'ts' }, 'ts', 'mpeg2_ts'],
      ['TS with separate AAC audio', { videoFormat: 'ts', audioFormat: 'aac' }, 'aac', 'mpeg2_ts'],
    ])('describes %s HLS segments to the receiver', async (_, formats, segmentFormat, videoSegmentFormat) => {
      const config: GoogleCastExtensionProps = {};
      const { provider, session } = await createCastingProvider(config);

      vi.mocked(isHls).mockResolvedValueOnce(true);
      vi.mocked(getPlaylistSegmentFormat).mockResolvedValueOnce(formats);
      config.src = 'https://example.com/stream.m3u8';
      await provider.load();

      const [request] = session.loadMedia.mock.calls.at(-1) as unknown as [chrome.cast.media.LoadRequest];

      expect(request.media.hlsSegmentFormat).toBe(segmentFormat);
      expect(request.media.hlsVideoSegmentFormat).toBe(videoSegmentFormat);
    });
  });

  describe('text tracks', () => {
    const SRC = 'https://example.com/video.mp4';
    const EN = 'https://example.com/en.vtt';
    const FR = 'https://example.com/fr.vtt';

    function lastLoadRequest(session: { loadMedia: { mock: { calls: [FakeLoadRequest][] } } }) {
      return session.loadMedia.mock.calls.at(-1)![0];
    }

    /** A provider whose session resumed after a page reload, with `receiver` already playing `SRC`. */
    async function createResumedProvider(
      target: HTMLMediaTargetLike,
      receiver: { tracks: FakeCastTrack[]; activeTrackIds: number[] }
    ) {
      const sdk = installCastSdk();

      sdk.context.sessionState = 'SESSION_RESUMED';
      sdk.media.media = { contentId: SRC, tracks: receiver.tracks };
      sdk.media.activeTrackIds = receiver.activeTrackIds;

      const provider = new GoogleCastProvider({ src: SRC });

      provider.attach(target);
      await provider.onSessionStateChanged();

      return { provider, sdk };
    }

    const receiverTracks: FakeCastTrack[] = [
      { trackId: 1, type: 'TEXT', trackContentId: EN, language: 'en', name: 'English' },
      { trackId: 2, type: 'TEXT', trackContentId: FR, language: 'fr', name: 'Français' },
    ];

    it('sends sidecar caption tracks with the load request, with the showing one active', async () => {
      const { target, addTrack } = createTrackTarget();

      addTrack({ src: EN, label: 'English', language: 'en' });
      addTrack({ src: FR, label: 'Français', language: 'fr', mode: 'showing' });
      addTrack({ src: 'https://example.com/thumbnails.vtt', kind: 'metadata' });

      const { session } = await createCastingProvider({ src: SRC }, target);
      const request = lastLoadRequest(session);

      expect(request.media.tracks?.map((track) => track.trackContentId)).toEqual([EN, FR]);
      expect(request.activeTrackIds).toEqual([2]);
    });

    it("loads again from the receiver's position when a sidecar track is added mid-cast", async () => {
      const { target, addTrack } = createTrackTarget();

      addTrack({ src: EN, label: 'English', language: 'en' });

      const { session, sdk } = await createCastingProvider({ src: SRC }, target);

      sdk.player.isMediaLoaded = true;
      sdk.player.isPaused = false;
      sdk.player.currentTime = 42;

      addTrack({ src: FR, label: 'Français', language: 'fr', mode: 'showing' });
      await flushTrackListSync();

      await vi.waitFor(() => expect(session.loadMedia).toHaveBeenCalledTimes(2));

      const request = lastLoadRequest(session);

      expect(request.media.tracks?.map((track) => track.trackContentId)).toEqual([EN, FR]);
      expect(request.activeTrackIds).toEqual([2]);
      expect(request.currentTime).toBe(42);
      expect(request.autoplay).toBe(true);
    });

    it('loads again without a sidecar track removed mid-cast', async () => {
      const { target, addTrack, removeTrack } = createTrackTarget();

      addTrack({ src: EN, label: 'English', language: 'en' });
      const fr = addTrack({ src: FR, label: 'Français', language: 'fr' });

      const { session, sdk } = await createCastingProvider({ src: SRC }, target);

      sdk.player.isMediaLoaded = true;
      sdk.player.currentTime = 10;

      removeTrack(fr);
      await flushTrackListSync();

      await vi.waitFor(() => expect(session.loadMedia).toHaveBeenCalledTimes(2));

      const request = lastLoadRequest(session);

      expect(request.media.tracks?.map((track) => track.trackContentId)).toEqual([EN]);
      expect(request.currentTime).toBe(10);
      expect(request.autoplay).toBe(false);
    });

    it('does not load again for an added track without a file', async () => {
      const { target, addTrack } = createTrackTarget();

      addTrack({ src: EN, label: 'English', language: 'en' });

      const { session, sdk } = await createCastingProvider({ src: SRC }, target);

      sdk.player.isMediaLoaded = true;

      addTrack({ label: 'Generated', language: 'en' });
      await flushTrackListSync();

      expect(session.loadMedia).toHaveBeenCalledTimes(1);
    });

    it('shows the local track the receiver shows after a resumed session', async () => {
      const { target, addTrack } = createTrackTarget();
      const en = addTrack({ src: EN, label: 'English', language: 'en', mode: 'showing' });
      const fr = addTrack({ src: FR, label: 'Français', language: 'fr' });

      const { sdk } = await createResumedProvider(target, { tracks: receiverTracks, activeTrackIds: [2] });

      expect(fr.mode).toBe('showing');
      expect(en.mode).toBe('disabled');
      expect(sdk.media.editTracksInfo).not.toHaveBeenCalled();
    });

    it('turns local captions off when the receiver shows none after a resumed session', async () => {
      const { target, addTrack } = createTrackTarget();
      const en = addTrack({ src: EN, label: 'English', language: 'en', mode: 'showing' });

      await createResumedProvider(target, { tracks: receiverTracks, activeTrackIds: [] });

      expect(en.mode).toBe('disabled');
    });

    it('reads the active media when the session lists an idle one first', async () => {
      const { target, addTrack } = createTrackTarget();
      const en = addTrack({ src: EN, label: 'English', language: 'en', mode: 'showing' });
      const fr = addTrack({ src: FR, label: 'Français', language: 'fr' });
      const sdk = installCastSdk();
      const stale = { ...sdk.media, idleReason: 'INTERRUPTED', activeTrackIds: [1] };

      sdk.mediaList.unshift(stale);
      sdk.context.sessionState = 'SESSION_RESUMED';
      sdk.media.media = { contentId: SRC, tracks: receiverTracks };
      sdk.media.activeTrackIds = [2];

      const provider = new GoogleCastProvider({ src: SRC });

      provider.attach(target);
      await provider.onSessionStateChanged();

      expect(fr.mode).toBe('showing');
      expect(en.mode).toBe('disabled');
    });

    /** Casting a stream whose captions come from its manifest: no sidecars, so the receiver lists the tracks itself. */
    async function castManifestCaptions(receiver: FakeCastTrack[]) {
      const { target, addTrack } = createTrackTarget();
      const en = addTrack({ label: 'English', language: 'en', mode: 'showing' });
      const { sdk } = await createCastingProvider({ src: SRC }, target);

      sdk.media.media.tracks = receiver;
      sdk.player.isMediaLoaded = true;
      sdk.player.controller!.listeners.get('isMediaLoadedChanged')!();
      await vi.waitFor(() => expect(sdk.media.addUpdateListener).toHaveBeenCalled());

      return { en, sdk };
    }

    const manifestTracks: FakeCastTrack[] = [{ trackId: 1, type: 'TEXT', language: 'en', name: 'English' }];

    it('shows the local caption track on the receiver once the receiver lists it', async () => {
      const { sdk } = await castManifestCaptions([]);

      expect(sdk.media.editTracksInfo).not.toHaveBeenCalled();

      sdk.media.media.tracks = manifestTracks;
      sdk.media.addUpdateListener.mock.calls[0]![0]();

      await vi.waitFor(() => expect(sdk.media.activeTrackIds).toEqual([1]));
    });

    it('turns local captions off when the receiver rejects showing them', async () => {
      const { en, sdk } = await castManifestCaptions([]);

      sdk.media.editTracksInfo.mockImplementationOnce((_request, _resolve, reject) => reject(new Error('INVALID')));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      sdk.media.media.tracks = manifestTracks;
      sdk.media.addUpdateListener.mock.calls[0]![0]();

      await vi.waitFor(() => expect(en.mode).toBe('disabled'));
    });

    it("shows the receiver's track once it is added after a resumed session, without loading again", async () => {
      const { target, addTrack } = createTrackTarget();
      const { sdk } = await createResumedProvider(target, { tracks: receiverTracks, activeTrackIds: [2] });

      sdk.player.isMediaLoaded = true;

      const fr = addTrack({ src: FR, label: 'Français', language: 'fr' });

      await flushTrackListSync();

      expect(fr.mode).toBe('showing');
      expect(sdk.session.loadMedia).not.toHaveBeenCalled();
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
