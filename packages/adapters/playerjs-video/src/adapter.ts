// Speaks the player.js protocol (https://github.com/embedly/player.js/blob/master/SPEC.rst) directly rather than
// loading the reference client, shaped like the other embed adapters (mirrors `tiktok-video`). Behavior around
// reloads, remounts, and server-rendered frames follows the `gumlet-video-element` proposal in muxinc/media-elements.

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise, tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { deepEqual } from '@videojs/utils/object';
import { isBoolean, isNumber, isString, isUndefined } from '@videojs/utils/predicate';
import { generateId } from '@videojs/utils/string';

import {
  createPlayerJsCommand,
  ERROR_INVALID_METHOD,
  ERROR_METHOD_NOT_SUPPORTED,
  ERROR_NOT_SUPPORTED,
  isPlayerJsErrorValue,
  isPlayerJsReadyValue,
  isPlayerJsTimeValue,
  PLAYER_TARGET_ORIGIN,
  type PlayerJsCommandValue,
  type PlayerJsErrorValue,
  type PlayerJsEvent,
  type PlayerJsMethod,
  type PlayerJsReadyValue,
  type PlayerJsTimeValue,
  parsePlayerJsMessage,
  SPEC_EVENTS,
  SPEC_METHODS,
} from './player-api';
import type { PlayerJsAdapterProps } from './props';
import { buildPlayerJsIframeSrc, type PlayerJsSource } from './source';

