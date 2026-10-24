// Adapted from `twitch-video-element`, reshaped as a v10 media adapter (mirrors `dom/youtube`).
// Source: https://github.com/muxinc/media-elements
// License: MIT

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise } from '@videojs/utils/function';
import { deepEqual } from '@videojs/utils/object';
import { isNumber, isUndefined } from '@videojs/utils/predicate';

import {
  COMMAND_PAUSE,
  COMMAND_PLAY,
  COMMAND_SEEK,
  COMMAND_SET_CHANNEL,
  COMMAND_SET_MUTED,
  COMMAND_SET_VIDEO,
  COMMAND_SET_VOLUME,
  EMBED_NAMESPACE,
  isTwitchMessage,
  PLAYBACK_BUFFERING,
  PLAYBACK_ENDED,
  PLAYBACK_PLAYING,
  PLAYER_PROXY_NAMESPACE,
  TWITCH_PLAYER_ORIGIN,
  type TwitchCommandMessage,
  type TwitchPlaybackState,
  type TwitchPlayerState,
} from './player-api';
import type { TwitchAdapterProps } from './props';
import { buildTwitchIframeSrc, parseTwitchSource, type TwitchSource } from './source';

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 */
export class TwitchAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: TwitchAdapterProps = {
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
  // Listening to the embed is what "having a player" means here; aborting this is the whole teardown.
  #messages: AbortController | null = null;
  // The embed drops every command until it has posted `ready`.
  #playerReady = false;
  // A load was requested before the embed was ready; replay it on `ready`.
  #pendingLoad = false;
  // A rebuilt embed is on its way; the one being replaced can still be talking.
  #rebuilding = false;
  #loadComplete = createPublicPromise<void>();
  // Guards deferred work across attach/detach cycles.
  #attachId = 0;
  // The embed URL currently in the iframe, or `''` when the iframe brought its own.
  #embedSrc = '';

  #src = TwitchAdapter.defaultProps.src;
  #autoplay = TwitchAdapter.defaultProps.autoplay;
  #defaultMuted = TwitchAdapter.defaultProps.defaultMuted;
  #loop = TwitchAdapter.defaultProps.loop;
  #controls = TwitchAdapter.defaultProps.controls;
  #playsInline = TwitchAdapter.defaultProps.playsInline;
  #preload = TwitchAdapter.defaultProps.preload;
  #poster = TwitchAdapter.defaultProps.poster;
  #source: TwitchSource | null = TwitchAdapter.defaultProps.source;

  // Which kind of thing is loaded; a live channel behaves unlike a VOD.
  #kind: 'video' | 'channel' | null = null;
  // Last playback state the embed reported; null until it reports one.
  #playback: TwitchPlaybackState | null = null;
  #paused = true;
  #seeking = false;
  #loaded = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #progress = 0;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  /** Engine this media plays through, reported to analytics such as Mux Data. */
  static readonly engineName: string = 'twitch';

