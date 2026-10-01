import type { HTMLMediaTargetLike } from '@videojs/media/dom';
import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';

import type { GoogleCastExtensionProps } from './index';
import { castFramework, ensureCastFramework, googleCastInstances } from './registry';
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
  #googleCast: GoogleCastConfig;
  #loadedSrc: string | null = null;
  #hooks: Partial<RemotePlaybackHooks> = {};
  #remotePlayback: RemotePlayback;
  #isInit = false;
  #isCasting = false;
  #seeking = false;
  #remotePlayer!: cast.framework.RemotePlayer;
  #remoteListeners!: Record<string, RemotePlayerListener>;
  #listenersAttached = false;
  #playbackRate = 1;
  #localPaused = false;
  #onTextTrackChange = () => this.#updateRemoteTextTrack();
  #onMediaUpdate = () => this.#checkPlaybackRate();

  constructor(googleCast: GoogleCastConfig) {
    this.#googleCast = googleCast;
    this.#remotePlayback = new RemotePlayback(this);
    googleCastInstances.add(this);
    this.onCastFrameworkAvailable();
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
    target.textTracks.addEventListener('change', this.#onTextTrackChange);
  }

  detach() {
    this.target?.textTracks.removeEventListener('change', this.#onTextTrackChange);
    this.target = null;
  }

  destroy() {
    this.detach();
    googleCastInstances.delete(this);
    currentMedia()?.removeUpdateListener(this.#onMediaUpdate);
    this.#detachRemoteListeners();
    this.#isCasting = false;
    this.#isInit = false;
  }

  /** @internal Wires up callbacks pushed from {@link RemotePlayback}; not part of the public surface. */
  bindHooks(hooks: Partial<RemotePlaybackHooks>) {
    Object.assign(this.#hooks, hooks);
  }

  hasDevicesAvailable() {
    const state = getCastContext()?.getCastState();

    return !!state && state !== cast.framework.CastState.NO_DEVICES_AVAILABLE;
  }

  async requestCastSession() {
    if (this.target?.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }

    await ensureCastFramework();

    if (!this.#isCastApiAvailable()) {
      throw new NotSupportedError('The RemotePlayback API is disabled on this platform.');
    }

    const willDisconnect = this.#isCasting;

    this.#isCasting = true;

    this.#applyCastOptions();
    this.#attachRemoteListeners();

    try {
      await getCastContext()!.requestSession();
    } catch (err) {
      if (!willDisconnect) {
        this.#isCasting = false;
      }

      if (err === 'cancel') {
        return;
      }

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

    const { src } = this.#googleCast;

    if (!src) {
      // TODO: handle unloading the media?
      return;
    }

    // Claim the source before anything is awaited, so a `loadstart` that lands while the request is still being built
    // sees it as already on its way to the receiver.
    this.#loadedSrc = src;

    try {
      const request = await this.#createLoadRequest(src);

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
    // Embed adapters (YouTube, Vimeo) have no `<track>` children to query; an explicit `src` can still be cast.
    const subtitles = [...(target?.querySelectorAll?.<HTMLTrackElement>('track') ?? [])].filter(
      (el) => el.src && isCaptionOrSubtitleTrack(el)
    );

    const { Track, TrackType, TextTrackType } = chrome.cast.media;
    const activeTrackIds: number[] = [];

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

      const fmt = (await getPlaylistSegmentFormat(src)) ?? '';
      const { HlsSegmentFormat: HS, HlsVideoSegmentFormat: HVS } = chrome.cast.media;

      if (fmt.includes('m4s') || fmt.includes('mp4')) {
        mediaInfo.hlsSegmentFormat = HS.FMP4;
        mediaInfo.hlsVideoSegmentFormat = HVS.FMP4;
      } else if (fmt.includes('ts')) {
        mediaInfo.hlsSegmentFormat = HS.TS;
        mediaInfo.hlsVideoSegmentFormat = HVS.TS;
      }
    }

    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    // Read the local element's time directly; our own `currentTime` getter
    // reports the remote player's while casting.
    request.currentTime = this.target?.currentTime ?? 0;
    request.autoplay = !this.#localPaused;
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

  onCastFrameworkAvailable() {
    if (!castFramework || this.#isInit) return;

    this.#isInit = true;

    this.#applyCastOptions();

    this.onCastStateChanged();

    this.#remotePlayer = new castFramework.RemotePlayer();
    new castFramework.RemotePlayerController(this.#remotePlayer);

    this.#remoteListeners = {
      [castFramework.RemotePlayerEventType.IS_CONNECTED_CHANGED]: (event?: cast.framework.RemotePlayerChangedEvent) => {
        const value = event?.value;

        if (value === true) {
          this.#hooks.setState?.('connected');
        } else {
          this.#disconnect();
          this.#hooks.setState?.('disconnected');
        }
      },
      [castFramework.RemotePlayerEventType.DURATION_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('durationchange'));
      },
      [castFramework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('volumechange'));
      },
      [castFramework.RemotePlayerEventType.IS_MUTED_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('volumechange'));
      },
      [castFramework.RemotePlayerEventType.CURRENT_TIME_CHANGED]: () => {
        if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded) return;

        this.#notifySeeked();
        this.target?.dispatchEvent(new Event('timeupdate'));
      },
      [castFramework.RemotePlayerEventType.VIDEO_INFO_CHANGED]: () => {
        this.target?.dispatchEvent(new Event('resize'));
      },
      [castFramework.RemotePlayerEventType.IS_PAUSED_CHANGED]: () => {
        this.target?.dispatchEvent(new Event(this.#isCasting && this.#remotePlayer.isPaused ? 'pause' : 'play'));
      },
      [castFramework.RemotePlayerEventType.PLAYER_STATE_CHANGED]: () => {
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
      [castFramework.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED]: async () => {
        if (!this.#isCasting || !this.#remotePlayer.isMediaLoaded) return;

        await Promise.resolve();
        this.#onRemoteMediaLoaded();
      },
    };
  }

  onCastStateChanged() {
    if (!this.#isInit) return;

    const CS = cast.framework.CastState;
    const state = getCastContext()!.getCastState();

    if (this.#isCasting && state === CS.CONNECTING) {
      this.#hooks.setState?.('connecting');
    }

    this.#hooks.setAvailable?.(!!state && state !== CS.NO_DEVICES_AVAILABLE);
  }

  async onSessionStateChanged() {
    if (!this.#isInit) return;

    const { SESSION_RESUMED } = castFramework!.SessionState;

    if (getCastContext()!.getSessionState() === SESSION_RESUMED) {
      const { src } = this.#googleCast;

      if (src && src === currentMedia()?.media?.contentId) {
        this.#isCasting = true;
        this.#loadedSrc = src;

        this.#attachRemoteListeners();

        try {
          await getMediaStatus(new chrome.cast.media.GetStatusRequest());
        } catch (error) {
          console.error(error);
        }

        this.#remoteListeners[castFramework!.RemotePlayerEventType.IS_PAUSED_CHANGED]!();
        this.#remoteListeners[castFramework!.RemotePlayerEventType.PLAYER_STATE_CHANGED]!();
        this.target?.dispatchEvent(new Event('ratechange'));

        // TODO: sync remote enabled text track state to local text tracks
      }
    }
  }

  #isCastApiAvailable() {
    return Boolean(globalThis.chrome?.cast?.isAvailable);
  }

  #applyCastOptions() {
    const { receiver } = this.#googleCast;

    setCastOptions(receiver ? { receiverApplicationId: receiver } : {});
  }

  // CAF's RemotePlayerController does not deduplicate handlers, so we guard
  // attach/detach with a flag to prevent duplicate event dispatches across
  // cancel/retry and stop-casting flows.
  #attachRemoteListeners() {
    if (this.#listenersAttached) return;

    const controller = this.#remotePlayer?.controller;
    if (!controller) return;

    for (const [type, handler] of Object.entries(this.#remoteListeners)) {
      controller.addEventListener(type as cast.framework.RemotePlayerEventType, handler);
    }

    this.#listenersAttached = true;
  }

  #detachRemoteListeners() {
    if (!this.#listenersAttached) return;

    const controller = this.#remotePlayer?.controller;

    if (controller) {
      for (const [type, handler] of Object.entries(this.#remoteListeners)) {
        controller.removeEventListener(type as cast.framework.RemotePlayerEventType, handler);
      }
    }

    this.#listenersAttached = false;
  }

  #disconnect() {
    if (!this.#isCasting) return;

    currentMedia()?.removeUpdateListener(this.#onMediaUpdate);
    this.#detachRemoteListeners();
    this.#seeking = false;
    this.#playbackRate = 1;
    this.#isCasting = false;
    this.#loadedSrc = null;

    if (this.target) {
      this.target.muted = this.#remotePlayer.isMuted;
    }

    const saved = this.#remotePlayer.savedPlayerState;

    if (saved) {
      if (this.target) {
        this.target.currentTime = saved.currentTime;
      }

      if (saved.isPaused === false && this.target) {
        this.target.play();
      }
    }
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
    this.#updateRemoteTextTrack();
  }

  #checkPlaybackRate() {
    const rate = currentMedia()?.playbackRate ?? 1;

    if (rate !== this.#playbackRate) {
      this.#playbackRate = rate;
      this.target?.dispatchEvent(new Event('ratechange'));
    }
  }

  async #updateRemoteTextTrack() {
    if (!this.#isCasting || !this.target) return;

    const localSubs = [...this.target.textTracks].filter(isCaptionOrSubtitleTrack);

    const matched = (this.#remotePlayer.mediaInfo?.tracks ?? [])
      .filter(({ type }) => type === chrome.cast.media.TrackType.TEXT)
      .flatMap(({ language, name, trackId }) => {
        const local = localSubs.find((l) => l.language === language && l.label === name);

        return local?.mode ? [{ mode: local.mode, trackId }] : [];
      });

    const hidden = new Set(matched.filter((m) => m.mode !== 'showing').map((m) => m.trackId));
    const showing = matched.find((m) => m.mode === 'showing')?.trackId;

    const active = currentSession()?.getSessionObj().media[0]?.activeTrackIds ?? [];
    const next = new Set(active.filter((id) => !hidden.has(id)));

    if (showing) next.add(showing);

    if (next.size === active.length && active.every((id) => next.has(id))) return;

    try {
      await editTracksInfo(new chrome.cast.media.EditTracksInfoRequest([...next]));
    } catch (error) {
      console.error(error);
    }
  }
}