/**
 * Plays any embed that implements the player.js receiver — Mux Player, Gumlet, FrameRate, Livid, Bunny Stream,
 * Streamable, and others — through one protocol rather than one adapter per service. Embeds implement the spec to
 * varying degrees, so every command is checked against the list the embed advertises with `ready`: a missing getter
 * leaves its value at the default (`NaN` for `duration`), and a missing setter leaves the value where the embed has
 * it.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class PlayerJsAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: PlayerJsAdapterProps = {
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

  static PLAYER_SOFTWARE_NAME = 'playerjs-video';

  #target: HTMLIFrameElement | null = null;
  #loadComplete = createPublicPromise<void>();
  // Cancels the `message` and frame `load` listeners; the first lives on `window`, so nothing removes it with the frame.
  #listeners: AbortController | null = null;
  // Guards messages across attach/detach cycles.
  #attachId = 0;

  #src = PlayerJsAdapter.defaultProps.src;
  #autoplay = PlayerJsAdapter.defaultProps.autoplay;
  #defaultMuted = PlayerJsAdapter.defaultProps.defaultMuted;
  #loop = PlayerJsAdapter.defaultProps.loop;
  #controls = PlayerJsAdapter.defaultProps.controls;
  #playsInline = PlayerJsAdapter.defaultProps.playsInline;
  #preload = PlayerJsAdapter.defaultProps.preload;
  #poster = PlayerJsAdapter.defaultProps.poster;
  #source: PlayerJsSource | null = PlayerJsAdapter.defaultProps.source;

  // Names this host's subscriptions and requests to the embed. Renewed per load, so the late reports of a document
  // the frame has navigated away from carry an id nothing answers to.
  #listenerId = createListenerId();
  #requestCount = 0;
  #requests = new Map<string, (value: unknown) => void>();
  #ready = false;
  #methods: ReadonlySet<string> = EMPTY_SET;
  #events: ReadonlySet<string> = EMPTY_SET;
  // A play asked for before the embed could take one, replayed once it reports ready.
  #playRequested = false;

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #bufferedEnd = 0;
  // Volume, mute, and rate survive a source change, as on a media element, and are asserted on each new embed.
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  /** The embed's window. player.js publishes no player object; commands are posted to the frame. Null until rendered. */
  get engine(): Window | null {
    return this.#target?.contentWindow ?? null;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe hosting the embed. The embed follows once a `src` resolves, which may be after attach. */
  attach(target: HTMLIFrameElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#listen(target);
    this.#beginLoad();
    this.#createPlayer();
  }

  detach(): void {
    if (!this.#target) return;

    this.#attachId++;
    this.#listeners?.abort();
    this.#listeners = null;
    this.#target = null;
    // Left set, the next frame to report ready would start playing on its own.
    this.#playRequested = false;
    // Unblock callers awaiting load; they re-check `#target` (now null) and no-op.
    this.#loadComplete.resolve();
    this.#resetState();
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  /**
   * Whether the embed advertises a player.js method or event, e.g. `supports('method', 'setCurrentTime')` for seeking.
   * Several names ask whether it supports all of them. Answered from the lists the embed sends with `ready`, so it
   * reads `false` until then; `loadcomplete` marks the moment it becomes meaningful.
   */
  supports(type: 'method' | 'event', name: string | readonly string[]): boolean {
    if (!this.#ready) return false;

    const supported = type === 'method' ? this.#methods : this.#events;

    return (isString(name) ? [name] : name).every((n) => supported.has(n));
  }

  get src() {
    return this.#src;
  }
  /** Embed URL. Setting it re-derives `source`, carrying its engine options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: PlayerJsSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the one path for storing it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // The `src` property resolves an empty attribute to the document URL, so only the attribute reports empty.
    return this.#target?.getAttribute('src') ?? '';
  }

  get readyState() {
    return this.#readyState;
  }

  /** Rebuild the embed for the current source; rewriting the iframe URL is the only load the protocol allows. */
  async load() {
    // Nothing to reload without a target, and no load to wait on either.
    if (!this.#target) return;

    const load = this.#beginLoad();

    // Wait a microtask so a framework's `src` and prop writes all land before the URL is built, once.
    await Promise.resolve();

    // A later load took over while waiting; building the embed is its job now.
    if (load !== this.#loadComplete) return;

    const target = this.#target;
    // Detached while waiting; `detach()` already settled this load.
    if (!target) return;

    const embedSrc = this.#src ? buildPlayerJsIframeSrc(this.#src, this.#snapshotProps()) : '';

    // Reloading the same embed would only discard its position; nothing is cleared, so no lifecycle event is due.
    if (embedSrc && target.getAttribute('src') === embedSrc) {
      // Still loading means a `ready` is coming to settle this load; already ready means none is.
      if (this.#ready) load.resolve();

      return;
    }

    this.#resetState();
    // `emptied` announces that reset before the bails below, where the embed reports nothing further.
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // Drop the URL too; a frame left in place keeps playing and keeps reporting.
      load.resolve();
      target.removeAttribute('src');
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    if (!embedSrc) {
      this.#error = new MediaError(
        `Unrecognized player.js embed URL: ${this.#src}`,
        MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
      );
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      load.resolve();
      // The last embed would otherwise keep playing a video the host no longer reports.
      target.removeAttribute('src');
      return;
    }

    // The new document reports `ready`, which is what settles this load.
    target.src = embedSrc;
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

    this.#post('play');
  }

  pause() {
    // A pause after a pending play is the later intent, so it cancels the replay rather than racing it.
    this.#playRequested = false;

    if (this.#ready) this.#post('pause');
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    // An embed that cannot seek keeps its position, and so does the host.
    if (this.#ready && !this.#methods.has('setCurrentTime')) return;

    this.#seeking = true;
    // Seeking away from the end leaves it, as on a media element; the embed's next report says otherwise if not.
    this.#ended = false;
    // Report the requested position now; the embed only reports one periodically, so the seek would look lost.
    this.#currentTime = value;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    // Before ready, `#onReady` sends the seek still pending.
    if (this.#ready) this.#seek(value);
  }

  get duration() {
    return this.#duration;
  }

  get volume() {
    return this.#volume;
  }
  set volume(value) {
    if (this.#volume === value) return;

    if (this.#ready && !this.#methods.has('setVolume')) return;

    this.#volume = value;
    // The spec has no volume event, so the host announces its own change rather than wait on one that may never come.
    this.dispatchEvent(new Event('volumechange'));

    if (this.#ready) this.#post('setVolume', toEmbedVolume(value));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    const method = value ? 'mute' : 'unmute';
    if (this.#ready && !this.#methods.has(method)) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));

    if (this.#ready) this.#post(method);
  }

  /** Reaches the embed only where it advertises `setPlaybackRate`, an extension to the spec. */
  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    if (this.#ready && !this.#methods.has('setPlaybackRate')) return;

    this.#playbackRate = value;
    this.dispatchEvent(new Event('ratechange'));

    if (this.#ready) this.#post('setPlaybackRate', value);
  }

  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    // Written to the URL for the services the host knows, and played over the protocol on ready for every service.
    this.#autoplay = value;
  }

  get defaultMuted() {
    return this.#defaultMuted;
  }
  set defaultMuted(value) {
    this.#defaultMuted = value;

    // Seed `muted` until the embed is up; `#onReady` asserts it over the protocol.
    if (!this.#ready) this.#muted = value;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;

    // An embed without `setLoop` is looped by replaying on `ended`.
    if (this.#ready && this.#methods.has('setLoop')) this.#post('setLoop', value);
  }

  get controls() {
    return this.#controls;
  }
  set controls(value) {
    // player.js has no say over an embed's chrome. For the services the host knows, the URL hides as much of it as
    // the service allows; for every service, `controls` decides whether the frame takes pointer input.
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

  /** Embed URL in `src`, extra URL parameters under `engine.playerJs`. Re-derives `src`; equal sources skip reload. */
  get source(): PlayerJsSource | null {
    return this.#source;
  }
  set source(value: PlayerJsSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // URL parameters are read when the embed is built, so a change needs its own reload even for the same embed.
    const engineChanged = !deepEqual(this.#source?.engine?.playerJs ?? null, source?.engine?.playerJs ?? null);

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
    return this.#duration > 0 && Number.isFinite(this.#duration) && this.#methods.has('setCurrentTime')
      ? createTimeRange(0, this.#duration)
      : EMPTY_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  /** Always empty: player.js has no text track surface. */
  get textTracks() {
    return EMPTY_TEXT_TRACKS;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  // The protocol has no fullscreen command, so fullscreen targets the iframe itself.
  async requestFullscreen() {
    // No element to request on means nothing entered fullscreen, so the flag must not claim otherwise.
    if (!this.#target?.requestFullscreen) return;

    await this.#target.requestFullscreen();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    const doc = globalThis.document;

    if (doc?.fullscreenElement && doc.fullscreenElement === this.#target) {
      await doc.exitFullscreen();
    }

    this.#isFullscreen = false;
  }

  // Build the embed for the attached target. A server-rendered target already holds a URL, so it is left alone and
  // its `ready` settles the load; a target that cannot resolve yet settles its load, and `load()` retries.
  #createPlayer() {
    const target = this.#target;
    if (!target) return;

    // The `src` property resolves an empty attribute to the document URL; only the attribute tells embed from empty.
    if (target.getAttribute('src')) {
      this.dispatchEvent(new Event('loadstart'));
      // The frame may have reported `ready` before anything listened; asking has a ready receiver repeat it.
      this.#requestReady();
      return;
    }

    const initialSrc = buildPlayerJsIframeSrc(this.#src, this.#snapshotProps());

    // No embed means no `ready` is coming to settle this load.
    if (!initialSrc) {
      this.#loadComplete.resolve();
      return;
    }

    target.src = initialSrc;
    this.dispatchEvent(new Event('loadstart'));
  }

  // Listen for what the embed reports; messages arrive on `window`, so each is matched against this host's frame.
  #listen(target: HTMLIFrameElement) {
    const win = globalThis.window;
    if (isUndefined(win)) return;

    const attachId = this.#attachId;

    this.#listeners = new AbortController();

    const { signal } = this.#listeners;

    win.addEventListener('message', (event) => this.#onMessage(event, target, attachId), { signal });
    // Each document the frame loads is a new receiver, which may be ready before its broadcast could be heard.
    target.addEventListener('load', () => this.#requestReady(), { signal });
  }

  #onMessage(event: MessageEvent, target: HTMLIFrameElement, attachId: number) {
    // A dispatch in flight still reaches a listener removed mid-way.
    if (attachId !== this.#attachId) return;

    // A frame that is gone cannot have sent anything, so an absent window must not match.
    const frame = target.contentWindow;
    if (!frame || event.source !== frame) return;

    const message = parsePlayerJsMessage(event.data);
    if (!message) return;

    const { event: type, listener, value } = message;

    // `ready` is broadcast when nothing has subscribed to it, so it is the one message taken unaddressed.
    if (type === 'ready') {
      this.#onReady(isPlayerJsReadyValue(value) ? value : {});
      return;
    }

    // A getter answers as an event named after the method, under the listener it was asked with.
    const answer = isUndefined(listener) ? undefined : this.#requests.get(listener);

    if (answer) {
      this.#requests.delete(listener as string);
      answer(value);
      return;
    }

    // Events arrive once subscribed, under this load's listener. One addressed to anyone else is another client's
    // (or an outgoing document's); one addressed to no one is taken, since not every receiver echoes the listener.
    if (!this.#ready || (!isUndefined(listener) && listener !== this.#listenerId)) return;

    switch (type as PlayerJsEvent) {
      case 'play':
        this.#onPlay();
        break;
      case 'pause':
        this.#onPause();
        break;
      case 'ended':
        this.#onEnded();
        break;
      case 'timeupdate':
        if (isPlayerJsTimeValue(value)) this.#onTimeUpdate(value);

        break;
      case 'progress':
        if (isPlayerJsTimeValue(value)) this.#onProgress(value);

        break;
      case 'seeked':
        // Receivers report the landing position bare or the way `timeupdate` does.
        this.#onSeeked(isNumber(value) ? value : isPlayerJsTimeValue(value) ? value.seconds : undefined);
        break;
      case 'error':
        this.#onPlayerError(isPlayerJsErrorValue(value) ? value : {});
        break;
      // Neither event is in the spec, so receivers disagree on the casing.
      case 'volumeChange':
      case 'volumechange':
        // The payload is not standardized, so the embed is asked rather than read.
        this.#syncVolume();
        break;
      case 'playbackRateChange':
      case 'playbackratechange':
        this.#get('getPlaybackRate', isNumber).then((rate) => this.#applyPlaybackRate(rate));
        break;
    }
  }

  #onReady({ methods, events }: PlayerJsReadyValue) {
    // Repeats are expected: a receiver both broadcasts `ready` and answers the host's request for it.
    if (this.#ready || !this.#target?.getAttribute('src')) return;

    this.#ready = true;
    // An embed that lists nothing is taken at the spec's word, and no further.
    this.#methods = new Set(Array.isArray(methods) ? methods : SPEC_METHODS);
    this.#events = new Set(Array.isArray(events) ? events : SPEC_EVENTS);
    this.#readyState = READY_STATE_HAVE_METADATA;

    for (const type of SUBSCRIBED_EVENTS) {
      if (this.#events.has(type)) this.#post('addEventListener', type, this.#listenerId);
    }

    this.#syncToEmbed();

    // Duration arrives with the first answer or progress report, which dispatches its own `durationchange`.
    for (const type of ['loadedmetadata', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();
    this.#syncFromEmbed();
  }

  // Assert what the host was asked for before the embed was up. Whatever the embed cannot take falls back to the
  // default, so the host never reports a value the embed never had.
  #syncToEmbed() {
    if (this.#muted && !this.#call('mute')) {
      this.#muted = false;
      this.dispatchEvent(new Event('volumechange'));
    }

    if (this.#volume !== 1 && !this.#call('setVolume', toEmbedVolume(this.#volume))) {
      this.#volume = 1;
      this.dispatchEvent(new Event('volumechange'));
    }

    if (this.#playbackRate !== 1 && !this.#call('setPlaybackRate', this.#playbackRate)) {
      this.#playbackRate = 1;
      this.dispatchEvent(new Event('ratechange'));
    }

    // Asserted either way: an embed can default to looping (Gumlet's do), and the host's `loop` is the intent.
    this.#call('setLoop', this.#loop);

    if (this.#seeking) this.#seek(this.#currentTime);

    if (this.#autoplay || this.#playRequested) {
      this.#playRequested = false;
      this.#post('play');
    }
  }

  // Read the embed's state, which may already differ from the defaults: a URL can start it muted, playing, or late.
  // Asked after `#syncToEmbed`, and receivers answer in order, so the answers include what the host just asserted.
  #syncFromEmbed() {
    this.#get('getDuration', isNumber).then((duration) => this.#applyDuration(duration));
    this.#get('getPaused', isBoolean).then((paused) => {
      if (paused === false) this.#onPlay();
    });
    this.#get('getCurrentTime', isNumber).then((time) => {
      if (isUndefined(time) || this.#seeking || time === this.#currentTime) return;

      this.#currentTime = time;
      this.dispatchEvent(new Event('timeupdate'));
    });
    this.#syncVolume();
    this.#get('getPlaybackRate', isNumber).then((rate) => this.#applyPlaybackRate(rate));
  }

  #syncVolume() {
    this.#get('getVolume', isNumber).then((volume) => {
      if (!isUndefined(volume)) this.#applyVolume(fromEmbedVolume(volume), this.#muted);
    });
    this.#get('getMuted', isBoolean).then((muted) => {
      if (!isUndefined(muted)) this.#applyVolume(this.#volume, muted);
    });
  }

  #applyVolume(volume: number, muted: boolean) {
    if (volume === this.#volume && muted === this.#muted) return;

    this.#volume = volume;
    this.#muted = muted;
    this.dispatchEvent(new Event('volumechange'));
  }

  #applyPlaybackRate(rate: number | undefined) {
    if (isUndefined(rate) || rate <= 0 || rate === this.#playbackRate) return;

    this.#playbackRate = rate;
    this.dispatchEvent(new Event('ratechange'));
  }

  #applyDuration(duration: number | undefined) {
    if (!isNumber(duration) || !(duration > 0) || duration === this.#duration) return;

    this.#duration = duration;
    this.dispatchEvent(new Event('durationchange'));
  }

  #seek(time: number) {
    if (!this.#call('setCurrentTime', time)) {
      // Only reachable for a seek made before `ready` revealed the embed cannot take one.
      this.#currentTime = 0;
      this.#settleSeek();
      return;
    }

    // Its own report settles the seek where the embed has one.
    if (this.#events.has('seeked')) return;

    // Otherwise the next position report does, and a paused embed sends none. Receivers answer in order, so any
    // answer — even from an embed without `getCurrentTime`, which resolves at once — means the seek was taken.
    this.#get('getCurrentTime', isNumber).then(() => this.#settleSeek());
  }

  #settleSeek() {
    if (!this.#seeking) return;

    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  #onPlay() {
    if (!this.#paused) return;

    this.#paused = false;
    this.#ended = false;
    this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
    this.dispatchEvent(new Event('play'));
    // player.js reports no buffering, so a started embed counts as playing.
    this.dispatchEvent(new Event('playing'));
  }

  #onPause() {
    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  #onEnded() {
    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));

    // An embed that took `setLoop` restarts itself; one without it is restarted here.
    if (this.#loop && !this.#methods.has('setLoop')) {
      this.#call('setCurrentTime', 0);
      this.#post('play');
    }
  }

  #onTimeUpdate({ seconds, duration }: PlayerJsTimeValue) {
    this.#applyDuration(duration);

    // With a `seeked` report coming, positions from before the seek landed would drag the slider back.
    if (this.#seeking && this.#events.has('seeked')) return;

    if (isNumber(seconds) && seconds !== this.#currentTime) {
      this.#currentTime = seconds;
      this.dispatchEvent(new Event('timeupdate'));
    }

    // Without a seek report, the next position is the only sign one landed.
    this.#settleSeek();
  }

  #onProgress({ seconds, duration, percent }: PlayerJsTimeValue) {
    this.#applyDuration(duration);

    // The spec reports buffered seconds; some receivers (Gumlet's) report a 0-100 percentage of the duration instead.
    const end = isNumber(percent) && Number.isFinite(this.#duration) ? (percent / 100) * this.#duration : seconds;

    if (isNumber(end) && end > this.#bufferedEnd) {
      this.#bufferedEnd = end;
      this.dispatchEvent(new Event('progress'));
    }
  }

  #onSeeked(seconds: number | undefined) {
    if (isNumber(seconds) && seconds !== this.#currentTime) {
      this.#currentTime = seconds;
      this.dispatchEvent(new Event('timeupdate'));
    }

    this.#settleSeek();
  }

  #onPlayerError({ code, msg }: PlayerJsErrorValue) {
    // A command the embed doesn't take says nothing about the media, so it must not put an error over working playback.
    if (code === ERROR_INVALID_METHOD || code === ERROR_METHOD_NOT_SUPPORTED) {
      if (__DEV__) console.warn(`The player.js embed rejected a command: ${msg || `error ${code}`}`);

      return;
    }

    this.#error =
      code === ERROR_NOT_SUPPORTED
        ? new MediaError(msg || undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
        : new MediaError(msg || 'The embedded player reported an error.', MediaError.MEDIA_ERR_CUSTOM, true);
    this.dispatchEvent(new Event('error'));
    // Unblock callers awaiting load so play()/fullscreen don't hang.
    this.#loadComplete.resolve();
  }

  // Send a command the embed advertises; false when it doesn't, so the caller can fall back.
  #call(method: PlayerJsMethod, value?: PlayerJsCommandValue): boolean {
    if (!this.#methods.has(method)) return false;

    this.#post(method, value);
    return true;
  }

  // Ask the embed a getter, keeping its answer only if it has the expected type. Resolves `undefined` at once for a
  // getter the embed lacks, and never for a load replaced before it answers: the reset drops the request, so no
  // stale answer lands on the next embed.
  #get<T>(method: PlayerJsMethod, is: (value: unknown) => value is T): Promise<T | undefined> {
    if (!this.#methods.has(method)) return Promise.resolve(undefined);

    const listener = `${this.#listenerId}:${++this.#requestCount}`;

    return new Promise((resolve) => {
      this.#requests.set(listener, (value) => resolve(is(value) ? value : undefined));
      this.#post(method, undefined, listener);
    });
  }

  #requestReady() {
    this.#post('addEventListener', 'ready', this.#listenerId);
  }

  // Posting to a frame being torn down throws and is swallowed.
  #post(method: PlayerJsMethod, value?: PlayerJsCommandValue, listener?: string) {
    const frame = this.#target?.contentWindow;
    if (!frame) return;

    tryCall(() => frame.postMessage(createPlayerJsCommand(method, value, listener), PLAYER_TARGET_ORIGIN));
  }

  // What the embed URL is built from. Known services read these from the URL, which is only read at load, so a later
  // change reaches the embed over the protocol (autoplay, mute, loop) or not at all (controls, preload) until the next
  // source; rebuilding the frame for it would restart the video.
  #snapshotProps(): Partial<PlayerJsAdapterProps> {
    return {
      autoplay: this.#autoplay,
      // Either says to start muted, and the URL is read once, so a mute set since the last load carries over.
      defaultMuted: this.#defaultMuted || this.#muted,
      loop: this.#loop,
      controls: this.#controls,
      preload: this.#preload,
      source: this.#source,
    };
  }

  #resetState() {
    this.#listenerId = createListenerId();
    this.#requests.clear();
    this.#ready = false;
    this.#methods = EMPTY_SET;
    this.#events = EMPTY_SET;
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#bufferedEnd = 0;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
    this.#isFullscreen = false;
  }
}

/** The events the host subscribes to, where the embed advertises them. `ready` needs no subscription. */
const SUBSCRIBED_EVENTS: readonly PlayerJsEvent[] = [
  'play',
  'pause',
  'ended',
  'timeupdate',
  'progress',
  'seeked',
  'error',
  'volumeChange',
  'playbackRateChange',
  'volumechange',
  'playbackratechange',
];

const EMPTY_SET: ReadonlySet<string> = new Set();

function createListenerId() {
  return `videojs-${generateId()}`;
}

// player.js volumes run 0-100.
function toEmbedVolume(volume: number) {
  return Math.round(volume * 100);
}

function fromEmbedVolume(volume: number) {
  return clamp(volume / 100, 0, 1);
}

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
