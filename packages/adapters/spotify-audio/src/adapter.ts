// Adapted from `spotify-audio-element` from `muxinc/media-elements`, ported to
// TypeScript and reshaped as a media adapter (mirrors `dom/youtube`).
// Source: https://github.com/muxinc/media-elements — License: MIT

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise, tryCall } from '@videojs/utils/function';
import { deepEqual } from '@videojs/utils/object';
import { isNumber } from '@videojs/utils/predicate';

import {
  loadSpotifyIframeApi,
  type SpotifyControllerApi,
  type SpotifyIframeApi,
  type SpotifyPlaybackState,
} from './iframe-api';
import type { SpotifyAdapterProps } from './props';
import { buildSpotifyIframeSrc, parseSpotifySource, type SpotifySource } from './source';

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class SpotifyAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: SpotifyAdapterProps = {
    src: '',
    autoplay: false,
    loop: false,
    controls: false,
    playsInline: true,
    preload: 'metadata',
    poster: '',
    source: null,
  };

  #target: HTMLIFrameElement | null = null;
  #controller: SpotifyControllerApi | null = null;
  // The controller drops `loadUri` before it reports itself ready.
  #controllerReady = false;
  // A load was requested before the controller was ready; replay it on `ready`.
  #pendingLoad = false;
  // Controller creation is in flight; the API load makes it span more than a tick.
  #creatingController = false;
  #loadComplete = createPublicPromise<void>();
  // Guards async controller creation across attach/detach cycles.
  #attachId = 0;

  #src = SpotifyAdapter.defaultProps.src;
  #autoplay = SpotifyAdapter.defaultProps.autoplay;

  #loop = SpotifyAdapter.defaultProps.loop;
  #controls = SpotifyAdapter.defaultProps.controls;
  #playsInline = SpotifyAdapter.defaultProps.playsInline;
  #preload = SpotifyAdapter.defaultProps.preload;
  #poster = SpotifyAdapter.defaultProps.poster;
  #source: SpotifySource | null = SpotifyAdapter.defaultProps.source;

  #paused = true;
  #ended = false;
  #seeking = false;
  #loaded = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  // Playback started but is stalled; the embed reports it as buffering-while-paused.
  #waiting = false;
  // A pause was asked for, so the paused update it produces is not a stall.
  #pauseRequested = false;
  // The entity ran out; kept so the end of playback is acted on exactly once.
  #closeToEnded = false;

  static PLAYER_SOFTWARE_NAME = 'spotify-audio';

  /** Underlying Spotify iframe API controller (null until the API loads). */
  get engine() {
    return this.#controller;
  }

  /** The iframe holding the embed, which everything from the embed URL down is written to. */
  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe hosting the embed; the API and controller follow as soon as an embed URL resolves. */
  attach(target: HTMLIFrameElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#beginLoad();
    this.#createPlayer();
  }

  detach(): void {
    if (!this.#target) return;

    this.#attachId++;
    // `destroy()` removes whatever `iframeElement` points at, and the embed belongs to React or the shadow root;
    // pointing the controller at a throwaway first leaves `destroy()` with nothing to remove but its listener.
    tryCall(() => {
      if (this.#controller) {
        this.#controller.iframeElement = createControllerPlaceholderFrame();
        this.#controller.destroy();
      }
    });
    this.#controller = null;
    this.#controllerReady = false;
    this.#pendingLoad = false;
    this.#creatingController = false;
    this.#target = null;
    // Unblock callers awaiting load; they re-check `#controller` (now null) and no-op.
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
  /** Spotify URL or URI. Setting it re-derives `source`, carrying its embed options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: SpotifySource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the single path for storing it, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // The `src` property resolves an empty attribute to the document URL; only the attribute reports an unbuilt embed.
    return this.#target?.getAttribute('src') ?? '';
  }

  get readyState() {
    return this.#readyState;
  }

  /** Reload the current source via the iframe API; deferred until the controller is ready. */
  async load() {
    if (!this.#controller || !this.#controllerReady) {
      // `loadUri` is dropped before the controller is ready, so replay then; a cleared src replays too.
      this.#pendingLoad = !!this.#target;

      // The target can be attached before it has anything to embed, in which case this load is what builds it.
      if (this.#target && !this.#controller && !this.#creatingController) {
        // `attach()`'s barrier was settled when there was nothing to embed, so `play()` needs a new one to wait on.
        const load = this.#beginLoad();

        // Wait a microtask: frameworks set `src` and the embed props in any order, and the URL is built once.
        await Promise.resolve();

        // A later load took over while waiting; building the embed is its job now.
        if (load !== this.#loadComplete) return;

        this.#createPlayer();
      }

      return;
    }

    const load = this.#beginLoad();

    // A cleared source has nothing to load, but what was reported about the old entity still has to go.
    this.#resetState();
    // `emptied` announces that reset, so it precedes the empty-src bail: a cleared source reports nothing further.
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // Left running, the embed keeps playing and writes the cleared state back; pausing is as far as it goes.
      load.resolve();
      tryCall(() => this.#controller?.pause());
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    const parsed = parseSpotifySource(this.#src);

    if (!parsed) {
      this.#error = new MediaError(`Unrecognized Spotify source: ${this.#src}`, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play() doesn't hang.
      load.resolve();
      return;
    }

    const target = this.#target;
    const embedSrc = buildSpotifyIframeSrc(this.#src, this.#snapshotProps());
    const embeddedSrc = target?.getAttribute('src') ?? '';
    // Theme, video variant, and the rest live only in the embed URL, so a change to any of them has to rebuild it.
    // Swapping only the entity does not, except in the video variant, which is a path `loadUri` cannot name.
    const rebuild =
      embedOptionsOf(embedSrc) !== embedOptionsOf(embeddedSrc) ||
      (isVideoEmbed(embedSrc) && embedPathOf(embedSrc) !== embedPathOf(embeddedSrc));

    if (target && embedSrc && rebuild) {
      target.src = embedSrc;
      return;
    }

    this.#controller.loadUri(`spotify:${parsed.type}:${parsed.id}`);
    // `loadUri` restarts the entity, so seek to the start position; an engine option outranks the `t` in `src`.
    const startTime = this.#source?.engine?.spotify?.t ?? parsed.startTime;

    if (isNumber(startTime)) this.currentTime = startTime;
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
    await this.#loadComplete;

    // The embed still holds the paused entity, so playing it would resume a cleared source.
    if (!this.#src) return;

    // `resume()` picks playback up where it stopped; `play()` would restart the entity.
    this.#controller?.resume();
  }

  pause() {
    // A stall reads as paused too, so a requested pause has to be remembered or its update looks like more buffering.
    this.#pauseRequested = true;
    this.#controller?.pause();
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#seeking = true;
    // Seeking starts a fresh run, so whatever ran out before it is behind us.
    this.#closeToEnded = false;
    this.#ended = false;
    // Report the requested position now: the embed only reports one about once a second.
    this.#currentTime = value;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));
    this.#afterLoad((controller) => controller.seek(value));
  }

  get duration() {
    return this.#duration;
  }

  // No volume or mute surface: the embed takes neither command and reports neither value, and inert members would
  // read as a capability, leaving the player offering a volume slider and a mute button that do nothing.

  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    this.#autoplay = value;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    // The embed has no loop of its own; the end of playback seeks back instead.
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

  /** Spotify URL or URI in `src`, plus embed options under `engine.spotify`. Replacing it re-derives `src`. */
  get source(): SpotifySource | null {
    return this.#source;
  }
  set source(value: SpotifySource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Embed options are read when the embed is built, so a change to them needs its own reload even with the same URL.
    const engineChanged = !deepEqual(this.#source?.engine?.spotify ?? null, source?.engine?.spotify ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  get buffered() {
    // The embed reports no buffer state, only a position, so only what has played is known to be available.
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

  /** Always empty: the embed exposes no captions or other text tracks. */
  get textTracks() {
    return EMPTY_TEXT_TRACKS;
  }

  // Build the embed and start controller creation once a source resolves, returning whether creation started. The
  // iframe API only talks to an iframe already holding an embed, so an unresolved target settles the load for a retry.
  #createPlayer(): boolean {
    const target = this.#target;
    if (!target || this.#controller || this.#creatingController) return false;

    // The `src` property resolves an empty attribute to the document URL; only the attribute spots a placeholder.
    if (!target.getAttribute('src')) {
      const initialSrc = buildSpotifyIframeSrc(this.#src, this.#snapshotProps());

      // No embed means no controller is coming to settle this load.
      if (!initialSrc) {
        this.#loadComplete.resolve();
        return false;
      }

      target.src = initialSrc;
    }

    this.#creatingController = true;
    this.dispatchEvent(new Event('loadstart'));
    void this.#createControllerApi(target);
    return true;
  }

  async #createControllerApi(target: HTMLIFrameElement) {
    const attachId = this.#attachId;
    let api: SpotifyIframeApi;

    try {
      api = await loadSpotifyIframeApi();
    } catch {
      // The failed load belongs to the attach that started it; a newer one must not be marked failed.
      if (this.#isStale(attachId)) return;

      this.#creatingController = false;
      this.#error = new MediaError('Failed to load the Spotify iframe API', MediaError.MEDIA_ERR_NETWORK);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play() doesn't hang.
      this.#loadComplete.resolve();
      return;
    }

    if (this.#isStale(attachId) || this.#target !== target) return;

    // `referrerPolicy` configures the iframe rather than the embed, so Spotify has no use for it.
    const { referrerPolicy: _referrerPolicy, ...options } = this.#source?.engine?.spotify ?? {};
    const controller = await new Promise<SpotifyControllerApi>((resolve) =>
      // Deliberately no entity: naming one has the controller build its own embed URL, carrying none of what this host
      // put on the one it built. The detached placeholder leaves `parentElement` null, so the swap `createController`
      // performs cannot fire and the controller is simply pointed at the iframe this host already built.
      api.createController(createControllerPlaceholder(), options, resolve)
    );

    if (this.#isStale(attachId) || this.#target !== target) {
      tryCall(() => controller.destroy());
      return;
    }

    // Both directions of the protocol read this: commands post to its `contentWindow`, and inbound messages match it.
    controller.iframeElement = target;
    this.#controller = controller;
    this.#creatingController = false;
    this.#bindControllerEvents(controller, attachId);
  }

  // Whether a callback belongs to a superseded attach; `destroy()` does not stop callbacks already scheduled.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  // Defer a controller call until `loadComplete` resolves, swallowing failures.
  #afterLoad(fn: (controller: SpotifyControllerApi) => void) {
    this.#loadComplete.then(
      () => {
        const controller = this.#controller;

        if (controller) tryCall(() => fn(controller));
      },
      () => {}
    );
  }

  #snapshotProps() {
    return {
      autoplay: this.#autoplay,
      loop: this.#loop,
      controls: this.#controls,
      playsInline: this.#playsInline,
      preload: this.#preload || SpotifyAdapter.defaultProps.preload,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#paused = !this.#autoplay;
    this.#ended = false;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#seeking = false;
    this.#loaded = false;
    this.#waiting = false;
    this.#pauseRequested = false;
    this.#closeToEnded = false;
    this.#error = null;
  }

  #onControllerReady() {
    this.#controllerReady = true;

    if (this.#pendingLoad) {
      // The embed was built from a stale src; skip its metadata and reload (`#onPlaybackUpdate` completes the load).
      this.#pendingLoad = false;
      void this.load();
      return;
    }

    this.#onLoaded();
  }

  #onLoaded() {
    if (this.#loaded) return;

    this.#loaded = true;
    this.#readyState = READY_STATE_HAVE_METADATA;

    // Duration arrives with the first playback update, which dispatches its own `durationchange`; no volume to report.
    for (const type of ['loadedmetadata', 'durationchange', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();

    // The embed URL carries no autoplay parameter, so asking the controller to play is the only way to honor the prop.
    if (this.#autoplay) void this.play();
  }

  #bindControllerEvents(controller: SpotifyControllerApi, attachId: number) {
    controller.addListener('ready', () => {
      if (this.#isStale(attachId)) return;

      this.#onControllerReady();
    });

    controller.addListener('playback_update', (event) => {
      if (this.#isStale(attachId)) return;

      this.#onPlaybackUpdate(event.data);
    });
  }

  // The embed reports state snapshots rather than events, so every dispatch is a diff between two of them; the early
  // returns keep it to at most one transition per update.
  #onPlaybackUpdate(data: SpotifyPlaybackState) {
    // The embed retains the old entity after clearing, so its snapshots no longer belong to a source.
    if (!this.#src) return;

    // Later loads (`loadUri`) never re-fire `ready`, so the first update completes the load.
    if (!this.#loaded) this.#onLoaded();

    if (this.#restartFromEnd(data)) return;

    this.#syncDuration(data.duration);
    this.#syncPosition(data.position);

    if (this.#syncPlayState(data)) return;

    this.#checkEnded();
  }

  // Whether playback is under way; a stall is reported as buffering while still flagged paused.
  #isStarting(data: SpotifyPlaybackState) {
    return data.isBuffering || !data.isPaused;
  }

  // Playing again after the end has to restart: the embed leaves the position at the end, where resuming has nothing
  // left to play. The seek makes this update the start of a fresh run, so nothing else acts on it.
  #restartFromEnd(data: SpotifyPlaybackState): boolean {
    if (!this.#closeToEnded || !this.#paused || !this.#isStarting(data)) return false;

    this.#closeToEnded = false;
    this.currentTime = REPLAY_POSITION;
    return true;
  }

  #syncDuration(duration: number) {
    const seconds = duration / 1000;
    if (seconds === this.#duration) return;

    // A different duration is a different entity, so whatever ended before is no longer what is playing.
    this.#closeToEnded = false;
    this.#duration = seconds;
    this.dispatchEvent(new Event('durationchange'));
  }

  #syncPosition(position: number) {
    const seconds = position / 1000;

    if (this.#seeking) {
      // The embed announces no seeks and keeps reporting the old position, so only a snapshot at the requested one says
      // the seek landed. `seek` truncates to whole seconds and the snapshot after it can be a snapshot late.
      if (seconds < Math.floor(this.#currentTime) || seconds > this.#currentTime + SNAPSHOT_INTERVAL) return;

      this.#seeking = false;
      this.dispatchEvent(new Event('seeked'));
    }

    if (seconds === this.#currentTime) return;

    // Only a position back inside the entity is a new run; one still at the end belongs to the run that finished there.
    if (Math.ceil(seconds) < this.#duration) {
      this.#closeToEnded = false;
      this.#ended = false;
    }

    this.#currentTime = seconds;
    this.dispatchEvent(new Event('timeupdate'));
  }

  // Translate the `isPaused`/`isBuffering` pair into play/pause/waiting/playing, returning whether the update was a
  // transition, which nothing else may act on.
  #syncPlayState(data: SpotifyPlaybackState): boolean {
    if (!this.#paused && data.isPaused) {
      // A stall reads as paused too, so a run that stopped while buffering stopped for data rather than for the
      // listener — unless the listener is who asked, which the embed can report mid-buffer.
      if (data.isBuffering && !this.#pauseRequested) {
        // A run that is already waiting has nothing new to report.
        if (this.#waiting) return false;

        this.#waiting = true;
        this.dispatchEvent(new Event('waiting'));
        return true;
      }

      this.#pauseRequested = false;
      this.#waiting = false;
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
      return true;
    }

    if (this.#paused && this.#isStarting(data)) {
      this.#pauseRequested = false;
      this.#paused = false;
      this.#ended = false;
      this.dispatchEvent(new Event('play'));
      // Buffering at the start means the entity is still loading, so playback has begun without playing yet.
      this.#waiting = data.isBuffering;

      if (!this.#waiting) this.#readyState = READY_STATE_HAVE_FUTURE_DATA;

      this.dispatchEvent(new Event(this.#waiting ? 'waiting' : 'playing'));
      return true;
    }

    if (this.#waiting && !data.isPaused) {
      this.#waiting = false;
      this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
      this.dispatchEvent(new Event('playing'));
      return true;
    }

    return false;
  }

  // The embed never reports the end, so it is inferred from the position catching up with the duration; positions
  // arrive about once a second, so the last one lands short of the end — hence rounding it up.
  #checkEnded() {
    if (this.#paused || this.#seeking || this.#closeToEnded) return;

    // An unresolved duration (`NaN` before the first update, `0` while the entity resolves) is nothing to end against.
    if (!(this.#duration > 0) || !Number.isFinite(this.#duration)) return;

    if (Math.ceil(this.#currentTime) < this.#duration) return;

    // The position stops moving at the end, so every later update reports the same thing; only the first one acts.
    this.#closeToEnded = true;

    if (this.#loop) {
      this.currentTime = REPLAY_POSITION;
      return;
    }

    this.#paused = true;
    this.#ended = true;
    // The embed rolls on into whatever follows the entity unless it is stopped.
    this.pause();
    this.dispatchEvent(new Event('pause'));
    this.dispatchEvent(new Event('ended'));
  }
}

// A node for `createController` to consume instead of the embed; never inserted, so the swap it performs on its target
// cannot reach the iframe this host owns.
function createControllerPlaceholder(): HTMLElement {
  return globalThis.document.createElement('div');
}

// The same idea for teardown, where the controller expects an iframe to remove.
function createControllerPlaceholderFrame(): HTMLIFrameElement {
  return globalThis.document.createElement('iframe');
}

// What an embed URL says about how an entity is embedded rather than which one or where it starts; the controller
// swaps entities and seeks on its own, so only a difference here is worth rebuilding an embed for.
function embedOptionsOf(src: string): string {
  const [, query] = src.split('?');
  const params = new URLSearchParams(query);

  params.delete('t');
  params.sort();
  return `${isVideoEmbed(src) ? 'video' : 'audio'}?${params}`;
}

// The entity an embed URL points at, without the parameters that configure it.
function embedPathOf(src: string): string {
  return src.split('?')[0] ?? '';
}

// Whether an embed URL points at the video variant, which lives at its own path.
function isVideoEmbed(src: string): boolean {
  return embedPathOf(src).endsWith('/video');
}

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;

// Where a replay starts: a second in rather than zero, which the embed can drop on a finished entity.
const REPLAY_POSITION = 1;

// How far apart playback snapshots land, near enough: the embed reports about once a second.
const SNAPSHOT_INTERVAL = 1;
