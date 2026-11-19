import type { TextTrackLike } from '@videojs/media';
import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';

import type { GoogleCastExtensionProps } from './index';
import { ensureCastFramework, whenCastFramework } from './registry';
import { RemotePlayback, type RemotePlaybackHooks } from './remote-playback';
import {
  currentMedia,
  currentSession,
  editTracksInfo,
  getCastContext,
  getMediaStatus,
  getPlaylistSegmentFormat,
  InvalidStateError,
  isHls,
  NotSupportedError,
  setCastOptions,
  setPlaybackRate,
} from './utils';

type RemotePlayerListener = (event?: cast.framework.RemotePlayerChangedEvent) => void;

type GoogleCastConfig = GoogleCastExtensionProps;

/**
 * Cast provider + lifecycle. Created by the {@link GoogleCastExtension} and installed as the player's media override
 * while a cast session is connected, so its getters/setters route through the cast receiver; when disconnected the
 * player falls through to the attached media. Also owns the cast framework integration, the `RemotePlayback` instance
 * exposed via {@link GoogleCastProvider#remote}, and dispatches media events on the attached target (which the media
 * forwards to the player) while casting.
 */
export class GoogleCastProvider {
  target: HTMLMediaTargetLike | null = null;
  // The list subscribed on attach; the target may drop or swap its own before detach.
  #textTracks: HTMLMediaTargetLike['textTracks'] | null = null;
  #googleCast: GoogleCastConfig;
  #canCast: () => boolean;
  #loadedSrc: string | null = null;
  #hooks: Partial<RemotePlaybackHooks> = {};
  #remotePlayback: RemotePlayback;
  #isInit = false;
  #cancelInit: () => void;
  #isCasting = false;
  #seeking = false;
  #remotePlayer!: cast.framework.RemotePlayer;
  #remoteListeners!: Record<string, RemotePlayerListener>;
  #listenersAttached = false;
  #playbackRate = 1;
  #localPaused = false;
  /** The sidecar tracks sent to the receiver, or `null` when they came from an earlier page that resumed the session. */
  #castTrackKey: string | null = null;
  /** The receiver's active track ids after a resumed session, until a local track takes them on. */
  #resumedTrackIds: number[] | null = null;
  /** The receiver can list a manifest's text tracks after the media loaded, so their ids are watched. */
  #remoteTrackKey = '';
  #onTextTrackChange = () => this.#updateRemoteTextTrack();
  #onTextTrackListChange = () => this.#syncTextTracks();
  #onMediaUpdate = () => {
    this.#checkPlaybackRate();
    this.#checkRemoteTracks();
  };

  /**
   * @param canCast - Whether the source can be cast at all. A new session is refused while it can't; a running one can
   *   still end.
   */
  constructor(googleCast: GoogleCastConfig, canCast: () => boolean = () => true) {
    this.#googleCast = googleCast;
    this.#canCast = canCast;
    this.#remotePlayback = new RemotePlayback(this);
    this.#cancelInit = whenCastFramework((framework) => this.#init(framework));
  }

  get remote() {
    if (this.target && !this.target.disableRemotePlayback) {
      ensureCastFramework();
    }

    return this.#remotePlayback;
  }

  /**
   * Source this provider has sent, or is sending, to the receiver. `null` while nothing is on its way, after a
   * disconnect, and after a failed load so the same source can be retried.
   */
  get loadedSrc() {
    return this.#loadedSrc;
  }

  attach(target: HTMLMediaTargetLike) {
    this.target = target;
    this.#textTracks = target.textTracks ?? null;
    this.#textTracks?.addEventListener('change', this.#onTextTrackChange);
    this.#textTracks?.addEventListener('addtrack', this.#onTextTrackListChange);
    this.#textTracks?.addEventListener('removetrack', this.#onTextTrackListChange);
  }

  detach() {
    this.#textTracks?.removeEventListener('change', this.#onTextTrackChange);
    this.#textTracks?.removeEventListener('addtrack', this.#onTextTrackListChange);
    this.#textTracks?.removeEventListener('removetrack', this.#onTextTrackListChange);
    this.#textTracks = null;
    this.target = null;
  }

  destroy() {
    this.detach();
    this.#cancelInit();
    this.#listenToCastContext(false);
    currentMedia()?.removeUpdateListener(this.#onMediaUpdate);
    this.#listenToRemotePlayer(false);
    this.#isCasting = false;
    this.#isInit = false;
  }

  /** @internal Wires up callbacks pushed from {@link RemotePlayback}; not part of the public surface. */
  bindHooks(hooks: Partial<RemotePlaybackHooks>) {
    Object.assign(this.#hooks, hooks);
  }

  /**
   * Whether a cast session can be offered: a device is around, and the source can be cast. A session already running
   * stays available, so it can still be ended after the source changes to one that can't be cast.
   */
  isAvailable() {
    const state = getCastContext()?.getCastState();

    return this.#allowsCasting() && !!state && state !== cast.framework.CastState.NO_DEVICES_AVAILABLE;
  }

  /** Report availability again, after something the `canCast` check reads changed. */
  updateAvailability() {
    if (this.#isInit) this.#hooks.setAvailable?.(this.isAvailable());
  }

  async requestCastSession() {
    if (this.target?.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }

    if (!this.#allowsCasting()) {
      throw new NotSupportedError('This source needs a custom Cast receiver.');
    }

    await ensureCastFramework();

    if (!globalThis.chrome?.cast?.isAvailable) {
      throw new NotSupportedError('The RemotePlayback API is disabled on this platform.');
    }

    const willDisconnect = this.#isCasting;

    this.#isCasting = true;

    this.#applyCastOptions();
    this.#listenToRemotePlayer(true);

    try {
      await getCastContext()!.requestSession();
    } catch (err) {
      if (!willDisconnect) this.#isCasting = false;

      if (err === 'cancel') return;

      throw new Error(err as string);
    }

    this.#localPaused = this.target?.paused ?? true;
    this.target?.pause();
    this.muted = this.target?.muted ?? false;

    try {
      await this.load();
    } catch (err) {
      console.error(err);
    }
  }

  async load() {
    if (!this.#isCasting) {
      await this.target?.load();
      return;
    }

    // Read the local element's time directly; our own `currentTime` getter reports the remote player's while casting.
    await this.#loadRemote(this.target?.currentTime ?? 0, !this.#localPaused);
  }

  async #loadRemote(currentTime: number, autoplay: boolean) {
    const { src } = this.#googleCast;

    if (!src) {
      // TODO: handle unloading the media?
      return;
    }

    // Claim the source before anything is awaited, so a `loadstart` that lands while the request is still being built
    // sees it as already on its way to the receiver.
    this.#loadedSrc = src;
    this.#resumedTrackIds = null;

    try {
      const request = await this.#createLoadRequest(src);

      request.currentTime = currentTime;
      request.autoplay = autoplay;

      await currentSession()?.loadMedia(request);
    } catch (error) {
      // Free the source for a retry, unless a newer load has claimed another one since.
      if (this.#loadedSrc === src) this.#loadedSrc = null;

      throw error;
    }

    this.target?.dispatchEvent(new Event('volumechange'));
  }

  async #createLoadRequest(src: string) {
    const mediaInfo = new chrome.cast.media.MediaInfo(src, this.#googleCast.contentType ?? '');

    mediaInfo.customData = this.#googleCast.customData ?? null;

    const { target } = this;
    const subtitles = this.#getSidecarTracks();

    const { Track, TrackType, TextTrackType } = chrome.cast.media;
    const activeTrackIds: number[] = [];

    this.#castTrackKey = getTrackKey(subtitles);

    if (subtitles.length) {
      mediaInfo.tracks = subtitles.map((el, i) => {
        const trackId = i + 1;

        if (!activeTrackIds.length && el.track.mode === 'showing') activeTrackIds.push(trackId);

        const track = new Track(trackId, TrackType.TEXT);

        track.trackContentId = el.src;
        track.trackContentType = 'text/vtt';
        track.subtype = el.kind === 'captions' ? TextTrackType.CAPTIONS : TextTrackType.SUBTITLES;
        track.name = el.label;
        track.language = el.srclang;
        return track;
      });
    }

    mediaInfo.streamType =
      this.#googleCast.streamType === 'live'
        ? chrome.cast.media.StreamType.LIVE
        : chrome.cast.media.StreamType.BUFFERED;

    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.images = [new chrome.cast.Image((target as HTMLVideoElement | null)?.poster ?? '')];

    if (await isHls(src)) {
      mediaInfo.contentType ||= 'application/x-mpegURL';

      const { videoFormat, audioFormat } = await getPlaylistSegmentFormat(src);
      const { HlsSegmentFormat: HS, HlsVideoSegmentFormat: HVS } = chrome.cast.media;

      if (videoFormat?.includes('m4s') || videoFormat?.includes('mp4') || videoFormat?.includes('m4a')) {
        mediaInfo.hlsSegmentFormat = HS.FMP4;
        mediaInfo.hlsVideoSegmentFormat = HVS.FMP4;
      } else if (audioFormat?.includes('aac')) {
        // Packed AAC audio renditions alongside TS video.
        mediaInfo.hlsSegmentFormat = HS.AAC;
        mediaInfo.hlsVideoSegmentFormat = HVS.MPEG2_TS;
      } else if (videoFormat?.includes('ts') || audioFormat?.includes('ts')) {
        mediaInfo.hlsSegmentFormat = HS.TS;
        mediaInfo.hlsVideoSegmentFormat = HVS.MPEG2_TS;
      }
    }

    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    request.activeTrackIds = activeTrackIds;

    return request;
  }

  get paused() {
    if (!this.#remotePlayer.isMediaLoaded) return this.target?.paused ?? true;

    return this.#remotePlayer.isPaused || this.ended;
  }

  get ended() {
    return (
      this.#remotePlayer.playerState === chrome.cast.media.PlayerState.IDLE &&
      currentMedia()?.idleReason === chrome.cast.media.IdleReason.FINISHED
    );
  }

  get seeking() {
    return this.#seeking;
  }

  get readyState() {
    switch (this.#remotePlayer.playerState) {
      case chrome.cast.media.PlayerState.IDLE:
        return 0;
      case chrome.cast.media.PlayerState.BUFFERING:
        return 2;
      default:
        return 3;
    }
  }

  get duration() {
    if (!this.#remotePlayer.isMediaLoaded) return this.target?.duration ?? NaN;

    return this.#remotePlayer.duration ?? NaN;
  }

  get currentTime() {
    if (!this.#remotePlayer.isMediaLoaded) return this.target?.currentTime ?? 0;

    return this.#remotePlayer.currentTime ?? 0;
  }

  set currentTime(value: number) {
    this.#remotePlayer.currentTime = value;
    this.#notifySeeking();
    this.#remotePlayer.controller?.seek();
  }

  get muted() {
    return this.#remotePlayer.isMuted;
  }

  set muted(value: boolean) {
    if (value !== this.#remotePlayer.isMuted) {
      this.#remotePlayer.controller?.muteOrUnmute();
    }
  }

  get volume() {
    return this.#remotePlayer.volumeLevel ?? 1;
  }

  set volume(value: number) {
    this.#remotePlayer.volumeLevel = +value;
    this.#remotePlayer.controller?.setVolumeLevel();
  }

  get playbackRate() {
    return currentMedia()?.playbackRate ?? 1;
  }

  set playbackRate(value: number) {
    setPlaybackRate(value);
  }

  async play() {
    // When a casted media ends, the media is unloaded and the player state is IDLE.
    if (!this.#remotePlayer.isMediaLoaded) {
      this.#localPaused = false;
      await this.load();
      return;
    }

    if (this.paused) {
      this.#remotePlayer.controller?.playOrPause();
      return new Promise<void>((resolve) => {
        this.target?.addEventListener('play', () => resolve(), { once: true });
      });
    }
  }

  pause() {
    if (!this.paused) {
      this.#remotePlayer.controller?.playOrPause();
    }
  }

  #init(framework: typeof cast.framework) {
    this.#isInit = true;
    this.#applyCastOptions();
    this.#onCastStateChanged();

    this.#remotePlayer = new framework.RemotePlayer();
    new framework.RemotePlayerController(this.#remotePlayer);

    this.#remoteListeners = {
      [framework.RemotePlayerEventType.IS_CONNECTED_CHANGED]: (event?: cast.framework.RemotePlayerChangedEvent) => {
        const value = event?.value;

        if (value === true) {
          this.#hooks.setState?.('connected');
        } else {
          this.#disconnect();
          this.#hooks.setState?.('disconnected');
          this.updateAvailability();
        }
      },
      [framework.RemotePlayerEventType.DURATION_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('durationchange'));
      },
      [framework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('volumechange'));
      },
      [framework.RemotePlayerEventType.IS_MUTED_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('volumechange'));
      },
      [framework.RemotePlayerEventType.CURRENT_TIME_CHANGED]: () => {
        if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded) return;

        this.#notifySeeked();
        this.target?.dispatchEvent(new Event('timeupdate'));
      },
      [framework.RemotePlayerEventType.VIDEO_INFO_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('resize'));
      },
      [framework.RemotePlayerEventType.IS_PAUSED_CHANGED]: () => {
        this.target?.dispatchEvent(new Event(this.#isCasting && this.#remotePlayer.isPaused ? 'pause' : 'play'));
      },
      [framework.RemotePlayerEventType.PLAYER_STATE_CHANGED]: () => {
        const PS = chrome.cast.media.PlayerState;
        const state = this.#isCasting ? this.#remotePlayer.playerState : undefined;

        if (state !== PS.BUFFERING) this.#notifySeeked();

        if (state === PS.PAUSED) return;

        if (state === PS.IDLE) {
          const finished = currentMedia()?.idleReason === chrome.cast.media.IdleReason.FINISHED;

          this.target?.dispatchEvent(new Event(finished ? 'ended' : 'emptied'));
          return;
        }

        if (state === PS.PLAYING) this.target?.dispatchEvent(new Event('playing'));
        else if (state === PS.BUFFERING) this.target?.dispatchEvent(new Event('waiting'));
      },
      [framework.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED]: async () => {
        if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded) return;

        await Promise.resolve();
        this.#onRemoteMediaLoaded();
      },
    };

    this.#listenToCastContext(true);
  }

  #onCastStateChanged = () => {
    if (this.#isCasting && getCastContext()!.getCastState() === cast.framework.CastState.CONNECTING) {
      this.#hooks.setState?.('connecting');
    }

    this.updateAvailability();
  };

  #onSessionStateChanged = async () => {
    const { SESSION_RESUMED } = cast.framework.SessionState;

    if (getCastContext()!.getSessionState() === SESSION_RESUMED) {
      const { src } = this.#googleCast;

      if (src && src === currentMedia()?.media?.contentId) {
        this.#isCasting = true;
        this.#loadedSrc = src;
        this.#castTrackKey = null;
        // Take on the receiver's captions before anything pushes the local ones over them.
        this.#resumedTrackIds = currentMedia()?.activeTrackIds ?? [];
        this.#applyResumedTextTracks();

        this.#listenToRemotePlayer(true);

        try {
          await getMediaStatus(new chrome.cast.media.GetStatusRequest());
        } catch (error) {
          console.error(error);
        }

        this.#remoteListeners[cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED]!();
        this.#remoteListeners[cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED]!();
        this.target?.dispatchEvent(new Event('ratechange'));
      }
    }
  };

  #listenToCastContext(listen: boolean) {
    if (!this.#isInit) return;

    const context = getCastContext()!;
    const { CAST_STATE_CHANGED, SESSION_STATE_CHANGED } = cast.framework.CastContextEventType;

    if (listen) {
      context.addEventListener(CAST_STATE_CHANGED, this.#onCastStateChanged);
      context.addEventListener(SESSION_STATE_CHANGED, this.#onSessionStateChanged);
    } else {
      context.removeEventListener(CAST_STATE_CHANGED, this.#onCastStateChanged);
      context.removeEventListener(SESSION_STATE_CHANGED, this.#onSessionStateChanged);
    }
  }

  #applyCastOptions() {
    const { receiver } = this.#googleCast;

    setCastOptions(receiver ? { receiverApplicationId: receiver } : {});
  }

  // CAF's RemotePlayerController does not deduplicate handlers, so a flag keeps cancel/retry and stop-casting flows from
  // adding them twice and dispatching every event twice.
  #listenToRemotePlayer(listen: boolean) {
    const controller = this.#remotePlayer?.controller;
    if (this.#listenersAttached === listen || !controller) return;

    for (const [type, handler] of Object.entries(this.#remoteListeners)) {
      const eventType = type as cast.framework.RemotePlayerEventType;

      if (listen) controller.addEventListener(eventType, handler);
      else controller.removeEventListener(eventType, handler);
    }

    this.#listenersAttached = listen;
  }

  #allowsCasting() {
    return this.#isCasting || this.#canCast();
  }

  #disconnect() {
    if (!this.#isCasting) return;

    currentMedia()?.removeUpdateListener(this.#onMediaUpdate);
    this.#listenToRemotePlayer(false);
    this.#seeking = false;
    this.#playbackRate = 1;
    this.#isCasting = false;
    this.#loadedSrc = null;
    this.#resumedTrackIds = null;

    const { target } = this;
    if (!target) return;

    const saved = this.#remotePlayer.savedPlayerState;

    target.muted = this.#remotePlayer.isMuted;

    if (saved) target.currentTime = saved.currentTime;

    if (saved?.isPaused === false) target.play();
  }

  #notifySeeking() {
    this.#seeking = true;
    this.target?.dispatchEvent(new Event('seeking'));
  }

  #notifySeeked() {
    if (!this.#seeking) return;

    this.#seeking = false;
    this.target?.dispatchEvent(new Event('seeked'));
  }

  #onRemoteMediaLoaded() {
    this.#playbackRate = currentMedia()?.playbackRate ?? 1;
    currentMedia()?.addUpdateListener(this.#onMediaUpdate);
    this.#remoteTrackKey = getTrackIdKey();
    this.#syncTextTracks();
  }

  #checkPlaybackRate() {
    const rate = currentMedia()?.playbackRate ?? 1;

    if (rate !== this.#playbackRate) {
      this.#playbackRate = rate;
      this.target?.dispatchEvent(new Event('ratechange'));
    }
  }

  #checkRemoteTracks() {
    const key = getTrackIdKey();

    if (key !== this.#remoteTrackKey) {
      this.#remoteTrackKey = key;
      this.#syncTextTracks();
    }
  }

  #syncTextTracks() {
    // Tracks can only be added to or removed from the receiver with a new load request.
    if (this.#haveSidecarTracksChanged()) {
      this.#loadRemote(this.currentTime, !this.paused).catch((error) => console.error(error));
      return;
    }

    this.#applyResumedTextTracks();
    this.#updateRemoteTextTrack();
  }

  /**
   * Caption and subtitle `<track>` children with a file, which the receiver only gets through the load request.
   * Manifest tracks are left out because the receiver reads them from the stream; `#pairTextTracks()` syncs both kinds.
   * Embeds have no children to query.
   */
  #getSidecarTracks() {
    return [...(this.target?.querySelectorAll?.<HTMLTrackElement>('track') ?? [])].filter(
      (el) => el.src && isCaptionOrSubtitleTrack(el)
    );
  }

  /** Whether the page's sidecar tracks differ from the ones the receiver has. */
  #haveSidecarTracksChanged() {
    const { src } = this.#googleCast;
    // A source change sends its own tracks.
    if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded || !src || this.#loadedSrc !== src) return false;

    const sidecars = this.#getSidecarTracks();

    if (this.#castTrackKey === null) {
      // Only side-loaded tracks have a content id on the receiver, so only sidecars it's missing count.
      const remote = new Set(getRemoteTextTracks().map(({ trackContentId }) => trackContentId));

      return !sidecars.every((el) => remote.has(el.src));
    }

    return getTrackKey(sidecars) !== this.#castTrackKey;
  }

  /** The receiver's text tracks paired with the local tracks they show. */
  #pairTextTracks() {
    const localSubs = [...(this.#textTracks ?? [])].filter(isCaptionOrSubtitleTrack);

    return getRemoteTextTracks().flatMap(({ language, name, trackId }) => {
      const local = localSubs.find((l) => l.language === language && l.label === name);

      return local ? [{ trackId, local }] : [];
    });
  }

  /** The local track paired with one of the receiver's active track ids. */
  #findLocalTextTrack(ids: readonly number[]) {
    return this.#pairTextTracks().find(({ trackId }) => ids.includes(trackId))?.local;
  }

  /** After a resumed session, wait for the local track the receiver shows before showing it. */
  #applyResumedTextTracks() {
    const ids = this.#resumedTrackIds;
    if (!ids) return;

    const active = this.#findLocalTextTrack(ids);
    // The receiver shows a track the page hasn't added yet.
    if (!active && getRemoteTextTracks().some(({ trackId }) => ids.includes(trackId))) return;

    this.#resumedTrackIds = null;
    this.#showLocalTextTrack(active);
  }

  /** Show `active` and turn the other local captions off. */
  #showLocalTextTrack(active: TextTrackLike | undefined) {
    const textTracks = this.#textTracks;
    if (!textTracks) return;

    for (const track of [...textTracks].filter(isCaptionOrSubtitleTrack)) {
      if (track === active) track.mode = 'showing';
      else if (track.mode === 'showing') track.mode = 'disabled';
    }
  }

  async #updateRemoteTextTrack() {
    // Media that isn't loaded can't change tracks; loading it syncs them.
    if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded || !this.#textTracks) return;

    const matched = this.#pairTextTracks().map(({ trackId, local }) => ({ trackId, mode: local.mode }));

    const hidden = new Set(matched.filter((m) => m.mode !== 'showing').map((m) => m.trackId));
    const showing = matched.find((m) => m.mode === 'showing')?.trackId;

    const active = currentMedia()?.activeTrackIds ?? [];
    const next = new Set(active.filter((id) => !hidden.has(id)));

    if (showing) next.add(showing);

    if (next.size === active.length && active.every((id) => next.has(id))) return;

    try {
      await editTracksInfo(new chrome.cast.media.EditTracksInfoRequest([...next]));
    } catch (error) {
      console.error(error);
      // Keep the captions menu from claiming captions the receiver isn't showing.
      this.#showLocalTextTrack(this.#findLocalTextTrack(currentMedia()?.activeTrackIds ?? []));
    }
  }
}

function getRemoteTextTracks() {
  return (currentMedia()?.media?.tracks ?? []).filter(({ type }) => type === chrome.cast.media.TrackType.TEXT);
}

function getTrackIdKey() {
  return getRemoteTextTracks()
    .map(({ trackId }) => trackId)
    .join();
}

function getTrackKey(tracks: HTMLTrackElement[]) {
  return tracks.map((el) => el.src).join('\n');
}
