import {
  MediaError,
  type MediaPlaybackRateRange,
  NO_TIME_RANGES_YET,
  type TextTrackListLike,
  type Video,
} from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { deepEqual } from '@videojs/utils/object';
import { isNumber, isObject, isString } from '@videojs/utils/predicate';

import {
  destroyVidyardPlayer,
  loadVidyardApi,
  VIDYARD_PLAYER_ORIGIN,
  type VidyardApi,
  type VidyardPlayerApi,
} from './player-api';
import type { VidyardAdapterProps } from './props';
import { resolveVidyardRenderOptions, type VidyardSource } from './source';
import { VidyardTextTrackList } from './text-tracks';

/**
 * Plays Vidyard players through the Vidyard embed script and its Player API. The source names a player by its UUID; a
 * player that holds a playlist plays it through, and `duration`, `currentTime`, and `textTracks` follow the video on
 * screen. `ended` waits for the end of the last video.
 *
 * The target is a container the player is built in. The embed script builds its own layout, which the media replaces
 * with one that fills the container.
 *
 * The Player API has no mute, so `muted` sets the player's volume to `0` and restores it on unmute; on iOS, where pages
 * can't set the volume, it has no effect. Vidyard plays from `0.5` to `2` times, and sends nothing when its rate
 * changes, so a rate picked in Vidyard's own controls isn't reported. Nor is buffering: `buffered` ends at the furthest
 * point played.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class VidyardAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: VidyardAdapterProps = {
    src: '',
    autoplay: false,
    defaultMuted: false,
    muted: false,
    loop: false,
    controls: false,
    playsInline: true,
    preload: 'metadata',
    poster: '',
    source: null,
  };

  /** Engine this media plays through, reported to analytics such as Mux Data. */
  static readonly engineName: string = 'vidyard';

  #target: HTMLElement | null = null;
  // Holds the player in a shadow root of its own, so its layout and the page's styles don't meet.
  #mount: HTMLElement | null = null;
  #api: VidyardApi | null = null;
  #player: VidyardPlayerApi | null = null;
  #unbind: (() => void) | null = null;
  // Guards async player creation across attach/detach cycles and rebuilds.
  #attachId = 0;
  // Lets a `load()` waiting out its microtask drop out once a newer load begins.
  #loadId = 0;
  #loadPending = false;
  // A `currentTime` set while a load is pending, which the incoming player starts at.
  #pendingStartTime: number | null = null;

  #src = VidyardAdapter.defaultProps.src;
  #autoplay = VidyardAdapter.defaultProps.autoplay;
  #defaultMuted = VidyardAdapter.defaultProps.defaultMuted;
  #loop = VidyardAdapter.defaultProps.loop;
  #controls = VidyardAdapter.defaultProps.controls;
  #playsInline = VidyardAdapter.defaultProps.playsInline;
  #preload = VidyardAdapter.defaultProps.preload;
  #poster = VidyardAdapter.defaultProps.poster;
  #source: VidyardSource | null = VidyardAdapter.defaultProps.source;

  #playRequested = false;
  // Whether this load may still autoplay; a `pause()` before the player is ready withdraws it.
  #autoplayPending = false;
  // Whether the player was built to start on its own, which happens only with sound.
  #autoplayingWithSound = false;
  // From a play until the position moves, which is when the player reports nothing else to tell it is playing.
  #playFrom: number | null = null;
  // Levels sent to the player, whose `volumeChange` reports echo them back.
  #volumeEchoes: number[] = [];
  // A seek sent to the player, which it answers with `beforeSeek` alone.
  #seekSent = false;
  #seekTimer: ReturnType<typeof setTimeout> | undefined;
  // Index of the video on screen in the player's playlist.
  #videoIndex: number | null = null;
  #bufferedEnd = 0;
  #textTracks = new VidyardTextTrackList();

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
  // Volume, mute, and rate survive a source change, as on a media element.
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  constructor() {
    super();
    this.#textTracks.addEventListener('change', () => this.#applyCaptions());
  }

  /** The Player API's player object, or null until the player is ready. */
  get engine(): VidyardPlayerApi | null {
    return this.#player;
  }

  get target(): HTMLElement | null {
    return this.#target;
  }

  /** Bind the container the player is built in; the player is built once `src` resolves. */
  attach(target: HTMLElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    // `attach()` loads the current source itself, so a `load()` still waiting drops out instead of loading it again.
    this.#loadId++;
    this.#loadPending = false;
    this.#createPlayer();
  }

  detach(): void {
    if (!this.#target) return;

    this.#destroyPlayer();
    this.#target = null;
    this.#loadPending = false;
    this.#pendingStartTime = null;
    this.#playRequested = false;
    this.#autoplayPending = false;
    this.#resetState();
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  get src() {
    return this.#src;
  }
  /** Vidyard sharing page URL, player URL, or player UUID. Setting it re-derives `source`, carrying its options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: VidyardSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the one path for storing it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    return this.#player ? this.#src : '';
  }

  get readyState() {
    return this.#readyState;
  }

  /** Load the current source into a new player, since the player reads its UUID and parameters once. */
  async load() {
    if (!this.#target) return;

    const loadId = ++this.#loadId;

    this.#loadPending = true;
    // As on a media element, a load drops a play the previous source was still holding; one made after it is kept.
    this.#playRequested = false;

    // Wait a microtask so a framework's prop writes all land before the player is configured.
    await Promise.resolve();

    if (loadId !== this.#loadId || !this.#target) return;

    const pendingStartTime = this.#pendingStartTime;

    this.#loadPending = false;
    this.#pendingStartTime = null;
    this.#destroyPlayer();
    this.#resetState();

    if (pendingStartTime !== null) {
      this.#seeking = true;
      this.#currentTime = pendingStartTime;
    }

    this.dispatchEvent(new Event('emptied'));
    this.#createPlayer();
  }

  get paused() {
    return this.#paused;
  }

  get ended() {
    return this.#ended;
  }

  get seeking() {
    return this.#seeking;
  }

  async play() {
    if (!this.#src) return;

    if (!this.#player || this.#loadPending) {
      this.#playRequested = true;
      return;
    }

    tryCall(() => this.#player?.play());
  }

  pause() {
    // The later intent wins over a pending play.
    this.#playRequested = false;
    this.#autoplayPending = false;

    tryCall(() => this.#player?.pause());
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    // As on a media element, a seek outside the video lands on its edge.
    const targetTime = Number.isFinite(this.#duration) ? clamp(value, 0, this.#duration) : Math.max(0, value);
    if (this.#currentTime === targetTime) return;

    this.#seeking = true;
    // As on a media element, seeking leaves the ended state.
    this.#ended = false;
    // Report the target time now; the player's reports until it lands would drag it back.
    this.#currentTime = targetTime;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    if (this.#loadPending) {
      this.#pendingStartTime = targetTime;
      return;
    }

    // Without a player yet, it seeks once ready.
    this.#seek(targetTime);
  }

  get duration() {
    return this.#duration;
  }

  get volume() {
    return this.#volume;
  }
  set volume(value) {
    if (this.#volume === value) return;

    this.#volume = value;
    this.dispatchEvent(new Event('volumechange'));

    // While muted the player holds `0`; the new level applies on unmute.
    if (!this.#muted) this.#setPlayerVolume(value);
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));
    this.#setPlayerVolume(this.#playerVolume());
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.dispatchEvent(new Event('ratechange'));
    tryCall(() => this.#player?.setPlaybackSpeed(value));
  }

  /**
   * Vidyard lists `0.5`, `0.75`, `1`, `1.25`, `1.5`, and `2` as its rates, and plays the rates between them too.
   *
   * @internal
   */
  get playbackRateRange(): MediaPlaybackRateRange {
    return PLAYBACK_RATE_RANGE;
  }

  /**
   * Starts playback on each load. Unmuted, Vidyard starts only if the browser allows sound, and otherwise stays paused,
   * as a `<video>` does; muted, the media mutes the player and then plays it.
   */
  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    this.#autoplay = value;
  }

  get defaultMuted() {
    return this.#defaultMuted;
  }
  set defaultMuted(value) {
    this.#defaultMuted = value;

    // Seeds `muted` until there is a player, which then takes it on ready.
    if (!this.#player) this.#muted = value;
  }

  /** Restarts playback at the end, of the playlist for a player that holds one. */
  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;
  }

  /**
   * Shows Vidyard's own controls, and leaves its calls to action and share button to the player's settings. Read when
   * the player is built, on the next load.
   */
  get controls() {
    return this.#controls;
  }
  set controls(value) {
    this.#controls = value;
  }

  get playsInline() {
    return this.#playsInline;
  }
  set playsInline(value) {
    this.#playsInline = value;
  }

  get preload() {
    return this.#preload;
  }
  set preload(value) {
    this.#preload = value;
  }

  get poster() {
    return this.#poster;
  }
  set poster(value) {
    this.#poster = value;
  }

  /** Vidyard source in `src`, player parameters under `engine.vidyard`. */
  get source(): VidyardSource | null {
    return this.#source;
  }
  set source(value: VidyardSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    const engineChanged = !deepEqual(this.#source?.engine?.vidyard ?? null, source?.engine?.vidyard ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  get buffered() {
    const end = Math.max(this.#bufferedEnd, this.#currentTime);

    return end > 0 ? createTimeRange(0, end) : NO_TIME_RANGES_YET;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration)
      ? createTimeRange(0, this.#duration)
      : NO_TIME_RANGES_YET;
  }

  get error() {
    return this.#error;
  }

  /**
   * The caption tracks of the video on screen. Vidyard draws the cues inside its player, so the tracks have none, and
   * showing one shows it there. Vidyard turns on a video's default track by itself, so that track starts `showing`.
   */
  get textTracks(): TextTrackListLike {
    return this.#textTracks;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  async requestFullscreen() {
    // No element to request on means nothing entered fullscreen, so the flag must not claim otherwise.
    if (!this.#target?.requestFullscreen) return;

    await this.#target.requestFullscreen();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    const doc = globalThis.document;

    if (doc?.fullscreenElement && doc.fullscreenElement === this.#target) await doc.exitFullscreen();

    this.#isFullscreen = false;
  }

  // A source that can't resolve reports why; `load()` retries once it changes.
  #createPlayer() {
    const target = this.#target;
    if (!target || !this.#src) return;

    const options = resolveVidyardRenderOptions(this.#src, this.#snapshotProps());

    this.dispatchEvent(new Event('loadstart'));

    if (!options) {
      this.#fail(new MediaError(`Unrecognized Vidyard source: ${this.#src}`, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED));
      return;
    }

    const mount = target.ownerDocument.createElement('div');
    const root = mount.attachShadow({ mode: 'open' });
    const container = target.ownerDocument.createElement('div');

    root.innerHTML = `<style>${PLAYER_STYLES}</style>`;
    root.append(container);
    mount.setAttribute('style', MOUNT_STYLE);
    target.append(mount);

    this.#mount = mount;
    this.#autoplayPending = this.#autoplay;
    this.#autoplayingWithSound = this.#autoplay && !this.#muted;

    const attachId = this.#attachId;
    const messages = new AbortController();

    // The player's error page posts without the UUID the Player API routes messages by, so only this sees it.
    globalThis.addEventListener('message', (event) => this.#onMessage(event, container, attachId), {
      signal: messages.signal,
    });
    this.#unbind = () => messages.abort();

    void this.#renderPlayer(container, options.uuid, options.params, attachId);
  }

  async #renderPlayer(container: HTMLElement, uuid: string, params: Record<string, string>, attachId: number) {
    let api: VidyardApi;
    let player: VidyardPlayerApi | undefined;

    try {
      api = await loadVidyardApi();
    } catch (cause) {
      if (this.#isStale(attachId)) return;

      this.#fail(new MediaError('Failed to load the Vidyard embed script', MediaError.MEDIA_ERR_NETWORK), { cause });
      return;
    }

    if (this.#isStale(attachId)) return;

    this.#api = api;

    try {
      player = await api.api.renderPlayer({ ...params, uuid, container, type: 'inline' });
    } catch (cause) {
      if (this.#isStale(attachId)) return;

      this.#fail(new MediaError('Vidyard could not render the player', MediaError.MEDIA_ERR_NETWORK), { cause });
      return;
    }

    if (this.#isStale(attachId)) {
      if (player) destroyVidyardPlayer(api, player);

      return;
    }

    // Vidyard resolves with nothing when it can't load the player's thumbnail, which it builds the player from.
    if (!player) {
      this.#fail(new MediaError('Vidyard could not render the player', MediaError.MEDIA_ERR_NETWORK));
      return;
    }

    this.#player = player;
    this.#bindPlayerEvents(player, attachId);
    this.#onReady(player);
  }

  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  #bindPlayerEvents(player: VidyardPlayerApi, attachId: number) {
    const handlers = {
      play: () => this.#onPlay(),
      pause: () => this.#onPause(),
      timeupdate: () => this.#onTimeUpdate(),
      beforeSeek: () => this.#onBeforeSeek(),
      seek: () => this.#onSeeked(),
      playerComplete: () => this.#onComplete(),
      videoComplete: () => this.#onVideoReport(),
      volumeChange: (volume) => {
        if (isNumber(volume)) this.#onVolumeChange(volume);
      },
      metadata: () => this.#onVideoReport(),
    } satisfies Record<string, (data: unknown) => void>;

    const listeners: [string, (data: unknown) => void][] = [];

    for (const [event, handler] of Object.entries(handlers)) {
      const listener = (data: unknown) => {
        if (!this.#isStale(attachId)) handler(data);
      };

      listeners.push([event, listener]);
      tryCall(() => player.on(event, listener));
    }

    const unbindMessages = this.#unbind;

    this.#unbind = () => {
      unbindMessages?.();

      for (const [event, listener] of listeners) tryCall(() => player.off(event, listener));
    };
  }

  #onMessage(event: MessageEvent, container: HTMLElement, attachId: number) {
    if (this.#isStale(attachId) || event.origin !== VIDYARD_PLAYER_ORIGIN) return;

    const frame = container.querySelector('iframe');
    if (!frame || event.source !== frame.contentWindow) return;

    const message = parseMessage(event.data);
    if (message?.event !== 'error') return;

    // SAFETY: an object, whose `message` is checked before use.
    const params = isObject(message.params) ? (message.params as { message?: unknown }) : {};
    const reason = isString(params.message) ? params.message : undefined;

    // The player reports a missing or deleted video this way, with copy written for viewers.
    this.#fail(new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, reason));
  }

  #destroyPlayer() {
    this.#attachId++;
    this.#unbind?.();
    this.#unbind = null;
    clearTimeout(this.#seekTimer);

    const api = this.#api;
    const mount = this.#mount;
    const player = this.#player ?? this.#findRenderingPlayer();

    this.#player = null;
    this.#mount = null;
    this.#videoIndex = null;
    this.#volumeEchoes = [];
    this.#textTracks.clear();

    if (api && player) destroyVidyardPlayer(api, player);

    mount?.remove();
  }

  // A player Vidyard is still building, which it registers before it is ready.
  #findRenderingPlayer(): VidyardPlayerApi | undefined {
    const root = this.#mount?.shadowRoot;
    if (!root || !this.#api) return undefined;

    return this.#api.players.find((player) => player.container && root.contains(player.container));
  }

  #onReady(player: VidyardPlayerApi) {
    this.#syncVideo();

    if (!this.#seeking) this.#applyCurrentTime(player.status?.currentTime);

    this.#readyState = READY_STATE_HAVE_METADATA;
    this.dispatchEvent(new Event('loadedmetadata'));

    if (this.#muted || this.#volume !== 1) this.#setPlayerVolume(this.#playerVolume());

    if (this.#playbackRate !== 1) tryCall(() => player.setPlaybackSpeed(this.#playbackRate));

    this.#applyCaptions();

    if (this.#seeking) this.#seek(this.#currentTime);

    this.#startPlayback(player);
  }

  #startPlayback(player: VidyardPlayerApi) {
    const autoplay = this.#autoplayPending;
    const requested = this.#playRequested;

    this.#autoplayPending = false;
    this.#playRequested = false;

    // Vidyard starts this player by itself, and only with sound. A play sent without a gesture would start it muted
    // instead, without reporting the mute.
    if (this.#autoplayingWithSound && !requested) {
      if (!autoplay) tryCall(() => player.pause());

      return;
    }

    if (autoplay || requested) tryCall(() => player.play());
  }

  #seek(time: number) {
    const player = this.#player;
    if (!player) return;

    this.#seekSent = true;
    tryCall(() => player.seek(time));
    this.#settleSeekLater();
  }

  // The player answers a seek within a few milliseconds; this settles one it drops.
  #settleSeekLater() {
    clearTimeout(this.#seekTimer);
    this.#seekTimer = setTimeout(() => this.#onSeeked(), SEEK_SETTLE_TIMEOUT);
  }

  // A seek sent to the player reports `beforeSeek` once it has moved. One made in Vidyard's own controls reports
  // `beforeSeek` as the viewer scrubs, then `seek` once they let go.
  #onBeforeSeek() {
    if (this.#seekSent) {
      this.#onSeeked();
      return;
    }

    this.#syncVideo();
    this.#settleSeekLater();

    if (this.#seeking) return;

    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
  }

  // The level the player holds: `0` while muted, since it has no mute.
  #playerVolume() {
    return this.#muted ? 0 : this.#volume;
  }

  #setPlayerVolume(volume: number) {
    const player = this.#player;
    if (!player) return;

    this.#volumeEchoes.push(volume);

    if (this.#volumeEchoes.length > MAX_VOLUME_ECHOES) this.#volumeEchoes.shift();

    tryCall(() => player.setVolume(volume));
  }

  #applyCaptions() {
    const player = this.#player;
    if (!player || this.#textTracks.length === 0) return;

    const showing = Array.from(this.#textTracks).find((track) => track.mode === 'showing');

    if (showing) tryCall(() => player.enableCaption(showing.label, showing.language));
    else tryCall(() => player.disableCaption());
  }

  // At the end the player rewinds to the start screen of its first video, which the ended state keeps hidden.
  #onVideoReport() {
    if (!this.#ended) this.#syncVideo();
  }

  // The player moves to the next video of a playlist by itself, and reports it with the next event it sends. Only
  // events move `#videoIndex`: a status report or two about the previous video still follows the move.
  #syncVideo() {
    const status = this.#player?.status;
    const index = status?.chapterIndex;
    if (!isNumber(index)) return;

    const video = this.#player?.metadata?.chapters_attributes?.[index]?.video_attributes;
    const duration = isNumber(video?.length_in_milliseconds)
      ? video.length_in_milliseconds / 1000
      : video?.length_in_seconds;

    if (index === this.#videoIndex) {
      this.#applyDuration(duration);
      return;
    }

    const moved = this.#videoIndex !== null;

    this.#videoIndex = index;
    this.#bufferedEnd = 0;
    this.#textTracks.clear();

    for (const caption of video?.captions ?? []) {
      if (!caption.language) continue;

      this.#textTracks.add(caption.name ?? '', caption.language, caption.is_default ? 'showing' : 'disabled');
    }

    // Moved before the duration changes, so the position is never past the end of the next video.
    if (moved && !this.#seeking) this.#currentTime = isNumber(status?.currentTime) ? status.currentTime : 0;

    this.#applyDuration(duration);

    if (moved) this.dispatchEvent(new Event('timeupdate'));
  }

  #onPlay() {
    this.#syncVideo();

    if (!this.#paused) return;

    this.#paused = false;
    this.#ended = false;
    this.#playFrom = this.#player?.status?.currentTime ?? this.#currentTime;
    this.dispatchEvent(new Event('play'));

    if (!this.#seeking) this.#applyCurrentTime(this.#player?.status?.currentTime);
  }

  #onPause() {
    this.#syncVideo();

    if (this.#paused) return;

    this.#paused = true;
    this.#playFrom = null;
    this.dispatchEvent(new Event('pause'));
  }

  // Until a seek lands, the player reports where it was, and once it moves to the next video it still reports the
  // previous one.
  #onTimeUpdate() {
    const status = this.#player?.status;
    if (this.#ended || this.#seeking || status?.chapterIndex !== this.#videoIndex) return;

    const time = status.currentTime;

    this.#applyCurrentTime(time);

    if (this.#playFrom !== null && !this.#paused && isNumber(time) && time !== this.#playFrom) this.#onPlaying();
  }

  #onPlaying() {
    this.#playFrom = null;

    if (this.#readyState < READY_STATE_HAVE_FUTURE_DATA) {
      this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
      this.dispatchEvent(new Event('canplay'));
    }

    this.dispatchEvent(new Event('playing'));
  }

  #onSeeked() {
    clearTimeout(this.#seekTimer);
    this.#seekSent = false;
    this.#syncVideo();

    if (!this.#seeking) {
      this.#seeking = true;
      this.dispatchEvent(new Event('seeking'));
    }

    this.#seeking = false;
    this.#ended = false;
    this.#applyCurrentTime(this.#player?.status?.currentTime);

    // A playing player keeps playing from there, which `playing` reports once the position moves again.
    if (!this.#paused) this.#playFrom = this.#currentTime;

    this.dispatchEvent(new Event('seeked'));
  }

  #onComplete() {
    if (this.#loop) {
      tryCall(() => this.#player?.play());
      return;
    }

    if (Number.isFinite(this.#duration) && this.#currentTime !== this.#duration) {
      this.#currentTime = this.#duration;
      this.dispatchEvent(new Event('timeupdate'));
    }

    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));
  }

  #onVolumeChange(volume: number) {
    const echo = this.#volumeEchoes.indexOf(volume);

    if (echo >= 0) {
      this.#volumeEchoes.splice(0, echo + 1);
      return;
    }

    // A change made in Vidyard's own controls. Its mute button reports the level `0`.
    const muted = volume === 0;
    const level = muted ? this.#volume : clamp(volume, 0, 1);
    if (muted === this.#muted && level === this.#volume) return;

    this.#muted = muted;
    this.#volume = level;
    this.dispatchEvent(new Event('volumechange'));
  }

  #applyDuration(duration: number | undefined) {
    if (!isNumber(duration) || !(duration > 0) || duration === this.#duration) return;

    this.#duration = duration;
    this.dispatchEvent(new Event('durationchange'));
  }

  #applyCurrentTime(time: number | undefined) {
    if (!isNumber(time)) return;

    // The player's clock runs a little past the duration it reports at the end.
    const next = Number.isFinite(this.#duration) ? Math.min(time, this.#duration) : time;
    if (next === this.#currentTime) return;

    this.#currentTime = next;
    this.#bufferedEnd = Math.max(this.#bufferedEnd, next);
    this.dispatchEvent(new Event('timeupdate'));
  }

  #fail(error: MediaError, data?: Record<string, unknown>) {
    if (data) error.data = data;

    this.#error = error;
    this.dispatchEvent(new Event('error'));
  }

  #snapshotProps(): Partial<VidyardAdapterProps> {
    return {
      autoplay: this.#autoplay,
      muted: this.#muted,
      controls: this.#controls,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#seekSent = false;
    this.#playFrom = null;
    this.#bufferedEnd = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
    this.#isFullscreen = false;
  }
}

function parseMessage(data: unknown): { event?: unknown; params?: unknown } | null {
  if (!isString(data)) return null;

  try {
    const message: unknown = JSON.parse(data);

    return isObject(message) ? message : null;
  } catch {
    return null;
  }
}

const PLAYBACK_RATE_RANGE: MediaPlaybackRateRange = { min: 0.5, max: 2 };

const SEEK_SETTLE_TIMEOUT = 2_000;

const MAX_VOLUME_ECHOES = 20;

const MOUNT_STYLE = 'position: absolute; inset: 0;';

// The embed script sizes the player by the video's aspect ratio with inline styles, which it rewrites as the player
// loads, so only `!important` holds the player to the container.
const PLAYER_STYLES = `
  div {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  img.vidyard-player-embed {
    display: none !important;
  }
`;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