  /** The embed's own window, which every command is posted to. Null until an embed is bound and in a document. */
  get engine(): Window | null {
    return this.#messages ? (this.#target?.contentWindow ?? null) : null;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe hosting the embed. The embed follows once a URL resolves; `load()` retries if none does yet. */
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
    // The `message` listener is on the host window, which outlives the iframe; dropping it silences the embed.
    this.#messages?.abort();
    this.#messages = null;
    this.#playerReady = false;
    this.#pendingLoad = false;
    this.#rebuilding = false;
    this.#embedSrc = '';
    this.#target = null;
    // Unblock callers awaiting load; they re-check the embed (now gone) and no-op.
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
  /** Twitch VOD or channel URL. Setting it re-derives `source`, carrying its embed parameters over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: TwitchSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the single path for storing, deciding on a load, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // The `src` property resolves an empty attribute to the document URL; only the attribute reads as empty.
    return this.#target?.getAttribute('src') ?? '';
  }

  get readyState() {
    return this.#readyState;
  }

  /** Reload the current source, swapping it into the running embed where possible. */
  async load() {
    if (!this.#messages || !this.#playerReady) {
      // Commands are dropped before `ready`; replay the load then. A cleared src replays too, settling the barrier.
      this.#pendingLoad = !!this.#target;

      // A target attached before it had anything to embed: this load is what finally builds it.
      if (this.#target && !this.#messages) {
        // `attach()`'s barrier was settled when there was nothing to embed, so this load needs one of its own.
        const load = this.#beginLoad();

        // The embed URL is built once, so wait a microtask for whatever order the framework sets src and props in.
        await Promise.resolve();

        // A later load took over while waiting; building the embed is its job now.
        if (load !== this.#loadComplete) return;

        // The embed is built from the current source, so `ready` has nothing to replay.
        this.#pendingLoad = false;
        this.#createPlayer();
      }

      return;
    }

    const load = this.#beginLoad();

    // Reset before bailing on an empty src: nothing to load, but the old video's reported state still has to go.
    this.#resetState();
    // `emptied` announces that reset before the empty-src bail: a cleared source is the one case where the embed
    // reports nothing further, stranding listeners on the last video's duration and buffer.
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // Stop the embed too: left running it keeps playing and writes the cleared state straight back.
      load.resolve();
      this.#sendCommand(COMMAND_PAUSE);
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    const parsed = parseTwitchSource(this.#src);

    if (!parsed) {
      this.#error = new MediaError(`Unrecognized Twitch source: ${this.#src}`, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      load.resolve();
      return;
    }

    this.#kind = parsed.kind;
    const nextEmbedSrc = buildTwitchIframeSrc(this.#src, this.#snapshotProps());

    // `SET_VIDEO`/`SET_CHANNEL` swap content without tearing down the embed session; everything else rides on the
    // embed URL, so a changed parameter or an unbuilt URL we cannot compare has to rebuild the iframe.
    if (isContentOnlyChange(this.#embedSrc, nextEmbedSrc)) {
      this.#embedSrc = nextEmbedSrc;

      if (parsed.kind === 'video') this.#sendCommand(COMMAND_SET_VIDEO, `v${parsed.id}`);
      else this.#sendCommand(COMMAND_SET_CHANNEL, parsed.channel);

      return;
    }

    this.#embedSrc = nextEmbedSrc;
    // A rebuilt embed posts `ready` again, which is what completes this load.
    this.#playerReady = false;
    this.#rebuilding = true;

    if (this.#target) this.#target.src = nextEmbedSrc;
  }

  // Take over as the current load; settling the outgoing barrier releases its waiters.
  #beginLoad(): PublicPromise<void> {
    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    return this.#loadComplete;
  }

  get paused() {
    // Until the embed describes itself, our own play()/pause() calls are the only answer there is.
    if (!this.#playback) return this.#paused;

    // Buffering is playing that is waiting; every other state the embed reports is paused.
    return this.#playback !== PLAYBACK_PLAYING && this.#playback !== PLAYBACK_BUFFERING;
  }

  get ended() {
    // A live channel never ends; a stream going away is re-dispatched as `offline` under its own name.
    if (this.#kind === 'channel') return false;

    return this.#playback === PLAYBACK_ENDED;
  }

  get seeking() {
    return this.#seeking;
  }

  async play() {
    await this.#loadComplete;

    // The embed still holds the paused video, so playing it would resume a source that was cleared.
    if (!this.#src) return;

    this.#paused = false;
    this.#sendCommand(COMMAND_PLAY);
  }

  pause() {
    this.#paused = true;
    this.#sendCommand(COMMAND_PAUSE);
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#currentTime = value;
    this.#afterLoad(() => this.#sendCommand(COMMAND_SEEK, value));
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
    // Nothing else announces this: the embed's echo of the level it was told to take reads as unchanged.
    this.dispatchEvent(new Event('volumechange'));
    // The embed takes the same 0–1 range `HTMLMediaElement` does.
    this.#afterLoad(() => this.#sendCommand(COMMAND_SET_VOLUME, value));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    // Announced here for the same reason the level is: the embed's echo of a commanded mute is not a change.
    this.dispatchEvent(new Event('volumechange'));
    this.#afterLoad(() => this.#sendCommand(COMMAND_SET_MUTED, value));
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    // The embed has no rate command, so this is reported back but never applied.
    this.#playbackRate = value;
  }

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
  }

  get loop() {
    return this.#loop;
  }
  set loop(value) {
    // The embed has no loop parameter; the end of a VOD restarts it instead.
    this.#loop = value;
  }

  get controls() {
    return this.#controls;
  }
  set controls(value) {
    // Upstream rebuilds the iframe for this; we don't — losing the session to hide already-covered controls is worse.
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

  /** Twitch VOD or channel URL in `src`, plus embed parameters under `engine.twitch`. Replacing it re-derives `src`. */
  get source(): TwitchSource | null {
    return this.#source;
  }
  set source(value: TwitchSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back is a no-op.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Embed parameters are read when the URL is built, so changing them needs a reload even at the same src.
    const engineChanged = !deepEqual(this.#source?.engine?.twitch ?? null, source?.engine?.twitch ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  get buffered() {
    // `bufferSize` counts seconds buffered *ahead* of the playhead, so the range is anchored to `currentTime`.
    return this.#progress > 0
      ? createTimeRange(this.#currentTime, this.#currentTime + this.#progress)
      : EMPTY_TIME_RANGES;
  }

  get seekable() {
    // A live channel reports an infinite duration and the embed exposes no DVR window to seek within.
    return this.#duration > 0 && Number.isFinite(this.#duration)
      ? createTimeRange(0, this.#duration)
      : EMPTY_TIME_RANGES;
  }

  get error() {
    return this.#error;
  }

  get textTracks() {
    // Captions can only be toggled; the embed never says which tracks exist.
    return EMPTY_TEXT_TRACKS;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  // The embed exposes no fullscreen command, so fullscreen targets the iframe itself.
  async requestFullscreen() {
    // Without an element to request it on nothing entered fullscreen, so the flag must not claim otherwise.
    if (!this.#target?.requestFullscreen) return;

    await this.#target.requestFullscreen();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    const doc = globalThis.document;

    if (doc?.fullscreenElement && doc.fullscreenElement === this.#target) await doc.exitFullscreen();

    this.#isFullscreen = false;
  }

  // Build the embed and listen to it once a source resolves; an unresolvable target settles its load and retries later.
  #createPlayer(): boolean {
    const target = this.#target;
    if (!target || this.#messages) return false;

    // The `src` property resolves an empty attribute to the document URL; only the attribute can spot a placeholder.
    const existingSrc = target.getAttribute('src');

    if (!existingSrc) {
      const initialSrc = buildTwitchIframeSrc(this.#src, this.#snapshotProps());

      // No embed means no `ready` is coming to settle this load.
      if (!initialSrc) {
        this.#loadComplete.resolve();
        return false;
      }

      target.src = initialSrc;
    } else {
      // Twitch refuses to play in a page its `parent` never named, which is what server rendering leaves behind.
      // Nothing else about a URL we did not build is ours to second-guess.
      const withParent = withPageParent(existingSrc);

      if (withParent !== existingSrc) target.src = withParent;
    }

    this.#kind = parseTwitchSource(this.#src)?.kind ?? null;
    // Remembered even when the iframe brought its own URL: a later source change compares against it to swap in place.
    this.#embedSrc = target.getAttribute('src') ?? '';

    const attachId = this.#attachId;

    this.#messages = new AbortController();
    globalThis.addEventListener('message', (event) => void this.#onMessage(event, attachId), {
      signal: this.#messages.signal,
    });

    this.dispatchEvent(new Event('loadstart'));
    return true;
  }

  // Whether deferred work belongs to a superseded attach; the settle delay below outlives a `detach()`.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  // Defer a command until `loadComplete` resolves, dropping it if the embed is gone.
  #afterLoad(fn: () => void) {
    this.#loadComplete.then(
      () => {
        if (!this.#messages) return;

        fn();
      },
      () => {}
    );
  }

  #sendCommand(command: number, params?: unknown) {
    const embedWindow = this.#target?.contentWindow;
    if (!embedWindow) return;

    const message: TwitchCommandMessage = { namespace: PLAYER_PROXY_NAMESPACE, eventName: command, params };

    embedWindow.postMessage(message, TWITCH_PLAYER_ORIGIN);
  }

  // What the next embed must be built muted with: it reads mute once, from its URL, and either property says to start
  // muted. A rebuild drops the player's volume state with the frame.
  get #nextMuted() {
    return this.#defaultMuted || this.#muted;
  }

  #snapshotProps() {
    return {
      autoplay: this.#autoplay,
      defaultMuted: this.#nextMuted,
      loop: this.#loop,
      controls: this.#controls,
      playsInline: this.#playsInline,
      preload: this.#preload || TwitchAdapter.defaultProps.preload,
      source: this.#source,
    };
  }

  #resetState() {
    this.#kind = null;
    this.#playback = null;
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    // Kept across a reset, so a load replayed after `ready` still builds the embed muted.
    this.#muted = this.#nextMuted;
    this.#paused = !this.#autoplay;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#seeking = false;
    this.#loaded = false;
    this.#volume = 1;
    this.#error = null;
    this.#isFullscreen = false;
  }

  async #onMessage(event: MessageEvent, attachId: number) {
    if (this.#isStale(attachId)) return;

    const embedWindow = this.#target?.contentWindow;
    // Any frame on the page can post here, so only the embed we bound is allowed to drive state.
    if (!embedWindow || event.source !== embedWindow) return;

    const { data } = event;
    if (!isTwitchMessage(data)) return;

    if (data.namespace === EMBED_NAMESPACE) {
      // The lifecycle event lands before the snapshot explaining it, so wait for the snapshot before acting.
      await new Promise((resolve) => setTimeout(resolve, STATE_SETTLE_MS));

      // The wait outlives a detach, and the embed it belonged to may be gone.
      if (this.#isStale(attachId)) return;

      this.#onEmbedEvent(data.eventName);
      return;
    }

    if (data.eventName === 'UPDATE_STATE') this.#onUpdateState(data.params ?? {});
  }

  #onEmbedEvent(eventName: string) {
    // Upstream stops listening when the source clears; the iframe is not ours to remove, so it is ignored here.
    // `ready` is the exception: it replays a load the embed could not hear, and clearing the source is such a load.
    if (eventName !== 'ready' && !this.#src) return;

    switch (eventName) {
      case 'ready': {
        this.#playerReady = true;
        this.#rebuilding = false;

        if (this.#pendingLoad) {
          // The embed was built from a stale src; skip its metadata and reload.
          this.#pendingLoad = false;
          void this.load();
          return;
        }

        this.#onLoaded();
        return;
      }
      case 'seek': {
        this.#seeking = true;
        this.dispatchEvent(new Event('seeking'));
        return;
      }
      case 'playing': {
        if (this.#seeking) {
          this.#seeking = false;
          this.dispatchEvent(new Event('seeked'));
        }

        this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
        this.dispatchEvent(new Event('playing'));
        return;
      }
      case 'ended': {
        // Dispatched for a live channel too, as a native element does; only the `ended` *state* refuses to latch.
        this.dispatchEvent(new Event('ended'));

        // No loop parameter and no repeat command, so a repeat is a seek to zero followed by a play.
        if (this.#loop) {
          this.currentTime = 0;
          void this.play();
        }

        return;
      }
      default: {
        // `play`, `pause`, `offline`, `online`, … read as media events under the names the embed already gives them.
        this.dispatchEvent(new Event(eventName));
      }
    }
  }

  // Apply a player state snapshot. The embed sends only what changed, so an absent field means unchanged, not unset.
  #onUpdateState(state: TwitchPlayerState) {
    // An iframe keeps its window across a `src` change, so the outgoing document still describes the old content;
    // the rebuilt embed's `ready` completes this load instead.
    if (this.#rebuilding) return;

    // With no source loaded a snapshot would write the cleared video's time and duration straight back.
    if (!this.#src) return;

    // A swapped embed reports no `ready`, so its first snapshot completes the load — but only after `ready`, since
    // earlier snapshots would release waiting commands into an embed that drops them.
    if (this.#playerReady && !this.#loaded) this.#onLoaded();

    if (state.playback && state.playback !== this.#playback) {
      // No lifecycle event says the embed ran dry, so entering the buffering state is the whole of `waiting`.
      if (state.playback === PLAYBACK_BUFFERING) this.dispatchEvent(new Event('waiting'));

      this.#playback = state.playback;
    }

    // A live channel sends seconds-since-live rather than a length, so `#onLoaded` fixed its duration at Infinity.
    if (this.#kind !== 'channel' && isNumber(state.duration) && state.duration !== this.#duration) {
      this.#duration = state.duration;
      this.dispatchEvent(new Event('durationchange'));
    }

    if (isNumber(state.currentTime) && state.currentTime !== this.#currentTime) {
      this.#currentTime = state.currentTime;
      this.dispatchEvent(new Event('timeupdate'));
    }

    // Only a level or mute differing from what is reported is a change; the rest is an echo the setter announced.
    const volumeChanged = isNumber(state.volume) && state.volume !== this.#volume;
    const mutedChanged = !isUndefined(state.muted) && state.muted !== this.#muted;

    if (volumeChanged || mutedChanged) {
      if (isNumber(state.volume)) this.#volume = state.volume;

      if (!isUndefined(state.muted)) this.#muted = state.muted;

      this.dispatchEvent(new Event('volumechange'));
    }

    const bufferSize = state.stats?.videoStats?.bufferSize;

    if (isNumber(bufferSize) && bufferSize !== this.#progress) {
      this.#progress = bufferSize;

      // Buffer ahead of a playing head is as far as the embed lets us see; it never says the whole thing arrived.
      if (this.#readyState >= READY_STATE_HAVE_FUTURE_DATA && bufferSize > 0) {
        this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;
      }

      this.dispatchEvent(new Event('progress'));
    }
  }

  #onLoaded() {
    if (this.#loaded) return;

    this.#loaded = true;
    this.#readyState = READY_STATE_HAVE_METADATA;
    this.dispatchEvent(new Event('loadedmetadata'));

    if (this.#kind === 'channel') {
      // Live has no end to seek to, so report it as a live `HTMLMediaElement` does rather than await a duration.
      this.#duration = Number.POSITIVE_INFINITY;
      this.dispatchEvent(new Event('durationchange'));
    }

    this.dispatchEvent(new Event('loadcomplete'));
    this.#loadComplete.resolve();
  }
}

// Whether two embed URLs differ only in content, the one change the embed can be commanded through. An unbuilt or
// unparsable URL is no comparison, so it answers no.
function isContentOnlyChange(current: string, next: string): boolean {
  const currentBase = withoutContent(current);
  const nextBase = withoutContent(next);

  return currentBase !== null && currentBase === nextBase;
}

// Name the page in `parent` when the URL does not: the embed refuses to play in a page its ancestors list omits.
function withPageParent(embedSrc: string): string {
  const hostname = globalThis.location?.hostname;
  if (!hostname) return embedSrc;

  let url: URL;

  try {
    url = new URL(embedSrc);
  } catch {
    return embedSrc;
  }

  // Only the embed reads `parent`; an iframe pointed anywhere else is not ours.
  if (url.origin !== TWITCH_PLAYER_ORIGIN) return embedSrc;

  if (url.searchParams.getAll('parent').includes(hostname)) return embedSrc;

  url.searchParams.append('parent', hostname);
  return url.toString();
}

function withoutContent(embedSrc: string): string | null {
  if (!embedSrc) return null;

  try {
    const url = new URL(embedSrc);

    url.searchParams.delete('video');
    url.searchParams.delete('channel');
    return url.toString();
  } catch {
    return null;
  }
}

// A lifecycle event lands before the state behind it, so acting on one waits out this gap; upstream settled on 10ms.
const STATE_SETTLE_MS = 10;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
const READY_STATE_HAVE_ENOUGH_DATA = 4;
