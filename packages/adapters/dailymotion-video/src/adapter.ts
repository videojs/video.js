// Drives the Dailymotion Web SDK (https://developers.dailymotion.com/reference/web-sdk-player-methods), shaped like the
// other embed adapters (mirrors `youtube-video`, which also loads its player API from a script).

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise, tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { deepEqual } from '@videojs/utils/object';
import { isBoolean, isNumber } from '@videojs/utils/predicate';
import { generateId } from '@videojs/utils/string';

import type { DailymotionAdapterProps } from './props';
import {
  type DailymotionApi,
  type DailymotionCreatePlayerOptions,
  type DailymotionPlayerApi,
  type DailymotionPlayerState,
  loadDailymotionApi,
} from './sdk-api';
import { type DailymotionSource, parseDailymotionSource, resolveDailymotionPlayerOptions } from './source';

/**
 * Plays Dailymotion videos through the Dailymotion Web SDK. Dailymotion only embeds a video inside a player
 * configuration made in Dailymotion Studio, so the source must name one: under `engine.dailymotion.player`, or by being
 * a player embed URL (`geo.dailymotion.com/player/<player>.html?video=<id>`).
 *
 * The target is a container element the SDK builds its player in. The SDK finds it by id from the document, so the
 * container has to be reachable from there: in the light DOM, not inside a shadow root.
 *
 * The configuration owns what the SDK cannot change. Its controls stay drawn under the Video.js skin unless the
 * configuration turns them off, and an `autostart` it enables starts playback whatever `autoplay` says; `autoplay` can
 * only start a player the configuration leaves stopped. `currentTime` and `duration` always describe the video, while
 * `paused` follows whatever is on screen, ad or video. The SDK reports no buffered range, so `buffered` ends at the
 * playhead.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class DailymotionAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: DailymotionAdapterProps = {
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

  static PLAYER_SOFTWARE_NAME = 'dailymotion-video';

  #target: HTMLElement | null = null;
  // The element handed to `createPlayer`, which the SDK swaps for its own and puts back on `destroy()`.
  #placeholder: HTMLElement | null = null;
  #player: DailymotionPlayerApi | null = null;
  // What the current player was created with, so a change of video alone can load into it instead of rebuilding.
  #options: DailymotionCreatePlayerOptions | null = null;
  #unbindEvents: (() => void) | null = null;
  #loadComplete = createPublicPromise<void>();
  // Guards async player creation across attach/detach cycles and rebuilds.
  #attachId = 0;

  #src = DailymotionAdapter.defaultProps.src;
  #autoplay = DailymotionAdapter.defaultProps.autoplay;
  #defaultMuted = DailymotionAdapter.defaultProps.defaultMuted;
  #loop = DailymotionAdapter.defaultProps.loop;
  #controls = DailymotionAdapter.defaultProps.controls;
  #playsInline = DailymotionAdapter.defaultProps.playsInline;
  #preload = DailymotionAdapter.defaultProps.preload;
  #poster = DailymotionAdapter.defaultProps.poster;
  #source: DailymotionSource | null = DailymotionAdapter.defaultProps.source;

  // `createPlayer` resolves once the player takes commands; until then every value is held for `#syncToEmbed`.
  #ready = false;
  // A video was loaded into the running player; its `videochange` completes the load.
  #swapping = false;
  // A play asked for before the player could take one, replayed once it is ready.
  #playRequested = false;

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
  // Volume, mute, and rate survive a source change, as on a media element, and are asserted on each new player.
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  /** The SDK's player object. Null until the SDK has loaded and the player is ready. */
  get engine(): DailymotionPlayerApi | null {
    return this.#player;
  }

  get target(): HTMLElement | null {
    return this.#target;
  }

  /** Bind the container the SDK builds its player in. The player follows once a `src` resolves, which may be later. */
  attach(target: HTMLElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#beginLoad();
    this.#createPlayer();
  }

  detach(): void {
    if (!this.#target) return;

    this.#destroyPlayer();
    this.#target = null;
    // Left set, the next player to become ready would start playing on its own.
    this.#playRequested = false;
    // Unblock callers awaiting load; they re-check the player (now gone) and no-op.
    this.#loadComplete.resolve();
    this.#resetState();
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  get src() {
    return this.#src;
  }
  /** Dailymotion video URL. Setting it re-derives `source`, carrying its engine options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: DailymotionSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the one path for storing it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // The source loaded into the player. Not the URL of the iframe the SDK built, which keeps naming the first video
    // after another is loaded into the same player.
    return this.#player ? this.#src : '';
  }

  get readyState() {
    return this.#readyState;
  }

  /**
   * Load the current source: into the running player when only the video changed, otherwise into a new player, since
   * the player configuration and runtime parameters are only read when a player is created.
   */
  async load() {
    // Nothing to load into without a target, and no load to wait on either.
    if (!this.#target) return;

    const load = this.#beginLoad();

    // Wait a microtask so a framework's `src` and prop writes all land before the player is configured, once.
    await Promise.resolve();

    // A later load took over while waiting, or the target went away; either way this load is not ours to finish.
    if (load !== this.#loadComplete || !this.#target) return;

    const options = resolveDailymotionPlayerOptions(this.#src, this.#snapshotProps());
    const player = this.#player;

    this.#resetState();
    // `emptied` announces that reset before any bail, where the player reports nothing further.
    this.dispatchEvent(new Event('emptied'));

    if (player && options && isSameEmbed(this.#options, options)) {
      this.#options = options;
      this.#swapping = true;
      this.dispatchEvent(new Event('loadstart'));
      tryCall(() => player.loadContent({ video: options.video }));
      return;
    }

    this.#destroyPlayer();
    this.#createPlayer();
  }

  // Take over as the current load; settling the outgoing barrier releases its waiters.
  #beginLoad(): PublicPromise<void> {
    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    return this.#loadComplete;
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

    if (!this.#ready) {
      this.#playRequested = true;
      return;
    }

    tryCall(() => this.#player?.play());
  }

  pause() {
    // A pause after a pending play is the later intent, so it cancels the replay rather than racing it.
    this.#playRequested = false;

    if (this.#ready) tryCall(() => this.#player?.pause());
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#seeking = true;
    // Seeking away from the end leaves it, as on a media element; the player's next report says otherwise if not.
    this.#ended = false;
    // Report the requested position now; until the player lands, its reports would look like a lost seek.
    this.#currentTime = value;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    // Before ready, `#syncToEmbed` sends the seek still pending.
    if (this.#ready) tryCall(() => this.#player?.seek(value));
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
    // The player's report of a commanded level reads as unchanged, so the host announces its own change.
    this.dispatchEvent(new Event('volumechange'));

    // While muted the player holds a level of `0`, so the new level waits for the unmute that restores it.
    if (this.#ready && !this.#muted) tryCall(() => this.#player?.setVolume(value));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));

    if (this.#ready) this.#applyMuted();
  }

  /** Dailymotion plays at a fixed set of rates (`0.25` to `2` in quarter steps) and rounds to the next one up. */
  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.dispatchEvent(new Event('ratechange'));

    if (this.#ready) tryCall(() => this.#player?.setPlaybackSpeed(value));
  }

  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    // Not a runtime parameter: the player configuration's `autostart` decides, and the host plays on ready on top of it.
    this.#autoplay = value;
  }

  get defaultMuted() {
    return this.#defaultMuted;
  }
  set defaultMuted(value) {
    this.#defaultMuted = value;

    // Seed `muted` until the player is up; `#syncToEmbed` asserts it through the SDK.
    if (!this.#ready) this.#muted = value;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;

    // Passed to the next player as a runtime parameter, and changed in place for the current one.
    if (this.#ready) tryCall(() => this.#player?.setLoop(value));
  }

  get controls() {
    return this.#controls;
  }
  set controls(value) {
    // Only the player configuration can hide Dailymotion's chrome; `controls` decides whether the player takes input.
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

  /** Dailymotion video URL in `src`, player configuration and parameters under `engine.dailymotion`. */
  get source(): DailymotionSource | null {
    return this.#source;
  }
  set source(value: DailymotionSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    const engineChanged = !deepEqual(this.#source?.engine?.dailymotion ?? null, source?.engine?.dailymotion ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  get buffered() {
    return this.#currentTime > 0 ? createTimeRange(0, this.#currentTime) : EMPTY_TIME_RANGES;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration)
      ? createTimeRange(0, this.#duration)
      : EMPTY_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  /** Always empty: the player draws its own subtitles and reports no cues to render elsewhere. */
  get textTracks() {
    return EMPTY_TEXT_TRACKS;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  // Fullscreen targets the container, which holds the player the SDK built.
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

  // Create a player in the target for the current source. A source that cannot resolve settles its load, and
  // `load()` retries once it changes.
  #createPlayer() {
    const target = this.#target;
    if (!target) return;

    const options = resolveDailymotionPlayerOptions(this.#src, this.#snapshotProps());

    if (!options) {
      // No player means nothing is coming to settle this load.
      this.#loadComplete.resolve();

      if (this.#src) {
        this.dispatchEvent(new Event('loadstart'));
        this.#onSourceError();
      }

      return;
    }

    // The SDK looks the container up by id, which has to be a valid selector.
    const placeholder = globalThis.document.createElement('div');

    placeholder.id = `videojs-dailymotion-${generateId()}`;
    target.append(placeholder);

    this.#placeholder = placeholder;
    this.#options = options;
    this.dispatchEvent(new Event('loadstart'));
    void this.#createPlayerApi(placeholder, options);
  }

  async #createPlayerApi(placeholder: HTMLElement, options: DailymotionCreatePlayerOptions) {
    const attachId = this.#attachId;
    let api: DailymotionApi;
    let player: DailymotionPlayerApi;

    try {
      api = await loadDailymotionApi(options.player!);

      // Stale after the SDK loaded: the placeholder is already gone, and no player was created in it.
      if (this.#isStale(attachId)) return;

      player = await api.createPlayer(placeholder.id, options);
    } catch (cause) {
      // A failure belongs to the attach that started it; a newer one must not be marked failed.
      if (this.#isStale(attachId)) return;

      this.#error = new MediaError('Failed to load the Dailymotion player', MediaError.MEDIA_ERR_NETWORK);
      this.#error.data = { cause };
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      this.#loadComplete.resolve();
      return;
    }

    // Superseded while the player was being created: it belongs to no one, so it goes now.
    if (this.#isStale(attachId)) {
      tryCall(() => player.destroy());
      placeholder.remove();
      return;
    }

    this.#player = player;
    this.#unbindEvents = this.#bindPlayerEvents(api, player, attachId);
    // Fill the container rather than keep the configuration's aspect ratio, as any media element in a skin does.
    tryCall(() => player.updateParams({ aspectRatio: 'inherit' }));
    this.#onReady(player, attachId);
  }

  // Whether a callback belongs to a superseded player: the SDK resolves and reports asynchronously, so each report has
  // to match the attach that created its player to touch state.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  #bindPlayerEvents(api: DailymotionApi, player: DailymotionPlayerApi, attachId: number): () => void {
    const handlers: Record<string, (state: DailymotionPlayerState) => void> = {
      // An ad playing is on screen as much as the video is, so both start and stop playback.
      VIDEO_PLAY: () => this.#onPlay(),
      AD_PLAY: () => this.#onPlay(),
      VIDEO_PAUSE: () => this.#onPause(),
      AD_PAUSE: () => this.#onPause(),
      VIDEO_PLAYING: () => this.#onPlaying(),
      VIDEO_BUFFERING: () => this.dispatchEvent(new Event('waiting')),
      // The `video*` members describe the video even while an ad plays.
      VIDEO_TIMECHANGE: (state) => {
        if (!this.#seeking) this.#applyCurrentTime(state.videoTime);
      },
      VIDEO_DURATIONCHANGE: (state) => this.#applyDuration(state.videoDuration),
      VIDEO_SEEKSTART: () => this.#onSeeking(),
      VIDEO_SEEKEND: (state) => this.#onSeeked(state.videoTime),
      VIDEO_END: () => this.#onEnded(),
      PLAYER_VOLUMECHANGE: (state) => this.#onVolumeChange(state),
      PLAYER_PLAYBACKSPEEDCHANGE: (state) => {
        if (isNumber(state.playerPlaybackSpeed)) this.#applyPlaybackRate(state.playerPlaybackSpeed);
      },
      PLAYER_PLAYBACKPERMISSION: (state) => {
        if (state.playerPlaybackPermissionReason?.startsWith('rejected')) {
          this.#onPlaybackRejected(state.playerPlaybackPermissionReason);
        }
      },
      PLAYER_VIDEOCHANGE: (state) => this.#onVideoChange(state),
      PLAYER_ERROR: (state) => this.#onPlayerError(state),
    };

    const listeners: [string, (state: DailymotionPlayerState) => void][] = [];

    for (const [name, handler] of Object.entries(handlers)) {
      const event = api.events[name];
      if (!event) continue;

      const listener = (state: DailymotionPlayerState) => {
        if (this.#isStale(attachId)) return;

        handler(state ?? {});
      };

      listeners.push([event, listener]);
      tryCall(() => player.on(event, listener));
    }

    return () => {
      for (const [event, listener] of listeners) tryCall(() => player.off(event, listener));
    };
  }

  // Release the player. `destroy()` puts the placeholder back where the SDK found it, so removing the placeholder
  // leaves the container as the host rendered it.
  #destroyPlayer() {
    this.#attachId++;
    this.#unbindEvents?.();
    this.#unbindEvents = null;

    const player = this.#player;

    this.#player = null;
    this.#options = null;
    this.#ready = false;
    this.#swapping = false;

    if (player) tryCall(() => player.destroy());

    this.#placeholder?.remove();
    this.#placeholder = null;
  }

  #onReady(player: DailymotionPlayerApi, attachId: number) {
    this.#ready = true;
    this.#readyState = READY_STATE_HAVE_METADATA;

    this.#syncToEmbed(player);

    // Duration arrives with the state read below, which dispatches its own `durationchange`.
    for (const type of ['loadedmetadata', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();

    // Read after `#syncToEmbed`, and the player answers in order, so the state includes what was just asserted.
    player.getState().then(
      (state) => {
        if (!this.#isStale(attachId)) this.#onPlayerState(state);
      },
      () => {}
    );
  }

  // Assert what the host was asked for before the player was up.
  #syncToEmbed(player: DailymotionPlayerApi) {
    tryCall(() => {
      if (this.#muted) this.#applyMuted();
      else if (this.#volume !== 1) player.setVolume(this.#volume);

      if (this.#playbackRate !== 1) player.setPlaybackSpeed(this.#playbackRate);

      if (this.#seeking) player.seek(this.#currentTime);

      if (this.#autoplay || this.#playRequested) {
        this.#playRequested = false;
        player.play();
      }
    });
  }

  // A video loaded into the running player is ready once it says so. The player can also move on by itself, to a
  // recommendation, which reports the same way.
  #onVideoChange(state: DailymotionPlayerState) {
    if (this.#swapping) {
      this.#swapping = false;
      this.#readyState = READY_STATE_HAVE_METADATA;

      for (const type of ['loadedmetadata', 'loadcomplete']) {
        this.dispatchEvent(new Event(type));
      }

      this.#loadComplete.resolve();

      if (this.#autoplay || this.#playRequested) {
        this.#playRequested = false;
        tryCall(() => this.#player?.play());
      }
    }

    this.#onPlayerState(state);
  }

  // Apply a state read, which may already differ from the defaults: the player configuration can start it muted,
  // playing, or late.
  #onPlayerState(state: DailymotionPlayerState) {
    this.#applyDuration(state.videoDuration);

    if (!this.#seeking) this.#applyCurrentTime(state.videoTime);

    if (isNumber(state.playerPlaybackSpeed)) this.#applyPlaybackRate(state.playerPlaybackSpeed);

    this.#onVolumeChange(state);

    if (state.playerIsPlaying === true) this.#onPlay();
  }

  // The player has no mute: a level of `0` is what muted means to it, so unmuting restores the level the host holds.
  #onVolumeChange({ playerVolume, playerIsMuted }: DailymotionPlayerState) {
    // The player reports `null` for a mute it has not decided on yet.
    const muted = isBoolean(playerIsMuted) ? playerIsMuted : this.#muted;

    // A muted player reports the `0` it holds rather than the level to come back to, which only the host remembers.
    this.#applyVolume(muted || !isNumber(playerVolume) ? this.#volume : clamp(playerVolume, 0, 1), muted);
  }

  #applyMuted() {
    // `setMute` is deprecated. Unmuting to a level of `0` would leave the player muted, so it comes back at full volume.
    tryCall(() => this.#player?.setVolume(this.#muted ? 0 : this.#volume || 1));
  }

  #applyVolume(volume: number, muted: boolean) {
    if (volume === this.#volume && muted === this.#muted) return;

    this.#volume = volume;
    this.#muted = muted;
    this.dispatchEvent(new Event('volumechange'));
  }

  #applyPlaybackRate(rate: number) {
    if (rate <= 0 || rate === this.#playbackRate) return;

    this.#playbackRate = rate;
    this.dispatchEvent(new Event('ratechange'));
  }

  #applyDuration(duration: number | undefined) {
    if (!isNumber(duration) || !(duration > 0) || duration === this.#duration) return;

    this.#duration = duration;
    this.dispatchEvent(new Event('durationchange'));
  }

  #applyCurrentTime(time: number | undefined) {
    if (!isNumber(time) || time === this.#currentTime) return;

    this.#currentTime = time;
    this.dispatchEvent(new Event('timeupdate'));
  }

  #onPlay() {
    if (!this.#paused) return;

    this.#paused = false;
    this.#ended = false;
    this.dispatchEvent(new Event('play'));
  }

  #onPlaying() {
    this.#readyState = Math.max(this.#readyState, READY_STATE_HAVE_FUTURE_DATA);
    this.dispatchEvent(new Event('playing'));
  }

  #onPause() {
    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  // A seek made in the player's own chrome is announced here; one made through `currentTime` already was.
  #onSeeking() {
    if (this.#seeking) return;

    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
  }

  #onSeeked(time: number | undefined) {
    this.#applyCurrentTime(time);

    if (!this.#seeking) return;

    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  #onEnded() {
    // A looping media element never ends, and the player asked to loop restarts itself.
    if (this.#loop) return;

    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));
  }

  // The browser refused to start playback, as it does an unmuted autoplay. A media element would reject `play()`; the
  // SDK's `play()` has no answer to reject with, so the host reports the player as paused instead.
  #onPlaybackRejected(reason: string) {
    if (__DEV__) console.warn(`[vjs-dailymotion] The browser refused playback (${reason}).`);

    this.#onPause();
  }

  #onPlayerError({ playerError }: DailymotionPlayerState) {
    const error = new MediaError(
      playerError?.message || playerError?.title || 'The Dailymotion player reported an error.',
      MediaError.MEDIA_ERR_CUSTOM,
      true
    );

    error.data = { dailymotionErrorCode: playerError?.code };
    this.#error = error;
    this.dispatchEvent(new Event('error'));
    // Unblock callers awaiting load so play()/fullscreen don't hang.
    this.#loadComplete.resolve();
  }

  // The source could not become a player: either it is not a Dailymotion video, or no player configuration is named,
  // which Dailymotion refuses to embed without.
  #onSourceError() {
    const message = parseDailymotionSource(this.#src)
      ? 'Dailymotion embeds need a Player ID; set `engine.dailymotion.player`, or use a player embed URL as `src`.'
      : `Unrecognized Dailymotion source: ${this.#src}`;

    this.#error = new MediaError(message, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    this.dispatchEvent(new Event('error'));
  }

  // What the player options are built from. Only `loop` and the source reach `createPlayer`; the rest reaches the
  // player through the SDK once it is ready, or not at all.
  #snapshotProps(): Partial<DailymotionAdapterProps> {
    return {
      loop: this.#loop,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
    this.#isFullscreen = false;
  }
}

// Whether a new source can load into the player built for the current one: the same configuration and parameters,
// since those are only read when a player is created.
function isSameEmbed(current: DailymotionCreatePlayerOptions | null, next: DailymotionCreatePlayerOptions): boolean {
  if (!current) return false;

  const { video: _current, ...currentEmbed } = current;
  const { video: _next, ...nextEmbed } = next;

  return deepEqual(currentEmbed, nextEmbed);
}

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
