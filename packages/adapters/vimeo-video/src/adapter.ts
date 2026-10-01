import {
  EMPTY_TEXT_TRACKS,
  EMPTY_TIME_RANGES,
  type ErrorLike,
  type MediaContentData,
  MediaError,
  type MediaPreloadType,
  type TextTrackListLike,
  type Video,
} from '@videojs/media';
import { parseVimeoSource } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin, serializeEmbedParams } from '@videojs/media/dom';
import { createPublicPromise, type PublicPromise, tryCall } from '@videojs/utils/function';
import { deepEqual } from '@videojs/utils/object';
import { isNull, isString, isUndefined } from '@videojs/utils/predicate';
import VimeoPlayer, { type LoadVideoOptions, type VimeoEmbedParameters, type VimeoUrl } from '@vimeo/player';

export { type ParsedVimeoSource, parseVimeoSource, parseVimeoVideoId } from '@videojs/media';

export type { default as VimeoPlayerApi } from '@vimeo/player';

/** Vimeo engine options: embed parameters forwarded verbatim to `@vimeo/player` and the embed URL. */
export interface VimeoEngineConfig extends VimeoEmbedParameters {
  /** `referrerpolicy` for the embed iframe. Not a Vimeo embed parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Vimeo source: which source to play, plus how to play it. */
export interface VimeoSource {
  /** Vimeo URL or id. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: VimeoSourceEngineConfig | undefined;
}

/** The engines a Vimeo source can configure. */
export interface VimeoSourceEngineConfig {
  /** Vimeo's own embed parameters, passed through untouched. */
  vimeo?: VimeoEngineConfig | undefined;
}

export interface VimeoAdapterProps {
  src: string;
  autoplay: boolean;
  defaultMuted: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  playsInline: boolean;
  preload: MediaPreloadType;
  poster: string;
  source: VimeoSource | null;
}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 * @fires contentdatachange - Fired when the embed reports a title and when that title is cleared. Read `contentData`
 *   for the new value.
 */
export class VimeoAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: VimeoAdapterProps = {
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
  #player: VimeoPlayer | null = null;
  #playerEventCleanups: (() => void)[] = [];
  // Barrier for the load in progress; its identity also tells a late response whether it still owns the load.
  #loadComplete = createPublicPromise<void>();

  #src = VimeoAdapter.defaultProps.src;
  #autoplay = VimeoAdapter.defaultProps.autoplay;
  #defaultMuted = VimeoAdapter.defaultProps.defaultMuted;
  #loop = VimeoAdapter.defaultProps.loop;
  #controls = VimeoAdapter.defaultProps.controls;
  #playsInline = VimeoAdapter.defaultProps.playsInline;
  #preload = VimeoAdapter.defaultProps.preload;
  #poster = VimeoAdapter.defaultProps.poster;
  #source: VimeoSource | null = VimeoAdapter.defaultProps.source;

  #paused = true;
  #ended = false;
  #seeking = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #progress = 0;
  #videoWidth = Number.NaN;
  #videoHeight = Number.NaN;
  #readyState = READY_STATE_HAVE_NOTHING;
  #title = '';
  #contentData: MediaContentData = {};
  #error: ErrorLike | null = null;
  #isFullscreen = false;
  #isPictureInPicture = false;
  #disablePictureInPicture = false;
  #textTracksHost: HTMLVideoElement | null = null;
  #textTracksDisconnect: AbortController | null = null;

  static PLAYER_SOFTWARE_NAME = 'vimeo-video';

