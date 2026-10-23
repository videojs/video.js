// Drives the Dailymotion Web SDK (https://developers.dailymotion.com/reference/web-sdk-player-methods). Mirrors
// `youtube-video`, which also loads its player API from a script.

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { tryCall } from '@videojs/utils/function';
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
 * configuration from Dailymotion Studio, so the source must name one: under `engine.dailymotion.player`, or as a player
 * embed URL (`geo.dailymotion.com/player/<player>.html?video=<id>`).
 *
 * The target is a container the SDK builds its player in. The SDK finds it by id from the document, so it must be in
 * the light DOM, not inside a shadow root.
 *
 * The configuration owns what the SDK can't change: its controls, and an `autostart` that `autoplay` can't turn off
 * (development builds warn when they disagree). The playback Dailymotion starts on a seek from its start or end screen
 * is paused before it is reported. `currentTime` and `duration` describe the video, while `paused` follows whatever is
 * on screen, ad or video. The SDK reports no buffered range, so `buffered` ends at the furthest point played.
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
  // Handed to `createPlayer`; the SDK swaps it for its own root and puts it back on `destroy()`.
  #placeholder: HTMLElement | null = null;
  #player: DailymotionPlayerApi | null = null;
  // What the current player was created with, so a new video can load into it instead of rebuilding.
  #options: DailymotionCreatePlayerOptions | null = null;
  #unbindEvents: (() => void) | null = null;
  // Lets a `load()` waiting out its microtask drop out once a newer load begins.
  #loadId = 0;
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

  // A new video was loaded into the running player; its `videochange` completes the load.
  #swapping = false;
  // A `play()` made before the player was ready.
  #playRequested = false;
  // Whether this load may still autoplay; a `pause()` before the player is ready withdraws it.
  #autoplayPending = false;
  // From a seek made while paused until it settles (see `#shouldStayPaused`).
  #stayPausedThroughSeek = false;
  // The furthest point played this load, which `buffered` ends at.
  #bufferedEnd = 0;
  // The player's position when the pending seek began, to tell whether it has landed.
  #seekFrom = 0;
  // Settles a seek the player never reports the end of.
  #seekTimer: ReturnType<typeof setTimeout> | undefined;
  // When `currentTime` is set before the player exists, the player is created at that position instead, through
  // Dailymotion's `startTime` runtime parameter, so no seek is sent for the player to drop. Until the first
  // `VIDEO_PLAYING`, the player still reports a position of 0, which is ignored while this is set. Applying the start
  // position on play reports as a seek, like any seek the player makes.
  #startPosition: number | null = null;

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

  /** The SDK's player object, or null until the player is ready. */
  get engine(): DailymotionPlayerApi | null {
    return this.#player;
  }

  get target(): HTMLElement | null {
    return this.#target;
  }

  /** Bind the container the SDK builds its player in; the player is created once `src` resolves. */
  attach(target: HTMLElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    // `attach()` loads the current source itself, so a `load()` still waiting drops out instead of loading it again.
    this.#loadId++;
    this.#createPlayer();
  }

  detach(): void {
    if (!this.#target) return;

    this.#destroyPlayer();
    this.#target = null;
    // A pending play must not start the next player.
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
  /** Dailymotion video URL. Setting it re-derives `source`, carrying its engine options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: DailymotionSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the one path for storing it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // Not the SDK iframe's URL, which keeps naming the first video after another is loaded into it.
    return this.#player ? this.#src : '';
  }

  get readyState() {
    return this.#readyState;
  }

  /**
   * Load the current source: into the running player when only the video changed, otherwise into a new player, since
   * the player configuration and runtime parameters are only read on creation.
   */
  async load() {
    if (!this.#target) return;

    const loadId = ++this.#loadId;

    // Wait a microtask so a framework's prop writes all land before the player is configured.
    await Promise.resolve();

    // A newer load took over, or the target went away.
    if (loadId !== this.#loadId || !this.#target) return;

    const options = resolveDailymotionPlayerOptions(this.#src, this.#snapshotProps());
    const player = this.#player;

    this.#resetState();
    // Announced before any early return, since no player report follows those.
    this.dispatchEvent(new Event('emptied'));

    if (player && options && isSameEmbed(this.#options, options)) {
      this.#options = options;
      this.#swapping = true;
      this.#autoplayPending = true;
      this.dispatchEvent(new Event('loadstart'));
      const startTime = options.params?.startTime;

      tryCall(() => player.loadContent({ video: options.video, ...(isNumber(startTime) && { startTime }) }));
      return;
    }

    this.#destroyPlayer();
    this.#createPlayer(options);
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

    this.#stopStayingPaused();

    if (!this.#player) {
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

    // A seek over a pending one keeps the position the player is still at.
    if (!this.#seeking) this.#seekFrom = this.#currentTime;

    this.#seeking = true;
    // As on a media element, seeking leaves the ended state.
    this.#ended = false;

    // Seeking from the start or end screen starts playback (see `#shouldStayPaused`).
    if (this.#paused) this.#stayPausedThroughSeek = true;

    // Report the target time now; the player's reports until it lands would drag it back.
    this.#currentTime = targetTime;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    // Without a player yet, `#syncToEmbed` sends it once ready.
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
    // The player's report of this change reads as unchanged, so the host announces it.
    this.dispatchEvent(new Event('volumechange'));

    // While muted the player holds `0`; the new level applies on unmute.
    if (!this.#muted) tryCall(() => this.#player?.setVolume(value));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));

    this.#applyMuted();
  }

  /**
   * Dailymotion plays at a fixed set of rates (`0.25` to `2` in quarter steps): it rounds any other rate up to the next
   * one, and caps it at `2`.
   */
  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.dispatchEvent(new Event('ratechange'));

    this.#setPlaybackSpeed();
  }

  /**
   * Starts playback on each load, through Dailymotion's `autoplay` parameter and a play sent once the player is ready.
   * It can't stop a player configuration whose Autostart is on.
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

    // Seeds `muted` until there is a player; `#syncToEmbed` then applies it.
    if (!this.#player) this.#muted = value;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;

    // A runtime parameter for the next player, and `setLoop` for the current one.
    this.#applyLoop();
  }

  /** Only the player configuration can hide Dailymotion's controls; `controls` decides whether the player takes input. */
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
    const end = Math.max(this.#bufferedEnd, this.#currentTime);

    return end > 0 ? createTimeRange(0, end) : EMPTY_TIME_RANGES;
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

  // A source that can't resolve reports why; `load()` retries once it changes.
  #createPlayer(options = resolveDailymotionPlayerOptions(this.#src, this.#snapshotProps())) {
    const target = this.#target;
    if (!target) return;

    if (!options) {
      if (this.#src) {
        this.dispatchEvent(new Event('loadstart'));
        this.#onSourceError();
      }

      return;
    }

    // The SDK can't find a container out of the page; a load once it is connected creates the player.
    if (!target.isConnected) return;

    // The SDK can't find a container inside a shadow root either, and would fail without saying why.
    if (target.getRootNode() !== globalThis.document) {
      this.dispatchEvent(new Event('loadstart'));
      this.#fail(
        new MediaError(
          'The Dailymotion player has to be in the document, not in a shadow root: the SDK looks it up by id.',
          MediaError.MEDIA_ERR_CUSTOM,
          true
        )
      );
      return;
    }

    // The SDK looks it up by id, so the id must be a valid selector.
    const placeholder = globalThis.document.createElement('div');

    placeholder.id = `videojs-dailymotion-${generateId()}`;
    target.append(placeholder);

    // A `currentTime` set before the player existed becomes its start position (see `#startPosition`).
    this.#startPosition = this.#seeking ? this.#currentTime : null;

    const createOptions =
      this.#startPosition === null
        ? options
        : { ...options, params: { ...options.params, startTime: this.#startPosition } };

    this.#placeholder = placeholder;
    this.#options = options;
    this.#autoplayPending = true;
    this.dispatchEvent(new Event('loadstart'));
    void this.#createPlayerApi(placeholder, createOptions);
  }

  async #createPlayerApi(placeholder: HTMLElement, options: DailymotionCreatePlayerOptions) {
    const attachId = this.#attachId;
    let api: DailymotionApi;
    let player: DailymotionPlayerApi | undefined;

    try {
      api = await loadDailymotionApi(options.player);
    } catch (cause) {
      // A newer attach must not be marked failed.
      if (this.#isStale(attachId)) return;

      this.#fail(new MediaError('Failed to load the Dailymotion Web SDK', MediaError.MEDIA_ERR_NETWORK), { cause });
      return;
    }

    if (this.#isStale(attachId)) return;

    try {
      player = await api.createPlayer(placeholder.id, options);
    } catch (cause) {
      if (this.#isStale(attachId)) return;

      this.#fail(
        new MediaError(
          `Dailymotion could not create the player: ${cause instanceof Error ? cause.message : String(cause)}`,
          MediaError.MEDIA_ERR_CUSTOM,
          true
        ),
        { cause }
      );
      return;
    }

    // Replaced while being created, so nothing owns this player.
    if (this.#isStale(attachId)) {
      tryCall(() => player?.destroy());
      placeholder.remove();
      return;
    }

    if (!player) {
      this.#fail(
        new MediaError(
          `Dailymotion could not create a player with Player ID ${options.player}. Check that it exists in Dailymotion Studio.`,
          MediaError.MEDIA_ERR_CUSTOM,
          true
        )
      );
      return;
    }

    this.#player = player;
    this.#unbindEvents = this.#bindPlayerEvents(api, player, attachId);
    // Fill the container instead of keeping the configuration's aspect ratio, as media elements in a skin do.
    // `updateParams` drops a `loop` it isn't given, so it's sent again here.
    tryCall(() => player.updateParams({ aspectRatio: 'inherit', loop: this.#loop }));
    this.#onReady();
  }

  // Whether an async SDK callback belongs to a player that has since been replaced.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  #bindPlayerEvents(api: DailymotionApi, player: DailymotionPlayerApi, attachId: number): () => void {
    const handlers: Record<string, (state: DailymotionPlayerState) => void> = {
      // An ad playing is on screen as much as the video is, so both start and stop playback.
      VIDEO_PLAY: () => this.#onPlay(),
      // An ad sends no `VIDEO_PLAYING`, so one that should stay paused is paused as it starts.
      AD_PLAY: () => (this.#shouldStayPaused() ? this.#pauseAgain() : this.#onPlay()),
      VIDEO_PAUSE: () => this.#onPause(),
      AD_PAUSE: () => this.#onPause(),
      VIDEO_PLAYING: () => this.#onPlaying(),
      PLAYER_CRITICALPATHREADY: (state) => {
        if (!state.playerError) this.#onCanPlay();
      },
      // Not for a play that is paused again (see `#shouldStayPaused`).
      VIDEO_BUFFERING: () => {
        if (!this.#shouldStayPaused()) this.dispatchEvent(new Event('waiting'));
      },
      // The `video*` members describe the video even while an ad plays.
      VIDEO_TIMECHANGE: (state) => {
        if (this.#shouldApplyReportedTime()) this.#applyCurrentTime(state.videoTime);
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

  // `destroy()` puts the placeholder back, so removing it leaves the container as the host rendered it.
  #destroyPlayer() {
    this.#attachId++;
    this.#unbindEvents?.();
    this.#unbindEvents = null;

    const player = this.#player;

    this.#player = null;
    this.#options = null;
    this.#swapping = false;
    clearTimeout(this.#seekTimer);

    if (player) tryCall(() => player.destroy());

    this.#placeholder?.remove();
    this.#placeholder = null;
  }

  #onReady() {
    this.#syncToEmbed();

    if (__DEV__) this.#warnOnAutostart();

    // The duration arrives with the state read below.
    this.#onLoaded();

    // The player answers in order, so this read includes what `#syncToEmbed` just applied.
    this.#readState((state) => this.#onPlayerState(state));
  }

  // Drops the answer if the player has been replaced since.
  #readState(apply: (state: DailymotionPlayerState) => void) {
    const player = this.#player;
    if (!player) return;

    const attachId = this.#attachId;

    player.getState().then(
      (state) => {
        if (!this.#isStale(attachId)) apply(state);
      },
      () => {}
    );
  }

  #warnOnAutostart() {
    if (this.#autoplay) return;

    const id = this.#options?.player;
    let autostart: string | undefined;

    // Diagnostic only: a player without the method must still load.
    try {
      autostart = this.#player?.getSettings()?.autostart;
    } catch {
      return;
    }

    if (!autostart || autostart === 'off' || !id || warnedAutostart.has(id)) return;

    warnedAutostart.add(id);
    console.warn(
      `[vjs-dailymotion] Player configuration ${id} starts playback itself (autostart: "${autostart}"), which \`autoplay\` cannot turn off. Turn Autostart off for it in Dailymotion Studio.`
    );
  }

  /**
   * Dailymotion starts playback on a seek from its start or end screen, which a paused media element doesn't. While
   * this is true, a play the player starts isn't reported and is paused again once it reaches `VIDEO_PLAYING`. Pausing
   * on `VIDEO_PLAY` leaves the player stuck on its loading screen; by `VIDEO_PLAYING` the video counts as started, so
   * the player also takes a seek it would otherwise drop.
   */
  #shouldStayPaused() {
    return this.#stayPausedThroughSeek;
  }

  /** Attempts to pause @see `#shouldStayPaused`. */
  #pauseAgain() {
    tryCall(() => this.#player?.pause());
  }

  /** A play the element asks for, or a new load, lets playback through (see `#shouldStayPaused`). */
  #stopStayingPaused() {
    this.#stayPausedThroughSeek = false;
  }

  // Apply what was asked for before the player was ready.
  #syncToEmbed() {
    if (this.#muted) this.#applyMuted();
    else if (this.#volume !== 1) tryCall(() => this.#player?.setVolume(this.#volume));

    if (this.#playbackRate !== 1) this.#setPlaybackSpeed();

    this.#applyLoop();

    // A seek asked for before the player was ready. One that became the start position is already applied.
    if (this.#seeking) {
      if (this.#startPosition === null) this.#seek(this.#currentTime);
      else this.#onSeeked(undefined);
    }

    this.#playIfRequested();
  }

  // The player sends no speed-change report for a commanded speed, so the rate it rounded to is read back.
  #setPlaybackSpeed() {
    tryCall(() => this.#player?.setPlaybackSpeed(this.#playbackRate));
    this.#readState((state) => {
      if (isNumber(state.playerPlaybackSpeed)) this.#applyPlaybackRate(state.playerPlaybackSpeed);
    });
  }

  #playIfRequested() {
    const play = this.#playRequested || (this.#autoplay && this.#autoplayPending);

    this.#playRequested = false;
    this.#autoplayPending = false;

    if (!play) return;

    this.#stopStayingPaused();
    tryCall(() => this.#player?.play());
  }

  // Recorded in `#options` too, so the next video can still load into this player.
  #applyLoop() {
    const player = this.#player;
    const options = this.#options;
    if (!player || !options || options.params?.loop === this.#loop) return;

    tryCall(() => player.setLoop(this.#loop));
    this.#options = { ...options, params: { ...options.params, loop: this.#loop } };
  }

  #onLoaded() {
    this.#readyState = READY_STATE_HAVE_METADATA;

    for (const type of ['loadedmetadata', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }
  }

  #seek(time: number) {
    const player = this.#player;
    if (!player) return;

    tryCall(() => player.seek(time));
    clearTimeout(this.#seekTimer);

    // Some seeks may be dropped by Dailymotion (for example, before the video first plays). This timer settles seeking
    // from the player's state.
    const timer = setTimeout(() => {
      if (!this.#seeking) return;

      this.#readState((state) => {
        if (timer === this.#seekTimer) this.#onSeeked(state.videoTime === this.#seekFrom ? undefined : state.videoTime);
      });
    }, SEEK_SETTLE_TIMEOUT);

    this.#seekTimer = timer;
  }

  // Completes a video loaded into the running player. A recommendation the player moves on to by itself reports the
  // same way, while `src` still names the loaded video; turning autonext off avoids that.
  #onVideoChange(state: DailymotionPlayerState) {
    if (this.#swapping) {
      this.#swapping = false;
      // Loading a video drops the `loop` the player had, so it's sent again.
      tryCall(() => this.#player?.setLoop(this.#loop));
      this.#onLoaded();
      this.#playIfRequested();
    }

    this.#onPlayerState(state);
  }

  // The configuration can start the player muted, playing, or late, so a read may differ from the defaults.
  #onPlayerState(state: DailymotionPlayerState) {
    this.#applyDuration(state.videoDuration);

    if (this.#shouldApplyReportedTime()) this.#applyCurrentTime(state.videoTime);

    if (isNumber(state.playerPlaybackSpeed)) this.#applyPlaybackRate(state.playerPlaybackSpeed);

    this.#onVolumeChange(state);

    if (state.playerIsCriticalPathReady === true && !state.playerError) this.#onCanPlay();

    if (state.playerIsPlaying === true) {
      if (this.#shouldStayPaused()) this.#pauseAgain();
      else this.#onPlay();
    }
  }

  #onVolumeChange({ playerVolume, playerIsMuted }: DailymotionPlayerState) {
    // `null` until the player has decided on a mute.
    const muted = isBoolean(playerIsMuted) ? playerIsMuted : this.#muted;

    // The player has no mute: muted, it reports `0`, so the level to restore is the host's.
    this.#applyVolume(muted || !isNumber(playerVolume) ? this.#volume : clamp(playerVolume, 0, 1), muted);
  }

  #applyMuted() {
    // `setMute` is deprecated. Unmuting to `0` would stay muted, so it restores full volume.
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

  // Whether the player's time reports move `currentTime`. Not while a seek is pending, or before the start position
  // plays (see `#startPosition`): until then the player reports where it was, not where it's going.
  #shouldApplyReportedTime() {
    return !this.#seeking && this.#startPosition === null;
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

  // A play that should stay paused isn't reported (see `#shouldStayPaused`).
  #onPlay() {
    if (this.#shouldStayPaused() || !this.#paused) return;

    this.#paused = false;
    this.#ended = false;
    this.dispatchEvent(new Event('play'));
  }

  #onPlaying() {
    // Playing from the start position, so the player's reports are accurate again.
    this.#startPosition = null;
    this.#onCanPlay();

    // Paused here rather than on `VIDEO_PLAY` (see `#shouldStayPaused`).
    if (this.#shouldStayPaused()) {
      this.#pauseAgain();
      return;
    }

    if (this.#paused) return;

    this.dispatchEvent(new Event('playing'));
  }

  // Once per load, after `loadedmetadata`: a report from before then belongs to the previous video.
  #onCanPlay() {
    if (this.#readyState < READY_STATE_HAVE_METADATA || this.#readyState >= READY_STATE_HAVE_FUTURE_DATA) return;

    this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
    this.dispatchEvent(new Event('canplay'));
  }

  #onPause() {
    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  // A seek in the player's own controls; one through `currentTime` was already announced.
  #onSeeking() {
    if (this.#seeking) return;

    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
  }

  #onSeeked(time: number | undefined) {
    this.#stayPausedThroughSeek = false;
    this.#applyCurrentTime(time);

    if (!this.#seeking) return;

    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  #onEnded() {
    // A looping media element never ends, and the player restarts itself. If it stopped anyway, its state says so.
    if (this.#loop) {
      this.#readState((state) => {
        if (!state.playerIsPlaying) this.#reportEnded();
      });
      return;
    }

    this.#reportEnded();
  }

  #reportEnded() {
    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));
  }

  // The SDK's `play()` returns nothing to reject, so a playback the browser refuses is reported as a pause.
  #onPlaybackRejected(reason: string) {
    if (__DEV__) console.warn(`[vjs-dailymotion] The browser refused playback (${reason}).`);

    this.#onPause();
  }

  #onPlayerError({ playerError }: DailymotionPlayerState) {
    this.#fail(
      new MediaError(
        playerError?.message || playerError?.title || 'The Dailymotion player reported an error.',
        MediaError.MEDIA_ERR_CUSTOM,
        true
      ),
      { dailymotionErrorCode: playerError?.code }
    );
  }

  // Not a Dailymotion video, or no Player ID, which Dailymotion refuses to embed without.
  #onSourceError() {
    const message = parseDailymotionSource(this.#src)
      ? 'Dailymotion embeds need a Player ID; set `engine.dailymotion.player`, or use a player embed URL as `src`.'
      : `Unrecognized Dailymotion source: ${this.#src}`;

    this.#fail(new MediaError(message, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED));
  }

  #fail(error: MediaError, data?: Record<string, unknown>) {
    if (data) error.data = data;

    this.#error = error;
    this.dispatchEvent(new Event('error'));
  }

  // The props `createPlayer` reads; the rest reach the player through the SDK once it is ready.
  #snapshotProps(): Partial<DailymotionAdapterProps> {
    return {
      autoplay: this.#autoplay,
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
    this.#startPosition = null;
    this.#bufferedEnd = 0;
    this.#stopStayingPaused();
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
    this.#isFullscreen = false;
  }
}

// Whether a new video can load into the current player: same configuration and parameters, which are only read on
// creation. `startTime` belongs to the video, and `loadContent` takes it.
function isSameEmbed(current: DailymotionCreatePlayerOptions | null, next: DailymotionCreatePlayerOptions): boolean {
  if (!current) return false;

  return deepEqual(embedOf(current), embedOf(next));
}

function embedOf({ video: _video, params, ...embed }: DailymotionCreatePlayerOptions) {
  const { startTime: _startTime, ...rest } = params ?? {};

  return { ...embed, params: rest };
}

// Configurations already warned about, so rebuilds don't repeat it.
const warnedAutostart = new Set<string>();

// How long to wait for a seek-end report before settling from the player's state.
const SEEK_SETTLE_TIMEOUT = 2_000;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
