// Speaks the SoundCloud Widget protocol directly rather than loading `api.js`, shaped like the other iframe adapters
// (mirrors `playerjs-video`).

import { EMPTY_TEXT_TRACKS, MediaError, type TimeRangeLike, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { deepEqual } from '@videojs/utils/object';
import { isNumber, isObject, isString, isUndefined } from '@videojs/utils/predicate';

import type { SoundCloudAdapterProps } from './props';
import {
  buildSoundCloudWidgetUrl,
  type ParsedSoundCloudSource,
  parseSoundCloudSource,
  resolveSoundCloudShortLink,
  type SoundCloudSource,
  wantsSoundCloudAutoplay,
} from './source';
import {
  createSoundCloudCommand,
  isSoundCloudProgress,
  loadedShareOf,
  parseSoundCloudMessage,
  type SoundCloudProgress,
  type SoundCloudWidgetCommand,
  type SoundCloudWidgetEvent,
  type SoundCloudWidgetGetter,
  WIDGET_ORIGIN,
} from './widget-api';

/**
 * Plays SoundCloud tracks and sets through the SoundCloud Widget. A set plays as one source: moving to another track
 * reports a new `duration` and restarts `currentTime`, and `ended` fires once the last track ends. The widget stays
 * visible and takes input, since it is what credits the uploader and SoundCloud; what it does is reported like anything
 * the host asked for.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class SoundCloudAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: SoundCloudAdapterProps = {
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

  static PLAYER_SOFTWARE_NAME = 'soundcloud-audio';

  #target: HTMLIFrameElement | null = null;
  // Cancels the `message` and frame `load` listeners; the first lives on `window`, so nothing removes it with the frame.
  #listeners: AbortController | null = null;
  // Guards messages and short link resolutions across attach/detach cycles.
  #attachId = 0;
  // Lets a `load()` waiting out its microtask, or a short link, drop out once a newer load begins.
  #loadId = 0;
  // An iframe URL rendered before the host had a source, which the first load keeps instead of reloading.
  #adoptedSrc: string | null = null;

  #src = SoundCloudAdapter.defaultProps.src;
  #autoplay = SoundCloudAdapter.defaultProps.autoplay;
  #defaultMuted = SoundCloudAdapter.defaultProps.defaultMuted;
  #loop = SoundCloudAdapter.defaultProps.loop;
  #controls = SoundCloudAdapter.defaultProps.controls;
  #playsInline = SoundCloudAdapter.defaultProps.playsInline;
  #preload = SoundCloudAdapter.defaultProps.preload;
  #poster = SoundCloudAdapter.defaultProps.poster;
  #source: SoundCloudSource | null = SoundCloudAdapter.defaultProps.source;

  #parsed: ParsedSoundCloudSource | null = null;
  // Whether the frame has loaded the document last pointed at; until then, a getter answer may be the outgoing one's.
  #frameLoaded = true;
  #widgetId: string | null = null;
  // When the frame was last pointed at a widget; a document created before then is one the host moved away from.
  #navigatedAt = 0;
  // The document last replaced, for a widget id that carries no creation time.
  #staleWidgetId: string | null = null;
  #ready = false;
  #requests = new Map<SoundCloudWidgetGetter, ((value: unknown) => void)[]>();
  #playRequested = false;
  #autoplayPending = false;
  #startTime: number | null = null;
  #soundIds: readonly number[] = [];
  #soundId: number | null = null;
  // The widget rewinds to the start once the last track ends; the media keeps reporting the end until it plays again.
  #finished = false;
  // Playback was reported, but the position has not moved yet.
  #awaitingProgress = false;
  #playFrom = 0;
  #reportedTime = 0;
  #endTimer: ReturnType<typeof setTimeout> | undefined;
  #durationTimer: ReturnType<typeof setTimeout> | undefined;
  #seekTimer: ReturnType<typeof setTimeout> | undefined;

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #bufferedStart = 0;
  #bufferedEnd = 0;
  // Volume and mute survive a source change, as on a media element, and are asserted on each new widget.
  #volume = 1;
  #muted = false;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;

  /** The widget's window, which commands are posted to. Null until rendered. */
  get engine(): Window | null {
    return this.#target?.contentWindow ?? null;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe hosting the widget. The widget follows once a `src` resolves, which may be after attach. */
  attach(target: HTMLIFrameElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#listen(target);
    this.#createPlayer(target);
  }

  detach(): void {
    if (!this.#target) return;

    this.#attachId++;
    this.#loadId++;
    this.#listeners?.abort();
    this.#listeners = null;
    this.#target = null;
    this.#adoptedSrc = null;
    this.#playRequested = false;
    this.#resetState();
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  get src() {
    return this.#src;
  }
  /** SoundCloud URL. Setting it re-derives `source`, carrying its engine options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: SoundCloudSource = { ...(engine && { engine }), ...(value && { src: value }) };

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

  /** Point the widget at the current source; rewriting the iframe URL is the only load the widget takes parameters on. */
  async load() {
    if (!this.#target) return;

    const loadId = ++this.#loadId;

    // Wait a microtask so a framework's `src` and prop writes all land before the URL is built, once.
    await Promise.resolve();

    const target = this.#target;
    if (loadId !== this.#loadId || !target) return;

    const adopted = this.#adoptedSrc;

    this.#adoptedSrc = null;

    // A widget rendered from the same source before the host had one is this load already.
    if (adopted && adopted === this.#buildWidgetUrl() && this.#hasReferrerPolicy(target)) {
      this.#parsed = parseSoundCloudSource(this.#src);
      this.#startTime = this.#parsed?.startTime ?? null;
      this.#autoplayPending = true;
      return;
    }

    this.#resetState();
    // `emptied` announces that reset before the bails below, where the widget reports nothing further.
    this.dispatchEvent(new Event('emptied'));
    this.#loadWidget(target, loadId);
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
    if (!this.#src || this.#error) return;

    if (!this.#ready) {
      this.#playRequested = true;
      return;
    }

    // A finished set stays on its last track; a media element plays from the start.
    if (this.#ended && this.#soundIds.length > 1 && this.#soundId !== this.#soundIds[0]) this.#post('skip', 0);
    else this.#post('play');
  }

  pause() {
    this.#playRequested = false;
    this.#autoplayPending = false;

    if (this.#ready) this.#post('pause');
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    const time = this.#clampTime(value);

    // With no source, or one that failed to load, no widget will ever report the seek landing.
    if (!this.#ready && (!this.#src || this.#error)) {
      this.#currentTime = time;
      return;
    }

    if (time === this.#currentTime && !this.#ended) return;

    this.#finished = false;
    this.#ended = false;
    this.#seeking = true;
    // Report the target now; the widget's reports until it lands would drag it back.
    this.#currentTime = time;
    this.#reportedTime = time;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    // Before ready, `#syncToWidget` sends the seek still pending.
    if (this.#ready) this.#seek(time);
  }

  get duration() {
    return this.#duration;
  }

  get volume() {
    return this.#volume;
  }
  set volume(value) {
    const volume = clamp(value, 0, 1);
    if (volume === this.#volume) return;

    this.#volume = volume;
    // The widget reports no volume changes, so the host announces its own.
    this.dispatchEvent(new Event('volumechange'));

    // While muted the widget holds `0`; the new level applies on unmute.
    if (!this.#muted) this.#applyVolume();
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));
    this.#applyVolume();
  }

  /** Starts playback once the widget is ready, after the volume and start position apply. Browsers may refuse it. */
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

    // Seeds `muted` until the widget is up; `#syncToWidget` then applies it.
    if (!this.#ready) this.#muted = value;
  }

  /** Replays the track, or a set from its first track, when the last one ends. */
  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;
  }

  /** The widget always shows its own player, so this has no effect. */
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

  /** SoundCloud URL in `src`, widget parameters under `engine.soundcloud`. Replacing it re-derives `src`. */
  get source(): SoundCloudSource | null {
    return this.#source;
  }
  set source(value: SoundCloudSource | null) {
    const source = value ?? null;
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Widget parameters are read when the widget is built, so a change needs its own reload even for the same source.
    const engineChanged = !deepEqual(this.#source?.engine?.soundcloud ?? null, source?.engine?.soundcloud ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    this.dispatchEvent(new Event('sourcechange'));
  }

  /** The stretch the widget reports loaded, from where playback last started or landed. */
  get buffered() {
    return this.#bufferedEnd > this.#bufferedStart
      ? createTimeRange(this.#bufferedStart, this.#bufferedEnd)
      : NO_TIME_RANGES;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration) ? createTimeRange(0, this.#duration) : NO_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  /** Always empty: SoundCloud has no captions or other text tracks. */
  get textTracks() {
    return EMPTY_TEXT_TRACKS;
  }

  // Playback rate, picture-in-picture, and fullscreen are left out on purpose: the widget offers none of them, and a
  // member that cannot reach the player would read as a capability it has.

  // A rendered frame is kept and its `ready` settles the load; an empty one is pointed at the current source.
  #createPlayer(target: HTMLIFrameElement) {
    const rendered = target.getAttribute('src');

    if (!rendered) {
      if (this.#src) this.#loadWidget(target, ++this.#loadId);

      return;
    }

    // A widget that loaded before anything listened has already broadcast its `ready`.
    this.#frameLoaded = hasWidgetDocument(target);
    this.#navigatedAt = 0;
    this.#staleWidgetId = null;
    this.dispatchEvent(new Event('loadstart'));
    this.#probeReady();
    this.#adoptedSrc = rendered;

    if (this.#src) void this.load();
  }

  #loadWidget(target: HTMLIFrameElement, loadId: number) {
    const parsed = parseSoundCloudSource(this.#src);

    this.#parsed = parsed;
    this.#startTime = parsed?.startTime ?? null;

    if (!this.#src) {
      // Left in place, the widget would keep playing a source the host no longer tracks.
      target.removeAttribute('src');
      return;
    }

    this.#autoplayPending = true;
    this.dispatchEvent(new Event('loadstart'));

    if (!parsed) {
      target.removeAttribute('src');
      this.#fail(
        new MediaError(`Unrecognized SoundCloud source: ${this.#src}`, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
      );
      return;
    }

    if (parsed.kind !== 'short-link') {
      this.#navigate(target, buildSoundCloudWidgetUrl(parsed.url, parsed, this.#snapshotProps()));
      return;
    }

    target.removeAttribute('src');

    const attachId = this.#attachId;

    resolveSoundCloudShortLink(parsed.url).then(
      (resolved) => {
        if (attachId !== this.#attachId || loadId !== this.#loadId) return;

        if (!resolved) {
          this.#fail(
            new MediaError(
              `SoundCloud does not know the short link ${parsed.url}`,
              MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
            )
          );
          return;
        }

        this.#navigate(target, buildSoundCloudWidgetUrl(resolved, parsed, this.#snapshotProps()));
      },
      () => {
        if (attachId !== this.#attachId || loadId !== this.#loadId) return;

        this.#fail(
          new MediaError(`Could not resolve the SoundCloud short link ${parsed.url}`, MediaError.MEDIA_ERR_NETWORK)
        );
      }
    );
  }

  #navigate(target: HTMLIFrameElement, url: string) {
    const referrerPolicy = this.#source?.engine?.soundcloud?.referrerPolicy;

    // A frame sends the policy it has when it navigates, so it goes on first.
    if (referrerPolicy !== undefined) target.referrerPolicy = referrerPolicy;

    this.#frameLoaded = false;
    this.#navigatedAt = Date.now();
    target.src = url;
  }

  #hasReferrerPolicy(target: HTMLIFrameElement): boolean {
    const referrerPolicy = this.#source?.engine?.soundcloud?.referrerPolicy;

    return referrerPolicy === undefined || target.referrerPolicy === referrerPolicy;
  }

  #buildWidgetUrl(): string {
    const parsed = parseSoundCloudSource(this.#src);
    if (!parsed || parsed.kind === 'short-link') return '';

    return buildSoundCloudWidgetUrl(parsed.url, parsed, this.#snapshotProps());
  }

  #listen(target: HTMLIFrameElement) {
    const win = globalThis.window;
    if (isUndefined(win)) return;

    const attachId = this.#attachId;

    this.#listeners = new AbortController();

    const { signal } = this.#listeners;

    win.addEventListener('message', (event) => this.#onMessage(event, target, attachId), { signal });
    target.addEventListener(
      'load',
      () => {
        this.#frameLoaded = hasWidgetDocument(target);

        if (!this.#ready) this.#probeReady();
      },
      { signal }
    );
  }

  #onMessage(event: MessageEvent, target: HTMLIFrameElement, attachId: number) {
    if (attachId !== this.#attachId || event.origin !== WIDGET_ORIGIN) return;

    const frame = target.contentWindow;
    if (!frame || event.source !== frame) return;

    const message = parseSoundCloudMessage(event.data);
    if (!message) return;

    const { method, value, widgetId = null } = message;

    if (!this.#ready) {
      // The widget broadcasts `ready` once per document; a frame that loaded before anything listened answers the
      // probe instead.
      const isReady = method === 'ready' || (method === READY_PROBE && this.#frameLoaded);

      if (isReady && this.#isCurrentDocument(widgetId)) this.#onReady(widgetId);

      return;
    }

    if (method === 'ready' && widgetId !== this.#widgetId && this.#isCurrentDocument(widgetId)) {
      this.#onFrameReloaded(widgetId);
      return;
    }

    if (widgetId !== this.#widgetId) return;

    const answer = this.#requests.get(method as SoundCloudWidgetGetter)?.shift();

    if (answer) {
      answer(value);
      return;
    }

    switch (method as SoundCloudWidgetEvent) {
      case 'play':
        if (isSoundCloudProgress(value)) this.#onWidgetPlay(value);

        break;
      case 'pause':
        if (isSoundCloudProgress(value)) this.#onWidgetPause(value);

        break;
      case 'finish':
        if (isSoundCloudProgress(value)) this.#onWidgetFinish(value);

        break;
      case 'seek':
        if (isSoundCloudProgress(value)) this.#onWidgetSeek(value);

        break;
      case 'playProgress':
        if (isSoundCloudProgress(value)) this.#onWidgetProgress(value);

        break;
      case 'loadProgress':
        if (isSoundCloudProgress(value)) this.#syncBuffered(value);

        break;
      case 'error':
        this.#onWidgetError();
        break;
    }
  }

  #onReady(widgetId: string | null) {
    this.#ready = true;
    this.#widgetId = widgetId;

    for (const type of SUBSCRIBED_EVENTS) this.#post('addEventListener', type);

    // Answers come in order, after the error the widget replays to a new `error` listener when it has one to show.
    this.#get('getSounds').then((sounds) => {
      this.#soundIds = Array.isArray(sounds) ? sounds.map(soundIdOf).filter(isNumber) : [];
    });
    this.#get('getCurrentSound').then((sound) => {
      this.#soundId = soundIdOf(sound) ?? null;
    });
    this.#get('getDuration').then((duration) => this.#onLoaded(duration));
  }

  // The frame loaded a new widget without the host pointing it anywhere, as moving an iframe in the DOM does. The new
  // widget starts over, so the media does too.
  #onFrameReloaded(widgetId: string | null) {
    this.#resetState();
    this.#startTime = this.#parsed?.startTime ?? null;
    this.dispatchEvent(new Event('emptied'));
    this.dispatchEvent(new Event('loadstart'));
    this.#onReady(widgetId);
  }

  #onLoaded(duration: unknown, attempt = 1) {
    if (this.#error) return;

    if (!isNumber(duration) || !(duration > 0)) {
      // A set opened on a later track (`start_track`) answers `null` until that track loads; a sound the widget cannot
      // play reports `error` instead, which ends the wait. So a wait that runs out is a slow load, not a bad sound.
      if (attempt >= DURATION_ATTEMPTS) {
        this.#fail(
          new MediaError('The SoundCloud widget did not finish loading in time.', MediaError.MEDIA_ERR_NETWORK)
        );
        return;
      }

      const widgetId = this.#widgetId;

      this.#durationTimer = setTimeout(() => {
        if (this.#ready && this.#widgetId === widgetId) {
          this.#get('getDuration').then((next) => this.#onLoaded(next, attempt + 1));
        }
      }, DURATION_RETRY_INTERVAL);
      return;
    }

    this.#applyDuration(duration / 1000);
    this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;

    for (const type of ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#syncToWidget();

    // A widget rendered before the host listened may already be playing.
    this.#get('isPaused').then((paused) => {
      if (paused === false && this.#paused) this.#onWidgetPlay({ currentPosition: this.#currentTime * 1000 });
    });
  }

  // Apply what was asked for before the widget was ready. The volume goes first, so a muted autoplay starts muted.
  #syncToWidget() {
    this.#applyVolume();

    if (this.#seeking) {
      this.#currentTime = this.#clampTime(this.#currentTime);
      this.#seek(this.#currentTime);
    } else if (isNumber(this.#startTime) && this.#startTime > 0) this.currentTime = this.#startTime;

    const autoplay = this.#autoplayPending && (this.#autoplay || wantsSoundCloudAutoplay(this.#parsed, this.#source));

    if (this.#playRequested || autoplay) this.#post('play');

    this.#playRequested = false;
    this.#autoplayPending = false;
  }

  #onWidgetPlay(progress: SoundCloudProgress) {
    this.#syncSound(progress);
    this.#finished = false;
    clearTimeout(this.#endTimer);

    if (!this.#paused) return;

    const position = (progress.currentPosition ?? 0) / 1000;
    const loaded = (loadedShareOf(progress) ?? 0) * this.#duration;

    this.#paused = false;
    this.#ended = false;
    this.dispatchEvent(new Event('play'));

    if (loaded > position + STARVED_MARGIN) {
      this.dispatchEvent(new Event('playing'));
      return;
    }

    // Nothing ahead of the position is loaded yet; the position moving says it is.
    this.#awaitingProgress = true;
    this.#playFrom = position;
    this.#readyState = READY_STATE_HAVE_CURRENT_DATA;
    this.dispatchEvent(new Event('waiting'));
  }

  #onWidgetPause(progress: SoundCloudProgress) {
    this.#syncSound(progress);

    // The widget pauses at the end of every track; whether that is the end of playback is for `finish` to say.
    if (this.#isAtEnd(progress)) {
      clearTimeout(this.#endTimer);
      this.#endTimer = setTimeout(() => this.#onPause(), END_GRACE);
      return;
    }

    this.#onPause();
  }

  #onWidgetFinish(progress: SoundCloudProgress) {
    clearTimeout(this.#endTimer);
    this.#syncSound(progress);

    const index = this.#soundId === null ? -1 : this.#soundIds.indexOf(this.#soundId);
    const isLast = this.#soundIds.length === 0 || index === this.#soundIds.length - 1;

    if (!isLast) {
      // A set moves on to its next track by itself, which the next `play` reports; one it cannot play ends playback.
      this.#endTimer = setTimeout(() => this.#end(), END_GRACE);
      return;
    }

    if (!this.#loop) {
      this.#end();
      return;
    }

    this.#applyCurrentTime(0, true);

    if (this.#soundIds.length > 1) this.#post('skip', 0);
    else this.#post('play');

    // A loop that does not start again is the end of playback after all.
    this.#endTimer = setTimeout(() => this.#end(), END_GRACE);
  }

  #onWidgetSeek(progress: SoundCloudProgress) {
    this.#syncSound(progress);

    if (this.#finished) return;

    const time = this.#clampTime((progress.currentPosition ?? 0) / 1000);

    // A seek loads from where it lands.
    this.#setBuffered(time, this.#loadedEnd(progress) ?? this.#bufferedEnd);

    if (this.#seeking) {
      this.#settleSeek(time);
      return;
    }

    // The widget repeats its position as seeks when it pauses.
    if (Math.abs(time - this.#currentTime) < SEEK_TOLERANCE) return;

    this.#ended = false;
    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
    this.#settleSeek(time);
  }

  #onWidgetProgress(progress: SoundCloudProgress) {
    this.#syncSound(progress);

    if (this.#finished) return;

    this.#syncBuffered(progress);

    // Positions from before a seek lands would drag the slider back.
    if (this.#seeking) return;

    const time = (progress.currentPosition ?? 0) / 1000;

    this.#applyCurrentTime(time);

    if (this.#awaitingProgress && !this.#paused && time > this.#playFrom) {
      this.#awaitingProgress = false;
      this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;
      this.dispatchEvent(new Event('playing'));
    }
  }

  #onWidgetError() {
    if (this.#readyState < READY_STATE_HAVE_METADATA) {
      this.#fail(
        new MediaError(
          `SoundCloud could not play ${this.#src}. It may be private, removed, or not available in this region.`,
          MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        )
      );
      this.#onPause();
      return;
    }

    // Announced but not kept: a set moves on to its next track by itself, and nothing else blocks the source.
    const error = new MediaError('The SoundCloud widget reported an error.', MediaError.MEDIA_ERR_CUSTOM, false);

    this.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
    this.#get('isPaused').then((paused) => {
      if (paused === true) this.#onPause();
    });
  }

  // A sound other than the current one is another track of the set, or a related track picked in the widget.
  #syncSound({ soundId }: SoundCloudProgress) {
    if (!isNumber(soundId) || soundId === this.#soundId) return;

    const changed = this.#soundId !== null;

    this.#soundId = soundId;

    if (!changed) return;

    clearTimeout(this.#endTimer);
    this.#finished = false;
    this.#ended = false;
    this.#setBuffered(0, 0);
    this.#applyCurrentTime(0, true);
    this.#get('getDuration').then((duration) => {
      if (isNumber(duration) && duration > 0) this.#applyDuration(duration / 1000);
    });
  }

  #end() {
    clearTimeout(this.#endTimer);
    this.#finished = true;
    this.#applyCurrentTime(this.#duration, true);
    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));
  }

  #onPause() {
    clearTimeout(this.#endTimer);
    this.#awaitingProgress = false;

    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  #seek(time: number) {
    this.#post('seekTo', Math.round(time * 1000));
    clearTimeout(this.#seekTimer);

    // The widget reports no seek it ignores, so a seek still open after a while settles where the widget is.
    this.#seekTimer = setTimeout(() => {
      this.#get('getPosition').then((position) => {
        if (this.#seeking && isNumber(position)) this.#settleSeek(this.#clampTime(position / 1000));
      });
    }, SEEK_SETTLE_TIMEOUT);
  }

  #settleSeek(time: number) {
    clearTimeout(this.#seekTimer);
    this.#applyCurrentTime(time, true);
    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  #applyVolume() {
    if (!this.#ready) return;

    this.#post('setVolume', this.#muted ? 0 : Math.round(this.#volume * 100));
  }

  #applyDuration(duration: number) {
    if (duration === this.#duration) return;

    this.#duration = duration;
    this.dispatchEvent(new Event('durationchange'));
  }

  // The widget reports its position about 50 times a second, so `timeupdate` follows a media element's pace instead.
  #applyCurrentTime(time: number, force = false) {
    const clamped = this.#clampTime(time);
    if (clamped === this.#currentTime) return;

    this.#currentTime = clamped;

    if (!force && Math.abs(clamped - this.#reportedTime) < TIMEUPDATE_INTERVAL) return;

    this.#reportedTime = clamped;
    this.dispatchEvent(new Event('timeupdate'));
  }

  #syncBuffered(progress: SoundCloudProgress) {
    const end = this.#loadedEnd(progress);

    if (!isUndefined(end)) this.#setBuffered(this.#bufferedStart, end);
  }

  #loadedEnd(progress: SoundCloudProgress): number | undefined {
    const share = loadedShareOf(progress);

    return isUndefined(share) || !Number.isFinite(this.#duration) ? undefined : clamp(share, 0, 1) * this.#duration;
  }

  #setBuffered(start: number, end: number) {
    if (start === this.#bufferedStart && end === this.#bufferedEnd) return;

    this.#bufferedStart = start;
    this.#bufferedEnd = end;
    this.dispatchEvent(new Event('progress'));
  }

  #clampTime(time: number): number {
    const max = Number.isFinite(this.#duration) ? this.#duration : Number.POSITIVE_INFINITY;

    return clamp(Number.isFinite(time) ? time : 0, 0, max);
  }

  #isAtEnd({ currentPosition }: SoundCloudProgress): boolean {
    return Number.isFinite(this.#duration) && this.#duration - (currentPosition ?? 0) / 1000 <= END_TOLERANCE;
  }

  #fail(error: MediaError) {
    this.#error = error;
    this.dispatchEvent(new Event('error'));
  }

  // Resolves `undefined` at once without a widget, and never for a load replaced before the widget answers.
  #get(method: SoundCloudWidgetGetter): Promise<unknown> {
    if (!this.#ready) return Promise.resolve(undefined);

    return new Promise((resolve) => {
      const queue = this.#requests.get(method) ?? [];

      queue.push(resolve);
      this.#requests.set(method, queue);
      this.#post(method);
    });
  }

  // A document that loses the race with a newer navigation can still report `ready`, or answer the probe once its
  // `load` fires late; only one created after the latest navigation plays what the host asked for.
  #isCurrentDocument(widgetId: string | null): boolean {
    if (widgetId === null) return true;

    const createdAt = Number(WIDGET_CREATED_AT.exec(widgetId)?.[1]);

    return Number.isFinite(createdAt) ? createdAt >= this.#navigatedAt : widgetId !== this.#staleWidgetId;
  }

  #probeReady() {
    if (this.#frameLoaded) this.#post(READY_PROBE);
  }

  // Posting to a frame being torn down throws and is swallowed.
  #post(method: SoundCloudWidgetCommand | SoundCloudWidgetGetter, value?: string | number) {
    const frame = this.#target?.contentWindow;
    if (!frame) return;

    tryCall(() => frame.postMessage(createSoundCloudCommand(method, value), WIDGET_ORIGIN));
  }

  #snapshotProps(): Partial<SoundCloudAdapterProps> {
    return { source: this.#source };
  }

  #resetState() {
    clearTimeout(this.#endTimer);
    clearTimeout(this.#seekTimer);
    clearTimeout(this.#durationTimer);
    this.#staleWidgetId = this.#widgetId ?? this.#staleWidgetId;
    this.#widgetId = null;
    this.#ready = false;
    this.#requests.clear();
    this.#autoplayPending = false;
    this.#startTime = null;
    this.#soundIds = [];
    this.#soundId = null;
    this.#finished = false;
    this.#awaitingProgress = false;
    this.#playFrom = 0;
    this.#reportedTime = 0;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#bufferedStart = 0;
    this.#bufferedEnd = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
  }
}

// Not `EMPTY_TIME_RANGES`, which tells the player this media never reports ranges, so it would stop listening for them.
const NO_TIME_RANGES: TimeRangeLike = Object.freeze({ length: 0, start: () => 0, end: () => 0 });

// The frame starts on a same-origin `about:blank`, which a post meant for the widget only warns about.
function hasWidgetDocument(target: HTMLIFrameElement): boolean {
  return !!target.getAttribute('src') && target.contentDocument === null;
}

function soundIdOf(sound: unknown): number | undefined {
  const id = isObject(sound) ? (sound as { id?: unknown }).id : undefined;

  return isNumber(id) ? id : isString(id) && /^\d+$/.test(id) ? Number(id) : undefined;
}

const SUBSCRIBED_EVENTS: readonly SoundCloudWidgetEvent[] = [
  'play',
  'pause',
  'finish',
  'seek',
  'playProgress',
  'loadProgress',
  'error',
];

// The widget names each document after `Date.now()` in the frame when it starts.
const WIDGET_CREATED_AT = /^widget_(\d+)$/;

// Only ever asked to find out whether a frame is ready, so its answers are never mistaken for a request's.
const READY_PROBE: SoundCloudWidgetGetter = 'getCurrentSoundIndex';

// Seconds from the end inside which a pause is the widget stopping at the end of a track.
const END_TOLERANCE = 0.5;
// How long the widget gets to report what follows the end of a track.
const END_GRACE = 1_500;
const SEEK_TOLERANCE = 0.05;
// Seconds that have to be loaded ahead of the position for playback to start without waiting.
const STARVED_MARGIN = 0.5;
const SEEK_SETTLE_TIMEOUT = 2_000;
const DURATION_ATTEMPTS = 20;
const DURATION_RETRY_INTERVAL = 250;
const TIMEUPDATE_INTERVAL = 0.25;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_CURRENT_DATA = 2;
const READY_STATE_HAVE_ENOUGH_DATA = 4;