  /** Underlying `@vimeo/player` instance. Null until an embed URL can be resolved, which may be after `attach()`. */
  get engine() {
    return this.#player;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe hosting the embed. The player follows once an embed URL resolves, maybe not until `load()`. */
  attach(target: HTMLIFrameElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#beginLoad();
    this.#createPlayer();
  }

  detach(): void {
    const target = this.#target;
    if (!target) return;

    this.#teardownTextTracks();

    // The SDK keeps event callbacks keyed by iframe even after destroy(), so remove only this adapter's handlers.
    for (const cleanup of this.#playerEventCleanups) cleanup();

    this.#playerEventCleanups.length = 0;

    if (this.#player) {
      // Vimeo removes its iframe synchronously in destroy(). Hide the parent for that call so the SDK releases its
      // player cache and message listener while leaving caller-owned DOM in place.
      const parentNodeDescriptor = Object.getOwnPropertyDescriptor(target, 'parentNode');

      Object.defineProperty(target, 'parentNode', { value: null, configurable: true });

      try {
        this.#player.destroy().catch(() => {});
      } finally {
        if (parentNodeDescriptor) Object.defineProperty(target, 'parentNode', parentNodeDescriptor);
        else Reflect.deleteProperty(target, 'parentNode');
      }

      // Removing the embed URL stops playback in the retained iframe and lets the next attachment rebuild it.
      target.removeAttribute('src');
    }

    this.#player = null;
    this.#target = null;
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
  /** Vimeo URL or id. Setting it re-derives `source`, carrying its embed options over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: VimeoSource = { ...(engine && { engine }), ...(value && { src: value }) };

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

  /** Reload the current source via Vimeo's `loadVideo`; no-op until `attach()`. */
  async load() {
    if (!this.#player) {
      // Nothing to reload without a target, and no load to wait on either.
      if (!this.#target) return;

      // The target attached with nothing to embed; wait a microtask so the one embed URL sees every prop set this task.
      const load = this.#beginLoad();

      this.#resetState();
      await Promise.resolve();

      // A later load took over while waiting; building the embed is its job now.
      if (load !== this.#loadComplete) return;

      this.#createPlayer();
      return;
    }

    const load = this.#beginLoad();

    // Reset before the empty-src bail: a cleared source has nothing to load, but the old video's state still has to go.
    this.#resetState();
    // `emptied` announces that reset, so it precedes the bail; a cleared source is the one case reporting nothing more.
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // Stop the embed too; left running it keeps playing and writes the cleared state back through its own events.
      load.resolve();
      await this.#player.unload().catch(() => {});
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    const loadOptions = toLoadVideoOptions(this.#src, this.#source?.engine?.vimeo);

    // An unparsable src never reaches the player, so no `loaded` will ever settle this load.
    if (!loadOptions) {
      load.resolve();
      return;
    }

    // Vimeo dispatches an `error` event separately on failure.
    await this.#player.loadVideo(loadOptions).catch(() => {});
  }

  // Take over as the current load; settling the outgoing barrier releases its waiters.
  #beginLoad(): PublicPromise<void> {
    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    return this.#loadComplete;
  }

  // Create the player for the attached target, building its embed URL when the target arrived without one.
  // `attach()` can run in a custom element constructor, where a throw breaks the element outright, so an unresolvable
  // target leaves the player null and settles the load. Returns whether a player was created.
  #createPlayer(): boolean {
    const target = this.#target;
    if (!target || this.#player) return false;

    // The `src` property resolves an empty attribute to the document URL, so only the attribute spots a placeholder.
    if (!target.getAttribute('src')) {
      const initialSrc = buildVimeoIframeSrc(this.#src, this.#snapshotProps());

      // No embed means no `loaded` is coming to settle this load.
      if (!initialSrc) {
        this.#loadComplete.resolve();
        return false;
      }

      target.src = initialSrc;
    }

    try {
      this.#player = new VimeoPlayer(target);
    } catch {
      this.#error = new MediaError('The attached iframe is not a Vimeo embed.', MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      this.dispatchEvent(new Event('error'));
      this.#loadComplete.resolve();
      return false;
    }

    this.#bindPlayerEvents(this.#player);
    this.#setupTextTracks(this.#player);
    this.dispatchEvent(new Event('loadstart'));
    return true;
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
    await this.#player?.play();
  }

  pause() {
    void this.#player?.pause().catch(() => {});
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#currentTime = value;
    this.#afterLoad((p) => p.setCurrentTime(value));
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
    this.#afterLoad((p) => p.setVolume(value));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.#afterLoad((p) => p.setMuted(value));
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.#afterLoad((p) => p.setPlaybackRate(value));
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
    this.#loop = value;
    this.#afterLoad((p) => p.setLoop(value));
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

  /** Structured source: `src` plus embed options under `engine.vimeo`. Replacing it re-derives `src`. */
  get source(): VimeoSource | null {
    return this.#source;
  }
  set source(value: VimeoSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Embed options are read at load time, so changing them needs a reload even when the URL is unchanged.
    const engineChanged = !deepEqual(this.#source?.engine?.vimeo ?? null, source?.engine?.vimeo ?? null);

    this.#source = source;
    this.#src = src;

    if (srcChanged || engineChanged) void this.load();

    // Assigning is always a source change, so it is always announced.
    this.dispatchEvent(new Event('sourcechange'));
  }

  /**
   * Metadata Vimeo reports about the loaded video, keyed by what it is — `title` for now. Unlike a Mux source, none of
   * it can be derived from `src`; the embed has to report it, so the key is absent until then and empties again across
   * a source change. `contentdatachange` announces both.
   */
  get contentData(): MediaContentData {
    return this.#contentData;
  }

  /**
   * Store the title the embed reported, reporting whether the content data changed. Announcing is left to the caller,
   * which knows when the rest of what it is writing is in step.
   *
   * Vimeo cannot tell "no title yet" from "the title is blank" — a failed read falls back to the current value — and a
   * blank would read as a deliberate one, stopping a consumer's fallback chain. So an empty title is reported as an
   * absent key rather than an empty string.
   */
  #setTitle(value: string): boolean {
    if (this.#title === value) return false;

    this.#title = value;
    this.#contentData = value ? { title: value } : {};
    return true;
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

  async requestFullscreen() {
    await this.#loadComplete;
    await this.#player?.requestFullscreen?.();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    await this.#loadComplete;
    await this.#player?.exitFullscreen?.();
    this.#isFullscreen = false;
  }

  get isPictureInPicture() {
    return this.#isPictureInPicture;
  }

  get disablePictureInPicture() {
    return this.#disablePictureInPicture;
  }
  set disablePictureInPicture(value) {
    this.#disablePictureInPicture = value;
  }

  async requestPictureInPicture() {
    await this.#loadComplete;
    await this.#player?.requestPictureInPicture?.().then(() => {
      this.#isPictureInPicture = true;
    }, console.error);
  }

  async exitPictureInPicture() {
    await this.#loadComplete;
    await this.#player?.exitPictureInPicture?.().then(() => {
      this.#isPictureInPicture = false;
    }, console.error);
  }

  // Defer a player call until the load settles, swallowing rejections.
  #afterLoad(fn: (player: VimeoPlayer) => Promise<unknown>) {
    this.#loadComplete.then(
      () => this.#player && void fn(this.#player).catch(() => {}),
      () => {}
    );
  }

  #snapshotProps() {
    return {
      autoplay: this.#autoplay,
      defaultMuted: this.#defaultMuted,
      loop: this.#loop,
      controls: this.#controls,
      playsInline: this.#playsInline,
      preload: this.#preload || VimeoAdapter.defaultProps.preload,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#muted = false;
    this.#paused = !this.#autoplay;
    this.#ended = false;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#seeking = false;
    this.#volume = 1;
    this.#error = null;
    this.#videoWidth = Number.NaN;
    this.#videoHeight = Number.NaN;
    this.#isFullscreen = false;
    this.#isPictureInPicture = false;

    // Last, and apart from the plain assignments above: this one announces, and
    // a listener reading a half-reset media would still see the old video.
    if (this.#setTitle('')) this.dispatchEvent(new Event('contentdatachange'));
  }

  async #onLoaded() {
    const load = this.#loadComplete;

    this.#readyState = READY_STATE_HAVE_METADATA;

    const player = this.#player;
    let contentDataChanged = false;

    if (player) {
      // Each value falls back to the current one so a single failure isn't fatal.
      const [muted, volume, duration, title] = await Promise.all([
        player.getMuted().catch(() => this.#muted),
        player.getVolume().catch(() => this.#volume),
        player.getDuration().catch(() => this.#duration),
        player.getVideoTitle().catch(() => this.#title),
      ]);

      // A source change or clear invalidates these reads; #beginLoad settled this load, its replacement settles itself.
      if (load !== this.#loadComplete) return;

      this.#muted = muted;
      this.#volume = volume;
      this.#duration = duration;
      contentDataChanged = this.#setTitle(title);
    }

    if (contentDataChanged) this.dispatchEvent(new Event('contentdatachange'));

    for (const type of ['loadedmetadata', 'durationchange', 'volumechange', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    load.resolve();
  }

  #bindPlayerEvents(player: VimeoPlayer) {
    const emit = (type: string) => this.dispatchEvent(new Event(type));
    const on: VimeoPlayer['on'] = (type, handler) => {
      player.on(type, handler);
      this.#playerEventCleanups.push(() => player.off(type, handler));
    };

    on('loaded', () => this.#onLoaded());
    on('bufferstart', () => emit('waiting'));
    on('play', () => {
      this.#paused = false;
      emit('play');
    });
    on('playing', () => {
      this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
      this.#paused = false;
      emit('playing');
    });
    on('seeking', () => {
      this.#seeking = true;
      emit('seeking');
    });
    on('seeked', () => {
      this.#seeking = false;
      emit('seeked');
    });
    on('pause', () => {
      this.#paused = true;
      emit('pause');
    });
    on('ended', () => {
      this.#paused = true;
      this.#ended = true;
      emit('ended');
    });
    on('playbackratechange', ({ playbackRate }) => {
      this.#playbackRate = playbackRate;
      emit('ratechange');
    });
    on('volumechange', ({ volume }) => {
      this.#volume = volume;
      emit('volumechange');
    });
    on('durationchange', ({ duration }) => {
      this.#duration = duration;
      emit('durationchange');
    });
    on('timeupdate', ({ seconds, duration }) => {
      this.#currentTime = seconds;

      if (Number.isFinite(duration) && duration !== this.#duration) this.#duration = duration;

      emit('timeupdate');
    });
    on('progress', ({ seconds }) => {
      this.#progress = seconds;
      emit('progress');
    });
    on('resize', ({ videoWidth, videoHeight }) => {
      this.#videoWidth = videoWidth;
      this.#videoHeight = videoHeight;
      emit('resize');
    });
    on('fullscreenchange', ({ fullscreen }) => {
      this.#isFullscreen = fullscreen;
      emit('fullscreenchange');
    });
    on('enterpictureinpicture', () => {
      this.#isPictureInPicture = true;
      emit('enterpictureinpicture');
    });
    on('leavepictureinpicture', () => {
      this.#isPictureInPicture = false;
      emit('leavepictureinpicture');
    });
    on('error', () => {
      this.#error = { code: 1, message: 'Vimeo playback error' };
      emit('error');
      // Unblock callers awaiting load so play()/fullscreen/PiP don't hang.
      this.#loadComplete.resolve();
    });
  }

  #setupTextTracks(player: VimeoPlayer) {
    const doc = globalThis.document;
    if (isUndefined(doc)) return;

    this.#teardownTextTracks();
    const host = doc.createElement('video');

    this.#textTracksHost = host;
    player
      .getTextTracks()
      .then((tracks) => {
        for (const track of tracks) {
          if (!isString(track.kind) || isNull(track.kind)) continue;

          tryCall(() => host.addTextTrack?.(track.kind as TextTrackKind, track.label ?? '', track.language ?? ''));
        }
      })
      .catch(() => {});
    this.#textTracksDisconnect = new AbortController();
    host.textTracks?.addEventListener?.(
      'change',
      () => {
        const showing = Array.from(host.textTracks).find((t) => t.mode === 'showing');

        if (showing) player.enableTextTrack(showing.language, showing.kind).catch(() => {});
        else player.disableTextTrack().catch(() => {});
      },
      { signal: this.#textTracksDisconnect.signal }
    );
  }

  #teardownTextTracks() {
    this.#textTracksDisconnect?.abort();
    this.#textTracksDisconnect = null;
    this.#textTracksHost = null;
  }
}

/**
 * Build the iframe `src` URL for an initial Vimeo embed from the given props.
 *
 * @internal
 */
export function buildVimeoIframeSrc(src: string, props: Partial<VimeoAdapterProps> = {}) {
  const parsed = parseVimeoSource(src);
  if (!parsed) return '';

  const params: Record<string, unknown> = {
    // Hide Vimeo chrome by default; pass nothing only when controls is explicitly true.
    controls: props.controls === true ? null : 0,
    autoplay: props.autoplay,
    loop: props.loop,
    muted: props.defaultMuted,
    playsinline: props.playsInline ?? VimeoAdapter.defaultProps.playsInline,
    preload: props.preload ?? VimeoAdapter.defaultProps.preload,
    transparent: false,
    h: parsed.hash,
    // Vimeo-specific knobs (`autopause`, `byline`, `dnt`, …) flow through here.
    ...(props.source?.engine?.vimeo ?? undefined),
  };

  if (parsed.kind === 'event') {
    const hashPath = parsed.hash ? `/${parsed.hash}` : '';

    delete params.h;
    return `${EMBED_EVENT_BASE}/${parsed.id}/embed${hashPath}?${serializeEmbedParams(params)}`;
  }

  return `${EMBED_VIDEO_BASE}/${parsed.id}?${serializeEmbedParams(params)}`;
}

const EMBED_VIDEO_BASE = 'https://player.vimeo.com/video';
const EMBED_EVENT_BASE = 'https://vimeo.com/event';

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;

function toLoadVideoOptions(src: string, vimeo?: VimeoEngineConfig) {
  const parsed = parseVimeoSource(src);
  if (!parsed) return null;

  const base = parsed.kind === 'event' ? `${EMBED_EVENT_BASE}/${parsed.id}/embed` : `${EMBED_VIDEO_BASE}/${parsed.id}`;
  const url = `${base}${parsed.hash ? `?h=${parsed.hash}` : ''}` as VimeoUrl;

  return { url, ...vimeo } as LoadVideoOptions;
}
