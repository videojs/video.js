// Adapted from `cloudflare-video-element` (muxinc/media-elements, MIT), ported to TypeScript and reshaped as a
// media adapter (mirrors `dom/youtube`).
// Source: https://github.com/muxinc/media-elements

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type TextTrackListLike, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise, tryCall } from '@videojs/utils/function';
import { deepEqual } from '@videojs/utils/object';

import type { CloudflareAdapterProps } from './props';
import {
  buildCloudflareIframeSrc,
  type CloudflareSource,
  parseCloudflareSource,
  shouldDeferCloudflareEmbed,
} from './source';
import { type CloudflareStreamApi, type CloudflareStreamPlayerApi, loadCloudflareStreamApi } from './stream-api';

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class CloudflareAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: CloudflareAdapterProps = {
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

  #target: HTMLIFrameElement | null = null;
  #player: CloudflareStreamPlayerApi | null = null;
  // Player creation is in flight; the SDK load makes it span more than a tick.
  #creatingPlayer = false;
  // A load was requested while the SDK was loading; replay it once the player exists.
  #pendingLoad = false;
  // Barrier for the load in progress; its identity is the load's identity, letting a late response check ownership.
  #loadComplete = createPublicPromise<void>();
  // Guards async player creation across attach/detach cycles.
  #attachId = 0;
  // The SDK has no teardown, so its listeners are unbound one by one.
  #playerListeners: [type: string, listener: () => void][] = [];
  // Playback was requested, so a `preload="none"` embed may be built.
  #activated = false;
  // The frame's URL asks it to play, since `play()` is what built it. Cloudflare then starts as it loads, rather than
  // once the SDK is up to take `play()`.
  #embedPlays = false;

  #src = CloudflareAdapter.defaultProps.src;
  #autoplay = CloudflareAdapter.defaultProps.autoplay;
  #defaultMuted = CloudflareAdapter.defaultProps.defaultMuted;
  #loop = CloudflareAdapter.defaultProps.loop;
  #controls = CloudflareAdapter.defaultProps.controls;
  #playsInline = CloudflareAdapter.defaultProps.playsInline;
  #preload = CloudflareAdapter.defaultProps.preload;
  #poster = CloudflareAdapter.defaultProps.poster;
  #source: CloudflareSource | null = CloudflareAdapter.defaultProps.source;

  #paused = true;
  #ended = false;
  #seeking = false;
  #loaded = false;
  // The current `src` names no Cloudflare video, so the embed still holds the last one.
  #srcUnsupported = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #progress = 0;
  #videoWidth = Number.NaN;
  #videoHeight = Number.NaN;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  #textTracksHost: HTMLVideoElement | null = null;

  /** Engine this media plays through, reported to analytics such as Mux Data. */
  static readonly engineName: string = 'cloudflare';

  /** Underlying Stream SDK player instance (null until the SDK loads). */
  get engine() {
    return this.#player;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the embed iframe. The SDK and player follow once an embed URL resolves, which may not be until `load()`. */
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
    this.#unbindPlayerEvents();
    // The SDK offers no teardown, so pausing is all that keeps a detached embed from playing on out of sight.
    this.#pauseEmbed();
    this.#player = null;
    this.#creatingPlayer = false;
    this.#pendingLoad = false;
    this.#textTracksHost = null;
    this.#target = null;
    this.#activated = false;
    this.#embedPlays = false;
    // Unblock callers awaiting load; they re-check `#player` (now null) and no-op.
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
  /** Cloudflare URL, video UID, or signed token. Setting it re-derives `source`, carrying its embed parameters over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: CloudflareSource = { ...(engine && { engine }), ...(value && { src: value }) };

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

  /** Reload the current source through the Stream player; no-op until `attach()`. */
  async load() {
    if (!this.#player) {
      // Nothing to reload without a target, and no load to wait on either.
      if (!this.#target) return;

      if (this.#creatingPlayer) {
        // The iframe is being built from a stale src; replaying once the player exists is the only way to reach the
        // new one, and callers are still waiting on the barrier creation opened.
        this.#pendingLoad = true;
        return;
      }

      // This load is what finally builds the embed; wait a microtask so the one-shot embed URL sees every prop a
      // framework sets around `src`.
      const load = this.#beginLoad();

      this.#resetState();
      await Promise.resolve();

      // A later load took over while waiting; building the embed is its job now.
      if (load !== this.#loadComplete) return;

      this.#createPlayer();
      return;
    }

    const load = this.#beginLoad();

    // The autoplay a `play()` wrote was for the video it built. Dropping it from the URL rebuilds the frame below rather
    // than swapping, since the player keeps the autoplay it was built with.
    this.#embedPlays = false;

    // Reset before bailing on an empty src: a cleared source has nothing to load, but the old video's state still goes.
    this.#resetState();
    // `emptied` announces that reset and so precedes the empty-src bail; a cleared source is the one case where the
    // embed reports nothing further, stranding listeners on the last video's duration and buffer.
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // The embed has to stop too: left running it keeps playing, and its events write the cleared state back.
      load.resolve();
      this.#pauseEmbed();
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    const parsed = parseCloudflareSource(this.#src);

    if (!parsed) {
      this.#srcUnsupported = true;
      this.#error = new MediaError(
        `Unrecognized Cloudflare Stream source: ${this.#src}`,
        MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
      );
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      load.resolve();
      // No video to swap to, so the embed keeps playing the last one under an error the host is already reporting.
      this.#pauseEmbed();
      return;
    }

    // Embed parameters are read once from the iframe URL, so a change to them only lands by rebuilding: the swap below
    // moves the video alone, and reassigning the id already held may never report metadata, stranding this load.
    const target = this.#target;
    const nextSrc = buildCloudflareIframeSrc(this.#src, this.#snapshotProps());

    if (target && nextSrc && embedParamsOf(nextSrc) !== embedParamsOf(target.getAttribute('src') ?? '')) {
      // The rebuilt embed reports its own metadata, which settles this load when it preloads.
      target.src = nextSrc;
      this.#settleIfNotPreloading(load);
      return;
    }

    // The player mimics `HTMLVideoElement` down to a writable `src`, so swap the video instead of discarding a working
    // embed and its SDK connection.
    this.#player.src = parsed.id;
    this.#settleIfNotPreloading(load);
  }

  // Take over as the current load; settling the outgoing barrier releases its waiters.
  #beginLoad(): PublicPromise<void> {
    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    return this.#loadComplete;
  }

  // An embed told not to preload reports no metadata until it plays, so a load waiting on metadata would leave `play()`
  // waiting on the playback it starts. Like a native element, the load ends once the source is set.
  #settleIfNotPreloading(load: PublicPromise<void>) {
    if (this.#embedPreload === 'none' && !this.#autoplay) load.resolve();
  }

  // Whether the embed is playing the reported source; a cleared or unrecognized src leaves it on the previous video.
  get #hasSource() {
    return !!this.#src && !this.#srcUnsupported;
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
    // Like a native media under `preload="none"`, playing is what starts the load, and the embed it builds is told to play
    // in its URL.
    if (this.#isDormant()) {
      this.#activated = true;
      // A server-rendered frame already holds its URL.
      this.#embedPlays = !this.#target?.getAttribute('src');
      this.#wake();
    }

    await this.#loadComplete;

    // The embed still holds the previous video, so playing it would resume a source that is no longer reported.
    if (!this.#hasSource) return;

    await this.#player?.play();
  }

  pause() {
    this.#player?.pause();
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#currentTime = value;
    this.#afterLoad((p) => {
      p.currentTime = value;
    });
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
    this.#afterLoad((p) => {
      p.volume = value;
    });
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.#afterLoad((p) => {
      p.muted = value;
    });
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.#afterLoad((p) => {
      p.playbackRate = value;
    });
  }

  get autoplay() {
    return this.#autoplay;
  }
  set autoplay(value) {
    const wasDormant = this.#isDormant();

    this.#autoplay = value;
    this.#afterLoad((p) => {
      p.autoplay = value;
    });

    if (wasDormant) this.#wake();
  }

  get defaultMuted() {
    return this.#defaultMuted;
  }
  set defaultMuted(value) {
    // The embed reads its initial muted state from the URL; afterwards `muted` is the only way to reach the player.
    this.#defaultMuted = value;

    // Seed `muted` the way a media element does until the embed reports its own, so muted autoplay never reads unmuted.
    if (!this.#loaded) this.#muted = value;
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;
    this.#afterLoad((p) => {
      p.loop = value;
    });
  }

  get controls() {
    return this.#controls;
  }
  set controls(value) {
    const wasDormant = this.#isDormant();

    this.#controls = value;
    this.#afterLoad((p) => {
      p.controls = value;
    });

    if (wasDormant) this.#wake();
  }

  get playsInline() {
    return this.#playsInline;
  }
  set playsInline(value) {
    // The Stream embed plays inline on its own and has no knob for it.
    this.#playsInline = value;
  }

  get preload() {
    return this.#preload;
  }
  set preload(value) {
    const wasDormant = this.#isDormant();

    this.#preload = value;
    this.#afterLoad((p) => {
      p.preload = this.#embedPreload;
    });

    if (wasDormant) this.#wake();
  }

  get poster() {
    return this.#poster;
  }
  set poster(value) {
    this.#poster = value;
    this.#afterLoad((p) => {
      p.poster = value;
    });
  }

  /** Structured source: `src` plus embed parameters under `engine.cloudflare`. Replacing it re-derives `src`. */
  get source(): CloudflareSource | null {
    return this.#source;
  }
  set source(value: CloudflareSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Embed parameters are read when the embed is built, so a change to them needs a reload even at the same URL.
    const engineChanged = !deepEqual(this.#source?.engine?.cloudflare ?? null, source?.engine?.cloudflare ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  get buffered() {
    return this.#progress > 0 ? createTimeRange(0, this.#progress) : EMPTY_TIME_RANGES;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration)
      ? createTimeRange(0, this.#duration)
      : EMPTY_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  /** Always empty: the SDK exposes no track API, and the embed owns the track picked by `defaultTextTrack`. */
  get textTracks() {
    this.#textTracksHost ??= globalThis.document?.createElement('video') ?? null;
    return (this.#textTracksHost?.textTracks as TextTrackListLike) ?? EMPTY_TEXT_TRACKS;
  }

  get videoWidth() {
    return this.#videoWidth;
  }

  get videoHeight() {
    return this.#videoHeight;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  // The SDK exposes no fullscreen controls, so fullscreen targets the iframe itself.
  async requestFullscreen() {
    // Without an element to request it on nothing entered fullscreen, so the flag must not claim otherwise.
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

  // No picture-in-picture surface: the SDK exposes no request or exit method and no enter or leave event, so declaring
  // the members would offer a control that does nothing.

  // Build the embed and start player creation; an unresolvable source settles the load and returns false for a retry.
  #createPlayer(): boolean {
    const target = this.#target;
    if (!target || this.#player || this.#creatingPlayer) return false;

    // Answer now whether the embed came from the document: one built here navigates on its own while the SDK loads and
    // would look server-rendered by the time it resolves.
    let serverRendered = false;

    // The `src` property resolves an empty attribute to the document URL; only the attribute spots a placeholder.
    if (!target.getAttribute('src')) {
      // A dormant embed is built by `play()`; until then no player is coming to settle this load.
      if (this.#isDormant()) {
        this.#loadComplete.resolve();
        return false;
      }

      const initialSrc = buildCloudflareIframeSrc(this.#src, this.#snapshotProps());

      // No embed means no player is coming to settle this load.
      if (!initialSrc) {
        this.#loadComplete.resolve();
        return false;
      }

      target.src = initialSrc;
    } else {
      serverRendered = hasEmbedNavigated(target);
    }

    this.#creatingPlayer = true;
    this.dispatchEvent(new Event('loadstart'));
    void this.#createPlayerApi(target, serverRendered);
    return true;
  }

  async #createPlayerApi(target: HTMLIFrameElement, serverRendered: boolean) {
    const attachId = this.#attachId;
    let api: CloudflareStreamApi;

    try {
      api = await loadCloudflareStreamApi();
    } catch {
      // A failed SDK load belongs to the attach that started it; a newer one must not be marked failed.
      if (this.#isStale(attachId)) return;

      this.#creatingPlayer = false;
      this.#error = new MediaError('Failed to load the Cloudflare Stream SDK', MediaError.MEDIA_ERR_NETWORK);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      this.#loadComplete.resolve();
      return;
    }

    if (this.#isStale(attachId) || this.#target !== target) return;

    if (serverRendered) {
      // A server-rendered embed posted its one `iframeReady` message before the SDK existed; reloading the frame now
      // re-sends it, which only works once the script is in hand.
      const embedSrc = target.src;

      target.src = embedSrc;
    }

    const player = api(target);

    this.#player = player;
    this.#creatingPlayer = false;
    this.#bindPlayerEvents(player, attachId);

    if (this.#pendingLoad) {
      // A source arrived while the SDK was loading, so the embed points at the previous one; only the player can move.
      this.#pendingLoad = false;
      void this.load();
      return;
    }

    this.#settleIfNotPreloading(this.#loadComplete);
  }

  #isDormant() {
    return (
      !this.#activated &&
      shouldDeferCloudflareEmbed({ preload: this.#preload, autoplay: this.#autoplay, controls: this.#controls })
    );
  }

  // Build an embed that was held back by `preload="none"`, once nothing holds it back any more.
  #wake() {
    const target = this.#target;
    if (!target || this.#isDormant() || this.#player || this.#creatingPlayer || target.getAttribute('src')) return;

    this.#beginLoad();
    this.#createPlayer();
  }

  // Whether a callback belongs to a superseded attach; an embed keeps reporting after its player reference is gone.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  #pauseEmbed() {
    tryCall(() => this.#player?.pause());
  }

  // Defer a player call until `loadComplete` resolves, swallowing failures.
  #afterLoad(fn: (player: CloudflareStreamPlayerApi) => void) {
    this.#loadComplete.then(
      () => {
        const player = this.#player;

        if (player) tryCall(() => fn(player));
      },
      () => {}
    );
  }

  // What the next embed must be built muted with; a rebuild drops the player's volume state with the frame.
  get #nextMuted() {
    return this.#defaultMuted || this.#muted;
  }

  // What the embed is told to preload. Playing overrides `preload`, so an embed built or kept for it must not wait to
  // load, or it would report no metadata.
  get #embedPreload() {
    return this.#activated ? 'auto' : this.#preload || CloudflareAdapter.defaultProps.preload;
  }

  #snapshotProps() {
    return {
      autoplay: this.#autoplay || this.#embedPlays,
      defaultMuted: this.#nextMuted,
      loop: this.#loop,
      controls: this.#controls,
      preload: this.#embedPreload,
      poster: this.#poster,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#muted = this.#nextMuted;
    this.#paused = !this.#autoplay;
    this.#ended = false;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#seeking = false;
    this.#loaded = false;
    this.#srcUnsupported = false;
    this.#volume = 1;
    this.#error = null;
    this.#videoWidth = Number.NaN;
    this.#videoHeight = Number.NaN;
    this.#isFullscreen = false;
  }

  #onLoaded() {
    if (this.#loaded) return;

    this.#loaded = true;
    this.#readyState = READY_STATE_HAVE_METADATA;

    const player = this.#player;

    if (player) {
      this.#duration = toDuration(player.duration);
      this.#muted = player.muted;
      this.#volume = player.volume;
      this.#playbackRate = player.playbackRate;
      this.#videoWidth = player.videoWidth;
      this.#videoHeight = player.videoHeight;
    }

    for (const type of ['loadedmetadata', 'durationchange', 'volumechange', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();
  }

  #onError() {
    // The embed reports the failure without a code or message, so all that can be said is that playback stopped.
    this.#error = new MediaError('Cloudflare Stream playback error', MediaError.MEDIA_ERR_CUSTOM, true);
    this.dispatchEvent(new Event('error'));
    // Unblock callers awaiting load so play()/fullscreen don't hang.
    this.#loadComplete.resolve();
  }

  #bindPlayerEvents(player: CloudflareStreamPlayerApi, attachId: number) {
    const listen = (type: string, handle: () => void) => {
      const listener = () => {
        // A cleared or unrecognized source has nothing to report, and acting on the video the embed still holds would
        // put the state just cleared right back.
        if (this.#isStale(attachId) || !this.#hasSource) return;

        handle();
      };

      player.addEventListener(type, listener);
      this.#playerListeners.push([type, listener]);
    };
    // The embed speaks the HTML media vocabulary, so most events are the state they carry plus a re-dispatch.
    const on = (type: string, update?: () => void) =>
      listen(type, () => {
        update?.();
        this.dispatchEvent(new Event(type));
      });

    // `loadedmetadata` is what completes a load, and `#onLoaded` dispatches it.
    listen('loadedmetadata', () => this.#onLoaded());
    on('loadeddata', () => {
      this.#readyState = READY_STATE_HAVE_CURRENT_DATA;
    });
    on('play', () => {
      this.#paused = false;
      this.#ended = false;
    });
    on('playing', () => {
      this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
      this.#paused = false;
    });
    on('pause', () => {
      this.#paused = true;
    });
    on('ended', () => {
      this.#paused = true;
      this.#ended = true;
    });
    on('timeupdate', () => {
      this.#currentTime = player.currentTime;
    });
    on('durationchange', () => {
      this.#duration = toDuration(player.duration);
    });
    on('volumechange', () => {
      this.#volume = player.volume;
      this.#muted = player.muted;
    });
    on('ratechange', () => {
      this.#playbackRate = player.playbackRate;
    });
    on('progress', () => {
      this.#progress = toBufferedEnd(player);
    });
    on('seeking', () => {
      this.#seeking = true;
    });
    on('seeked', () => {
      this.#seeking = false;
      this.#currentTime = player.currentTime;
    });
    on('resize', () => {
      this.#videoWidth = player.videoWidth;
      this.#videoHeight = player.videoHeight;
    });

    for (const type of PASSTHROUGH_EVENTS) on(type);

    listen('error', () => this.#onError());
  }

  #unbindPlayerEvents() {
    for (const [type, listener] of this.#playerListeners) {
      tryCall(() => this.#player?.removeEventListener(type, listener));
    }

    this.#playerListeners.length = 0;
  }
}

// Events that carry no state of their own, including the encrypted-media pair and Cloudflare's ad lifecycle. `emptied`
// and `loadstart` are excluded: the host announces its own load lifecycle, so the embed's copies would double up.
const PASSTHROUGH_EVENTS = [
  'waiting',
  'stalled',
  'suspend',
  'abort',
  'canplay',
  'canplaythrough',
  'encrypted',
  'waitingforkey',
  'stream-adstart',
  'stream-adend',
  'stream-adtimeout',
];

/** The embed reports `0` until it knows the duration; `HTMLMediaElement` reports `NaN`. */
function toDuration(duration: number) {
  return duration > 0 ? duration : Number.NaN;
}

function toBufferedEnd(player: CloudflareStreamPlayerApi) {
  const { buffered } = player;

  return buffered?.length ? buffered.end(buffered.length - 1) : 0;
}

// The part of an embed URL that does not name the video: origin and query. A difference here needs a rebuilt embed,
// which reads its parameters only when it loads; a differing id alone can be swapped on the player.
function embedParamsOf(src: string): string {
  try {
    const url = new URL(src);

    return `${url.origin}${url.search}`;
  } catch {
    // Not a URL yet, so nothing it holds can match what is being built.
    return '';
  }
}

// Whether the embed has already navigated. An iframe just built here has not: navigation starts after the current task,
// leaving it on readable, same-origin `about:blank`.
function hasEmbedNavigated(target: HTMLIFrameElement): boolean {
  const frame = target.contentWindow;
  if (!frame) return false;

  try {
    return frame.location.href !== 'about:blank';
  } catch {
    // Cross-origin, so the embed is already there.
    return true;
  }
}

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_CURRENT_DATA = 2;
const READY_STATE_HAVE_FUTURE_DATA = 3;
