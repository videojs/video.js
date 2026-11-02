import { EMPTY_TEXT_TRACKS, MediaError, type TimeRangeLike, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { deepEqual } from '@videojs/utils/object';
import { isNumber, isUndefined } from '@videojs/utils/predicate';

import type { MixcloudAdapterProps } from './props';
import {
  buildMixcloudWidgetUrl,
  MIXCLOUD_LIVE_PARAMS,
  type MixcloudSource,
  type ParsedMixcloudSource,
  parseMixcloudSource,
  resolveMixcloudWidgetParams,
  wantsMixcloudAutoplay,
} from './source';
import {
  createMixcloudApiRequest,
  createMixcloudMethodCall,
  type MixcloudWidgetMethod,
  parseMixcloudMessage,
  WIDGET_ORIGIN,
} from './widget-api';

/**
 * Plays Mixcloud shows through the Mixcloud Widget. The widget shows only with `controls`, and then it takes input:
 * what the listener does in it is reported like anything the host asked for.
 *
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class MixcloudAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: MixcloudAdapterProps = {
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

  static PLAYER_SOFTWARE_NAME = 'mixcloud-audio';

  #target: HTMLIFrameElement | null = null;
  // Cancels the `message` and frame `load` listeners; the first lives on `window`, so nothing removes it with the frame.
  #listeners: AbortController | null = null;
  // Guards messages across attach/detach cycles.
  #attachId = 0;
  // Lets a `load()` waiting out its microtask drop out once a newer load begins.
  #loadId = 0;
  // An iframe URL rendered before the host had a source, which the first load keeps instead of reloading.
  #adoptedSrc: string | null = null;

  #src = MixcloudAdapter.defaultProps.src;
  #autoplay = MixcloudAdapter.defaultProps.autoplay;
  #defaultMuted = MixcloudAdapter.defaultProps.defaultMuted;
  #loop = MixcloudAdapter.defaultProps.loop;
  #controls = MixcloudAdapter.defaultProps.controls;
  #playsInline = MixcloudAdapter.defaultProps.playsInline;
  #preload = MixcloudAdapter.defaultProps.preload;
  #poster = MixcloudAdapter.defaultProps.poster;
  #source: MixcloudSource | null = MixcloudAdapter.defaultProps.source;

  #parsed: ParsedMixcloudSource | null = null;
  // The widget parameters the document shows: those of its URL, and those applied since through `setOption`.
  #documentParams: Record<string, string> = {};
  // Whether the widget has answered `getApi`, which is also when it starts reporting events.
  #ready = false;
  #methodId = 0;
  #requests = new Map<number, (value: unknown) => void>();
  #playRequested = false;
  #autoplayPending = false;
  // Whether the show has played since this document loaded; the widget drops a seek made before then.
  #started = false;
  // From the first `play` until the position moves, the widget reports `play` and `pause` back and forth as it loads.
  #starting = false;
  #pendingSeek: number | null = null;
  // The position a seek is headed for; the widget's reports until it lands would drag it back.
  #landingAt: number | null = null;
  // The seek was the listener's, in the widget, so a report of its position is what lands it.
  #followingWidget = false;
  #seekId = 0;
  // Playback was reported, but the position has not moved yet.
  #awaitingProgress = false;
  #waiting = false;
  #playFrom = 0;
  // `loop` asked for a restart once the widget settles after the end.
  #restartPending = false;
  #readyTimer: ReturnType<typeof setTimeout> | undefined;
  #durationTimer: ReturnType<typeof setTimeout> | undefined;
  #startTimer: ReturnType<typeof setTimeout> | undefined;
  #seekTimer: ReturnType<typeof setTimeout> | undefined;
  #endTimer: ReturnType<typeof setTimeout> | undefined;

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
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
  /** Mixcloud show URL. Setting it re-derives `source`, carrying its engine options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: MixcloudSource = { ...(engine && { engine }), ...(value && { src: value }) };

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

    // A widget rendered for the same show before the host had a source is this load already.
    if (adopted && this.#canKeep(adopted) && this.#hasReferrerPolicy(target)) {
      this.#parsed = parseMixcloudSource(this.#src);
      this.#autoplayPending = true;

      if (this.#ready) {
        this.#syncParams();
        this.#syncToWidget();
      } else if (hasWidgetDocument(target)) this.#onFrameLoad();

      return;
    }

    this.#resetState();
    // `emptied` announces that reset before the bails below, where the widget reports nothing further.
    this.dispatchEvent(new Event('emptied'));
    this.#loadWidget(target);
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

  /** Asks the widget to play. Browsers may refuse it without a gesture, and then the widget reports nothing. */
  async play() {
    if (!this.#src || this.#error) return;

    if (!this.#ready) {
      this.#playRequested = true;
      return;
    }

    this.#post('play');
  }

  pause() {
    this.#playRequested = false;
    this.#autoplayPending = false;
    // A pause asked for is real, so the widget's report of it must not pass for loading.
    this.#starting = false;
    this.#restartPending = false;

    if (this.#ready) this.#post('pause');
  }

  get currentTime() {
    return this.#currentTime;
  }
  /** Whole seconds, as the widget seeks and reports its position. */
  set currentTime(value) {
    const time = Math.round(this.#clampTime(value));

    // With no source, or one that failed to load, no widget will ever report the seek landing.
    if (!this.#ready && (!this.#src || this.#error)) {
      this.#currentTime = time;
      return;
    }

    if (time === this.#currentTime && !this.#ended) return;

    this.#ended = false;
    this.#seeking = true;
    this.#currentTime = time;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));

    if (this.#ready && this.#started) {
      this.#seek(time);
      return;
    }

    // Held until the show plays, which is the first moment the widget keeps a seek.
    this.#pendingSeek = time;
    this.#settleSeek(time);
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

  /** Starts playback once the widget is ready, after the volume applies. Browsers may refuse it. */
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

    // Seeds `muted` until the widget is up; `#onReady` then applies it.
    if (!this.#ready) this.#muted = value;
  }

  /** Plays the show again from the start when it ends. */
  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;
  }

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

  /** Mixcloud show URL in `src`, widget parameters under `engine.mixcloud`. Replacing it re-derives `src`. */
  get source(): MixcloudSource | null {
    return this.#source;
  }
  set source(value: MixcloudSource | null) {
    const source = value ?? null;
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    const engineChanged = !deepEqual(this.#source?.engine?.mixcloud ?? null, source?.engine?.mixcloud ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged) void this.load();
    else if (engineChanged) this.#onParamsChange();

    this.dispatchEvent(new Event('sourcechange'));
  }

  /** Always empty: the widget does not report how much of the show it has loaded. */
  get buffered() {
    return NO_TIME_RANGES;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration) ? createTimeRange(0, this.#duration) : NO_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  /** Always empty: Mixcloud has no captions or other text tracks. */
  get textTracks() {
    return EMPTY_TEXT_TRACKS;
  }

  // Playback rate, picture-in-picture, and fullscreen are left out on purpose: the widget offers none of them, and a
  // member that cannot reach the player would read as a capability it has.

  // A rendered frame is kept and its `getApi` answer settles the load; an empty one is pointed at the current source.
  #createPlayer(target: HTMLIFrameElement) {
    const rendered = target.getAttribute('src');

    if (!rendered) {
      if (this.#src) this.#loadWidget(target);

      return;
    }

    // A widget that loaded before anything listened has already announced `ready`, so the load asks it for its API.
    this.#documentParams = widgetParamsOf(rendered);
    this.dispatchEvent(new Event('loadstart'));
    this.#adoptedSrc = rendered;

    if (this.#src) void this.load();
  }

  #loadWidget(target: HTMLIFrameElement) {
    const parsed = parseMixcloudSource(this.#src);

    this.#parsed = parsed;

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
        new MediaError(
          `Unrecognized Mixcloud source: ${this.#src}. Use the URL of a show.`,
          MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        )
      );
      return;
    }

    const referrerPolicy = this.#source?.engine?.mixcloud?.referrerPolicy;

    // A frame sends the policy it has when it navigates, so it goes on first.
    if (referrerPolicy !== undefined) target.referrerPolicy = referrerPolicy;

    this.#documentParams = resolveMixcloudWidgetParams(parsed, this.#snapshotProps());
    target.src = buildMixcloudWidgetUrl(parsed, this.#snapshotProps());
  }

  #hasReferrerPolicy(target: HTMLIFrameElement): boolean {
    const referrerPolicy = this.#source?.engine?.mixcloud?.referrerPolicy;

    return referrerPolicy === undefined || target.referrerPolicy === referrerPolicy;
  }

  // Whether a rendered widget plays the current show with every parameter the URL alone can set; the others apply in
  // place once it is ready.
  #canKeep(rendered: string): boolean {
    const parsed = parseMixcloudSource(this.#src);
    if (!parsed) return false;

    const url = parseWidgetUrl(rendered);
    if (url?.origin !== WIDGET_ORIGIN || url.searchParams.get('feed') !== parsed.key) return false;

    return deepEqual(
      withoutLiveParams(widgetParamsOf(rendered)),
      withoutLiveParams(resolveMixcloudWidgetParams(parsed, this.#snapshotProps()))
    );
  }

  // The layout options apply in place; any other widget parameter reloads the widget.
  #onParamsChange() {
    const target = this.#target;
    if (!target || !this.#parsed || !this.#src) return;

    const rendered = target.getAttribute('src');

    if (rendered && this.#canKeep(rendered) && this.#hasReferrerPolicy(target)) this.#syncParams();
    else void this.load();
  }

  #syncParams() {
    if (!this.#ready || !this.#parsed) return;

    const wanted = resolveMixcloudWidgetParams(this.#parsed, this.#snapshotProps());

    for (const key of MIXCLOUD_LIVE_PARAMS) {
      const value = isTrueParam(wanted[key]);
      if (value === isTrueParam(this.#documentParams[key])) continue;

      this.#post('setOption', key, value);
      this.#documentParams = { ...this.#documentParams, [key]: value ? '1' : '0' };
    }
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
        if (hasWidgetDocument(target)) this.#onFrameLoad();
      },
      { signal }
    );
  }

  // The widget announces `ready` once per document, possibly before anything listened, so a loaded frame is asked for
  // its API directly. One that never answers is not a show the widget can find.
  #onFrameLoad() {
    if (this.#ready || this.#error || !this.#parsed) return;

    this.#requestApi();
    clearTimeout(this.#readyTimer);
    this.#readyTimer = setTimeout(() => {
      if (this.#ready || this.#error || !this.#src) return;

      this.#fail(
        new MediaError(
          'Mixcloud could not find this show. It may be private, removed, or not a show.',
          MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        )
      );
    }, READY_TIMEOUT);
  }

  #onMessage(event: MessageEvent, target: HTMLIFrameElement, attachId: number) {
    if (attachId !== this.#attachId || event.origin !== WIDGET_ORIGIN) return;

    const frame = target.contentWindow;
    if (!frame || event.source !== frame) return;

    const message = parseMixcloudMessage(event.data);
    if (!message) return;

    switch (message.type) {
      case 'ready':
        // A second `ready` comes from a new document the frame loaded by itself, as moving an iframe in the DOM does.
        if (this.#ready) this.#onFrameReloaded();

        this.#requestApi();
        break;
      case 'api':
        if (!this.#ready) this.#onReady();

        break;
      case 'methodResponse': {
        const answer = this.#requests.get(message.methodId);

        this.#requests.delete(message.methodId);
        answer?.(message.value);
        break;
      }
      case 'event':
        if (this.#ready) this.#onWidgetEvent(message.eventName, message.args);

        break;
    }
  }

  #onWidgetEvent(name: string, args: unknown[]) {
    switch (name) {
      case 'progress':
        this.#onWidgetProgress(args[0], args[1]);
        break;
      case 'play':
        this.#onWidgetPlay();
        break;
      case 'pause':
        this.#onWidgetPause();
        break;
      case 'buffering':
        this.#onWidgetBuffering();
        break;
      case 'ended':
        this.#onWidgetEnded();
        break;
      case 'error':
        this.#onWidgetError();
        break;
    }
  }

  #onReady() {
    clearTimeout(this.#readyTimer);
    this.#ready = true;
    this.#syncParams();
    this.#applyVolume();

    // A widget rendered before the host listened may already be playing.
    this.#call('getIsPaused').then((paused) => {
      if (paused === false && this.#paused) this.#onWidgetPlay();
    });
    this.#probeDuration();
    this.#syncToWidget();
  }

  // Play what was asked for before the widget was ready, once the volume has applied, so a muted autoplay starts muted.
  #syncToWidget() {
    const autoplay = this.#autoplayPending && (this.#autoplay || wantsMixcloudAutoplay(this.#parsed, this.#source));

    if (this.#playRequested || autoplay) this.#post('play');

    this.#playRequested = false;
    this.#autoplayPending = false;
  }

  // The new document starts from its URL's parameters and its own start, so the media does too.
  #onFrameReloaded() {
    this.#documentParams = widgetParamsOf(this.#target?.getAttribute('src') ?? '');
    this.#resetState();
    this.dispatchEvent(new Event('emptied'));
    this.dispatchEvent(new Event('loadstart'));
  }

  // The widget knows the duration a moment after it is ready, without playing. A show whose audio it cannot load never
  // reports one, and gets no further.
  #probeDuration(attempt = 1) {
    this.#call('getDuration').then((duration) => {
      if (this.#error || this.#readyState >= READY_STATE_HAVE_METADATA) return;

      if (isNumber(duration) && duration > 0) {
        this.#onLoaded(duration);
        return;
      }

      if (attempt >= DURATION_ATTEMPTS) {
        this.#fail(
          new MediaError(
            'Mixcloud did not load this show in time. It may be for subscribers only or not available in this region.',
            MediaError.MEDIA_ERR_NETWORK
          )
        );
        return;
      }

      this.#durationTimer = setTimeout(() => this.#probeDuration(attempt + 1), DURATION_RETRY_INTERVAL);
    });
  }

  #onLoaded(duration: number) {
    this.#applyDuration(duration);

    if (this.#readyState >= READY_STATE_HAVE_METADATA) return;

    clearTimeout(this.#durationTimer);
    this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;

    for (const type of ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }
  }

  #onWidgetPlay() {
    clearTimeout(this.#endTimer);
    this.#restartPending = false;

    if (!this.#paused) return;

    // A media element plays an ended show from the start, as the widget does.
    if (this.#ended) this.#applyCurrentTime(0);

    this.#paused = false;
    this.#ended = false;
    this.#awaitingProgress = true;
    this.#playFrom = this.#currentTime;
    this.dispatchEvent(new Event('play'));

    if (this.#started) return;

    this.#starting = true;
    this.#armStartCheck();
    this.#onWidgetBuffering();
  }

  #onWidgetPause() {
    if (this.#restartPending) {
      this.#restart();
      return;
    }

    if (this.#starting) return;

    this.#onPause();
  }

  #onWidgetBuffering() {
    if (this.#paused || this.#waiting) return;

    this.#waiting = true;
    this.#awaitingProgress = true;
    this.#playFrom = this.#currentTime;
    this.#readyState = Math.min(this.#readyState, READY_STATE_HAVE_CURRENT_DATA);
    this.dispatchEvent(new Event('waiting'));
  }

  #onWidgetProgress(position: unknown, duration: unknown) {
    if (isNumber(duration) && duration > 0) this.#onLoaded(duration);

    if (!isNumber(position)) return;

    if (this.#landingAt !== null) {
      if (this.#followingWidget && position >= this.#landingAt && position - this.#landingAt <= SEEK_JUMP) {
        this.#land(position);
      }

      return;
    }

    if (!this.#paused && !this.#started && position !== this.#playFrom) {
      this.#started = true;
      this.#starting = false;
      clearTimeout(this.#startTimer);

      if (this.#pendingSeek !== null) {
        const time = this.#pendingSeek;

        this.#pendingSeek = null;
        this.#seek(time);
        return;
      }
    }

    // Reports from before the show started belong to the position the widget would not keep.
    if (this.#pendingSeek !== null) return;

    // The widget reports no seeks of its own, so a listener seeking in it shows only as a jump in its position.
    if (this.#started && Math.abs(position - this.#currentTime) > SEEK_JUMP) {
      this.#followWidgetSeek(position);
      return;
    }

    this.#applyCurrentTime(position);

    if (this.#awaitingProgress && !this.#paused && position !== this.#playFrom) {
      this.#awaitingProgress = false;
      this.#waiting = false;
      this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;
      this.dispatchEvent(new Event('playing'));
    }
  }

  #onWidgetEnded() {
    if (!this.#loop) {
      this.#end();
      return;
    }

    // The widget reports a pause right after the end; playing again before then would be undone by it.
    this.#restartPending = true;
    clearTimeout(this.#endTimer);
    this.#endTimer = setTimeout(() => this.#restart(), END_GRACE);
  }

  #restart() {
    clearTimeout(this.#endTimer);
    this.#restartPending = false;
    this.#applyCurrentTime(0);
    this.#post('play');

    // A loop that does not start again is the end of playback after all.
    this.#endTimer = setTimeout(() => this.#end(), END_GRACE * 2);
  }

  #onWidgetError() {
    this.#starting = false;

    if (this.#error) {
      this.#onPause();
      return;
    }

    if (!this.#started) {
      this.#fail(
        new MediaError(
          'Mixcloud could not play this show. It may be for subscribers only or not available in this region.',
          MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        )
      );
    } else {
      this.#fail(new MediaError('The Mixcloud widget stopped with an error.', MediaError.MEDIA_ERR_NETWORK));
    }

    this.#onPause();
  }

  // Loading toggles the widget between `play` and `pause`, so the pause that counts is the one it still holds once
  // loading has had its time.
  #armStartCheck() {
    clearTimeout(this.#startTimer);
    this.#startTimer = setTimeout(() => {
      if (!this.#starting) return;

      this.#call('getIsPaused').then((paused) => {
        if (!this.#starting) return;

        if (paused === true) {
          this.#starting = false;
          this.#onPause();
        } else this.#armStartCheck();
      });
    }, START_TIMEOUT);
  }

  #end() {
    clearTimeout(this.#endTimer);
    this.#restartPending = false;
    this.#applyCurrentTime(this.#duration);
    this.#onPause();
    this.#ended = true;
    this.dispatchEvent(new Event('ended'));
  }

  #onPause() {
    clearTimeout(this.#startTimer);
    this.#awaitingProgress = false;
    this.#waiting = false;

    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  // The widget confirms a seek once its position, which it keeps in whole seconds, equals the target.
  #seek(target: number) {
    const seekId = ++this.#seekId;

    this.#landingAt = target;
    this.#followingWidget = false;
    clearTimeout(this.#seekTimer);

    this.#call('seek', target).then((allowed) => {
      if (seekId !== this.#seekId) return;

      if (allowed === true) this.#land(target);
      else this.#landWhereWidgetIs(seekId);
    });

    // The widget gives up on a seek after 5 seconds, and sometimes never answers, so one still open settles where it is.
    this.#seekTimer = setTimeout(() => {
      if (seekId === this.#seekId) this.#landWhereWidgetIs(seekId);
    }, SEEK_SETTLE_TIMEOUT);
  }

  // The widget reports the target of a seek in its own seek bar, then once more where it was before, then the target.
  #followWidgetSeek(target: number) {
    const seekId = ++this.#seekId;

    this.#landingAt = target;
    this.#followingWidget = true;
    this.#ended = false;
    this.#seeking = true;
    this.dispatchEvent(new Event('seeking'));
    this.#applyCurrentTime(target);
    clearTimeout(this.#seekTimer);
    this.#seekTimer = setTimeout(() => {
      if (seekId === this.#seekId) this.#landWhereWidgetIs(seekId);
    }, WIDGET_SEEK_CONFIRM);
  }

  // A refused or lost seek leaves the widget where it was, and the position goes back there.
  #landWhereWidgetIs(seekId: number) {
    this.#call('getPosition').then((position) => {
      if (seekId === this.#seekId) this.#land(isNumber(position) ? position : this.#currentTime);
    });
  }

  #land(time: number) {
    clearTimeout(this.#seekTimer);
    this.#landingAt = null;
    this.#followingWidget = false;
    this.#settleSeek(time);
  }

  #settleSeek(time: number) {
    this.#applyCurrentTime(time);

    if (!this.#seeking) return;

    this.#seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  #applyVolume() {
    if (!this.#ready) return;

    this.#post('setVolume', this.#muted ? 0 : this.#volume);
  }

  #applyDuration(duration: number) {
    if (duration === this.#duration) return;

    this.#duration = duration;
    this.dispatchEvent(new Event('durationchange'));
  }

  #applyCurrentTime(time: number) {
    const clamped = this.#clampTime(time);
    if (clamped === this.#currentTime) return;

    this.#currentTime = clamped;
    this.dispatchEvent(new Event('timeupdate'));
  }

  #clampTime(time: number): number {
    const max = Number.isFinite(this.#duration) ? this.#duration : Number.POSITIVE_INFINITY;

    return clamp(Number.isFinite(time) ? time : 0, 0, max);
  }

  #fail(error: MediaError) {
    clearTimeout(this.#readyTimer);
    clearTimeout(this.#durationTimer);
    this.#error = error;
    this.dispatchEvent(new Event('error'));
  }

  #requestApi() {
    const frame = this.#target?.contentWindow;
    if (!frame) return;

    tryCall(() => frame.postMessage(createMixcloudApiRequest(), WIDGET_ORIGIN));
  }

  // Resolves `undefined` at once without a widget, and never for a load replaced before the widget answers.
  #call(method: MixcloudWidgetMethod, ...args: unknown[]): Promise<unknown> {
    if (!this.#ready) return Promise.resolve(undefined);

    return new Promise((resolve) => {
      this.#requests.set(this.#post(method, ...args), resolve);
    });
  }

  // Posting to a frame being torn down throws and is swallowed.
  #post(method: MixcloudWidgetMethod, ...args: unknown[]): number {
    const methodId = ++this.#methodId;
    const frame = this.#target?.contentWindow;

    if (frame) tryCall(() => frame.postMessage(createMixcloudMethodCall(methodId, method, args), WIDGET_ORIGIN));

    return methodId;
  }

  #snapshotProps(): Partial<MixcloudAdapterProps> {
    return { source: this.#source };
  }

  #resetState() {
    clearTimeout(this.#readyTimer);
    clearTimeout(this.#durationTimer);
    clearTimeout(this.#startTimer);
    clearTimeout(this.#seekTimer);
    clearTimeout(this.#endTimer);
    this.#ready = false;
    this.#requests.clear();
    this.#autoplayPending = false;
    this.#started = false;
    this.#starting = false;
    this.#pendingSeek = null;
    this.#landingAt = null;
    this.#followingWidget = false;
    this.#seekId++;
    this.#awaitingProgress = false;
    this.#waiting = false;
    this.#playFrom = 0;
    this.#restartPending = false;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#currentTime = 0;
    this.#duration = Number.NaN;
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

function parseWidgetUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch {
    return null;
  }
}

function widgetParamsOf(src: string): Record<string, string> {
  const url = parseWidgetUrl(src);

  return url ? Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'feed')) : {};
}

function withoutLiveParams(params: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter(([key]) => !MIXCLOUD_LIVE_PARAMS.has(key)));
}

// How the widget reads a boolean parameter.
function isTrueParam(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

// How long a loaded frame gets to answer before its show counts as missing; the widget answers within a second.
const READY_TIMEOUT = 8_000;
const DURATION_ATTEMPTS = 60;
const DURATION_RETRY_INTERVAL = 250;
// How long loading may hold the widget paused before that pause counts.
const START_TIMEOUT = 8_000;
const SEEK_SETTLE_TIMEOUT = 6_000;
// Seconds the position may move between two reports, a second apart, before the move counts as a seek.
const SEEK_JUMP = 2;
// How long a seek in the widget waits for a report of where it landed, which a paused widget never sends.
const WIDGET_SEEK_CONFIRM = 1_000;
// How long the widget gets to settle after the end before a loop plays it again.
const END_GRACE = 1_000;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_CURRENT_DATA = 2;
const READY_STATE_HAVE_ENOUGH_DATA = 4;
