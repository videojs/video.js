// Adapted from `youtube-video-element` in `muxinc/media-elements` (MIT), ported to
// TypeScript and reshaped as a media adapter (mirrors `dom/vimeo`).
// Source: https://github.com/muxinc/media-elements

import { EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES, MediaError, type TextTrackListLike, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, noop, type PublicPromise, tryCall } from '@videojs/utils/function';
import { deepEqual } from '@videojs/utils/object';
import { isNumber, isUndefined } from '@videojs/utils/predicate';

import {
  loadYouTubeApi,
  STATE_BUFFERING,
  STATE_ENDED,
  STATE_PAUSED,
  STATE_PLAYING,
  STATE_UNSTARTED,
  type YouTubeApi,
  type YouTubeCaptionTrack,
  type YouTubePlayerApi,
  youtubeErrorCodeToMediaErrorCode,
} from './iframe-api';
import type { YouTubeAdapterProps } from './props';
import { buildYouTubeIframeSrc, parseYouTubeSource, type YouTubeSource } from './source';

const SEEK_TOLERANCE = 1;
const SEEK_SETTLE_TIMEOUT = 1_000;

type PlayerSetting = 'volume' | 'muted' | 'playbackRate';

const PLAYER_SETTINGS: readonly PlayerSetting[] = ['volume', 'muted', 'playbackRate'];

export class YouTubeAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: YouTubeAdapterProps = {
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
  #player: YouTubePlayerApi | null = null;
  // The iframe API rejects `cueVideoById`/`loadVideoById` before `onReady`.
  #playerReady = false;
  // A load was requested before the player was ready; replay it on `onReady`.
  #pendingLoad = false;
  // Player creation is in flight; the API load makes it span more than a tick.
  #creatingPlayer = false;
  // Keep URL-only option changes pending until a valid source can rebuild the embed.
  #pendingEmbedOptions = false;
  // Settings to apply to a replacement player before it reports its own.
  #restoreSettings: ReadonlySet<PlayerSetting> = new Set();
  // Settings written through setters since attach; before a player reports, only these are real.
  #writtenSettings = new Set<PlayerSetting>();
  // Cached settings mirror a player only after one reported them; before that they are defaults.
  #playerSettingsRead = false;
  // Counts embed recreations, so a pending `play()` follows the replacement rather than a superseding load.
  #recreations = 0;
  #pendingWrites: ((player: YouTubePlayerApi) => void)[] = [];
  #loadComplete = createPublicPromise<void>();
  // Guards async player creation across attach/detach cycles.
  #attachId = 0;

  #src = YouTubeAdapter.defaultProps.src;
  #autoplay = YouTubeAdapter.defaultProps.autoplay;
  #defaultMuted = YouTubeAdapter.defaultProps.defaultMuted;
  #loop = YouTubeAdapter.defaultProps.loop;
  #controls = YouTubeAdapter.defaultProps.controls;
  #playsInline = YouTubeAdapter.defaultProps.playsInline;
  #preload = YouTubeAdapter.defaultProps.preload;
  #poster = YouTubeAdapter.defaultProps.poster;
  #source: YouTubeSource | null = YouTubeAdapter.defaultProps.source;

  #paused = true;
  #ended = false;
  #seeking = false;
  #seekTarget: number | null = null;
  #seekOrigin: number | null = null;
  #seekStartedAt = 0;
  #loaded = false;
  #playFired = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #progress = 0;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;
  #pollInterval: ReturnType<typeof setInterval> | null = null;
  #textTracksHost: HTMLVideoElement | null = null;
  #textTracksDisconnect: AbortController | null = null;

  static PLAYER_SOFTWARE_NAME = 'youtube-video';

  /** Underlying YouTube iframe API player instance (null until the API loads). */
  get engine() {
    return this.#player;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /**
   * Bind the iframe hosting the embed. The player follows once an embed URL can be resolved, which may not be now: an
   * iframe attached before `src` is set is picked up by the next `load()`.
   */
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
    this.#stopPolling();
    this.#teardownTextTracks();
    tryCall(() => this.#player?.destroy());
    this.#player = null;
    this.#playerReady = false;
    this.#pendingLoad = false;
    this.#creatingPlayer = false;
    this.#restoreSettings = new Set();
    this.#writtenSettings = new Set();
    this.#playerSettingsRead = false;
    this.#pendingWrites = [];
    this.#target = null;
    // Unblock callers awaiting load; they re-check `#player` (now null) and no-op.
    this.#loadComplete.resolve();
    this.#resetState();
    this.#volume = 1;
    this.#muted = false;
    this.#playbackRate = 1;
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  get src() {
    return this.#src;
  }
  /** YouTube URL or id. Setting it re-derives `source`, carrying its player parameters over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: YouTubeSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // The `source` setter is the one path for storing, loading, and announcing a source.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  get currentSrc() {
    // The `src` property resolves an empty attribute to the document URL; only the attribute reads empty.
    return this.#target?.getAttribute('src') ?? '';
  }

  get readyState() {
    return this.#readyState;
  }

  /** Reload the current source via the iframe API; deferred until the player is ready. */
  async load() {
    if (!this.#player || !this.#playerReady) {
      // Loading before `onReady` fails, so replay it there. A cleared src replays too, settling the barrier.
      this.#pendingLoad = !!this.#target;

      // A target attached with nothing to embed yet: this load is what finally builds it.
      if (this.#target && !this.#player && !this.#creatingPlayer) {
        // `attach()` settled its barrier when there was nothing to embed, so `play()` needs a new one.
        const load = this.#beginLoad();

        // Wait a microtask so the one-shot embed URL sees every prop a framework set alongside `src`.
        await Promise.resolve();

        // A later load took over while waiting; building the embed is its job now.
        if (load !== this.#loadComplete) return;

        this.#createPlayer();
      }

      return;
    }

    const load = this.#beginLoad();

    // Reset and announce before the empty-src bail: a cleared source reports nothing further, so
    // anything listening would keep the last video's duration and buffer forever.
    this.#resetState();
    this.dispatchEvent(new Event('emptied'));

    if (!this.#src) {
      // Stop the embed too; left running it keeps playing and the poll rewrites the cleared state.
      load.resolve();
      this.#stopPolling();
      tryCall(() => this.#player?.stopVideo());
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    const parsed = parseYouTubeSource(this.#src);

    if (!parsed) {
      this.#error = new MediaError(`Unrecognized YouTube source: ${this.#src}`, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      load.resolve();
      return;
    }

    if (parsed.kind === 'playlist' && parsed.listId) {
      const options = { list: parsed.listId, listType: 'playlist' };

      if (this.#autoplay) this.#player.loadPlaylist(options);
      else this.#player.cuePlaylist(options);
    } else if (parsed.id) {
      const options: { videoId: string; startSeconds?: number } = { videoId: parsed.id };

      if (parsed.startTime != null) options.startSeconds = parsed.startTime;

      if (this.#autoplay) this.#player.loadVideoById(options);
      else this.#player.cueVideoById(options);
    }
  }

  // Take over as the current load; settling the outgoing barrier releases its waiters, and every
  // exit from `load()` settles the barrier it was handed.
  #beginLoad(): PublicPromise<void> {
    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    this.#flushAfterLoad();
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
    let recreations: number;

    // Recreating the embed replaces the load barrier; follow it to the replacement player.
    do {
      recreations = this.#recreations;
      await this.#loadComplete;
    } while (recreations !== this.#recreations && this.#target);

    // The embed still holds the stopped video, so playing it would resume a cleared source.
    if (!this.#src) return;

    this.#player?.playVideo();
  }

  pause() {
    this.#player?.pauseVideo();
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    if (this.#currentTime === value) return;

    this.#currentTime = value;
    // `seekTo` keeps the player paused when called from a paused state.
    this.#afterLoad((p) => {
      this.#seekTarget = value;
      this.#seekOrigin = p.getCurrentTime();
      this.#seekStartedAt = Date.now();

      if (!this.#seeking) {
        this.#seeking = true;
        this.dispatchEvent(new Event('seeking'));
      }

      p.seekTo(value, true);
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
    this.#writtenSettings.add('volume');
    this.#afterLoad((p) => p.setVolume(value * 100));
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.#writtenSettings.add('muted');
    this.#afterLoad((p) => (value ? p.mute() : p.unMute()));
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value) return;

    this.#playbackRate = value;
    this.#writtenSettings.add('playbackRate');
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
    // The iframe API has no single-video loop; ENDED restarts playback instead.
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

  /** YouTube URL or id in `src`, plus player parameters under `engine.youtube`. Replacing it re-derives `src`. */
  get source(): YouTubeSource | null {
    return this.#source;
  }
  set source(value: YouTubeSource | null) {
    const source = value ?? null;
    // Any change takes a new object, so handing the same one back is a no-op.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    const srcChanged = this.#src !== src;
    // Player parameters are read from the embed URL, not by `cueVideoById`/`loadVideoById`.
    const engineChanged = !deepEqual(this.#source?.engine?.youtube ?? null, source?.engine?.youtube ?? null);

    this.#pendingEmbedOptions ||= engineChanged;

    this.#source = source;
    this.#src = src;

    const target = this.#target;
    const embedSrc =
      this.#pendingEmbedOptions && target?.getAttribute('src') ? buildYouTubeIframeSrc(src, this.#snapshotProps()) : '';

    if (target && embedSrc) {
      // `destroy()` removes the iframe, so keep the host's target in its original position.
      const parent = target.parentNode;
      const nextSibling = target.nextSibling;
      const volume = this.#volume;
      const muted = this.#muted;
      const playbackRate = this.#playbackRate;
      const pendingWrites = this.#pendingWrites;
      const playerSettingsRead = this.#playerSettingsRead;
      const writtenSettings = this.#writtenSettings;
      // Before a player reports its settings, only values written through setters are real.
      const restoreSettings = new Set<PlayerSetting>(playerSettingsRead ? PLAYER_SETTINGS : writtenSettings);

      this.detach();
      target.src = embedSrc;
      this.#pendingEmbedOptions = false;
      parent?.insertBefore(target, nextSibling);
      this.#target = target;
      this.#volume = volume;
      this.#muted = muted;
      this.#playbackRate = playbackRate;
      this.#restoreSettings = restoreSettings;
      this.#writtenSettings = writtenSettings;
      this.#playerSettingsRead = playerSettingsRead;
      this.#pendingWrites = pendingWrites;
      this.#recreations++;

      this.#beginLoad();
      this.dispatchEvent(new Event('emptied'));
      this.#createPlayer();
    } else if (srcChanged || engineChanged) {
      void this.load();
    }

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

  get textTracks() {
    this.#textTracksHost ??= globalThis.document?.createElement('video') ?? null;
    return (this.#textTracksHost?.textTracks as TextTrackListLike) ?? EMPTY_TEXT_TRACKS;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  // The iframe API exposes no fullscreen controls, so fullscreen targets the iframe itself.
  async requestFullscreen() {
    // With no element to request it on, nothing entered fullscreen and the flag must not say otherwise.
    if (!this.#target?.requestFullscreen) return;

    await this.#target.requestFullscreen();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    const doc = globalThis.document;

    if (doc?.fullscreenElement && doc.fullscreenElement === this.#target) await doc.exitFullscreen();

    this.#isFullscreen = false;
  }

  // Build the embed and start player creation, returning whether it started. The iframe API only talks
  // to an iframe that already holds an embed, so an unresolvable target settles its load and retries later.
  #createPlayer(): boolean {
    const target = this.#target;
    if (!target || this.#player || this.#creatingPlayer) return false;

    // Only the attribute tells an embed apart from a placeholder; `src` resolves empty to the document URL.
    if (!target.getAttribute('src') || this.#pendingEmbedOptions) {
      const initialSrc = buildYouTubeIframeSrc(this.#src, this.#snapshotProps());

      // No embed means no player is coming to settle this load.
      if (!initialSrc) {
        this.#loadComplete.resolve();
        return false;
      }

      target.src = initialSrc;
    }

    this.#pendingEmbedOptions = false;
    this.#creatingPlayer = true;
    this.dispatchEvent(new Event('loadstart'));
    void this.#createPlayerApi(target);
    return true;
  }

  async #createPlayerApi(target: HTMLIFrameElement) {
    const attachId = this.#attachId;
    let api: YouTubeApi;

    try {
      api = await loadYouTubeApi();
    } catch {
      // A failed API load belongs to the attach that started it; a newer one must not be marked failed.
      if (this.#isStale(attachId)) return;

      this.#creatingPlayer = false;
      this.#error = new MediaError('Failed to load the YouTube iframe API', MediaError.MEDIA_ERR_NETWORK);
      this.dispatchEvent(new Event('error'));
      // Unblock callers awaiting load so play()/fullscreen don't hang.
      this.#loadComplete.resolve();
      return;
    }

    if (this.#isStale(attachId) || this.#target !== target) return;

    const player = new api.Player(target, {
      events: {
        onReady: () => {
          if (this.#isStale(attachId)) return;

          this.#onPlayerReady();
        },
        onError: (event) => {
          if (this.#isStale(attachId)) return;

          this.#onError(event.data);
        },
      },
    });

    this.#player = player;
    this.#creatingPlayer = false;
    this.#bindPlayerEvents(player, attachId);
    this.#setupTextTracks(player);
  }

  // Whether a callback belongs to a superseded attach: `destroy()` does not stop the iframe API from
  // running callbacks it already scheduled, so a player's reports must match its attach to touch state.
  #isStale(attachId: number) {
    return attachId !== this.#attachId;
  }

  // Defer a player call until `loadComplete` resolves, swallowing failures.
  #afterLoad(fn: (player: YouTubePlayerApi) => void) {
    this.#pendingWrites.push(fn);
    this.#flushAfterLoad();
  }

  #flushAfterLoad() {
    const load = this.#loadComplete;

    load.then(() => {
      // Only the latest load may drain the queue, preserving the order of writes across replacement.
      if (load !== this.#loadComplete) return;

      const player = this.#player;
      if (!player) return;

      while (load === this.#loadComplete && player === this.#player) {
        const write = this.#pendingWrites.shift();
        if (!write) break;

        tryCall(() => write(player));
      }
    }, noop);
  }

  #snapshotProps() {
    return {
      autoplay: this.#autoplay,
      defaultMuted: this.#defaultMuted,
      loop: this.#loop,
      controls: this.#controls,
      playsInline: this.#playsInline,
      preload: this.#preload || YouTubeAdapter.defaultProps.preload,
      source: this.#source,
    };
  }

  #resetState() {
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#paused = !this.#autoplay;
    this.#ended = false;
    this.#progress = 0;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#seeking = false;
    this.#seekTarget = null;
    this.#seekOrigin = null;
    this.#seekStartedAt = 0;
    this.#loaded = false;
    this.#playFired = false;
    this.#error = null;
    this.#isFullscreen = false;
  }

  #onPlayerReady() {
    this.#playerReady = true;

    const player = this.#player;
    const restore = this.#restoreSettings;

    if (restore.size && player) {
      // Restore before metadata reads the replacement player's default settings.
      const volume = this.#volume;
      const muted = this.#muted;
      const playbackRate = this.#playbackRate;

      this.#restoreSettings = new Set();
      tryCall(() => {
        if (restore.has('volume')) player.setVolume(volume * 100);

        if (restore.has('muted')) {
          if (muted) player.mute();
          else player.unMute();
        }

        if (restore.has('playbackRate')) player.setPlaybackRate(playbackRate);
      });
    }

    if (this.#pendingLoad) {
      // The iframe was built from a stale src; skip its metadata and reload. The post-cue state
      // change completes that load (see `#bindPlayerEvents`).
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

    const player = this.#player;

    if (player) {
      this.#duration = player.getDuration() || Number.NaN;
      this.#muted = player.isMuted();
      this.#volume = player.getVolume() / 100;
      this.#playbackRate = player.getPlaybackRate();
      this.#playerSettingsRead = true;
    }

    for (const type of ['loadedmetadata', 'durationchange', 'volumechange', 'loadcomplete']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();
    this.#startPolling();
  }

  #onError(code: number) {
    const error = new MediaError(
      `YouTube iframe player error #${code}; visit https://developers.google.com/youtube/iframe_api_reference#onError for the full error message.`,
      youtubeErrorCodeToMediaErrorCode[code] ?? MediaError.MEDIA_ERR_CUSTOM,
      true
    );

    error.data = { youtubeErrorCode: code };
    this.#error = error;
    this.dispatchEvent(new Event('error'));
    // Unblock callers awaiting load so play()/fullscreen don't hang.
    this.#loadComplete.resolve();
  }

  #bindPlayerEvents(player: YouTubePlayerApi, attachId: number) {
    const emit = (type: string) => this.dispatchEvent(new Event(type));

    player.addEventListener('onStateChange', ({ data: state }) => {
      if (this.#isStale(attachId)) return;

      // Later loads never re-fire `onReady`, so a post-load transition completes them. With no src there
      // is no load to complete, and completing on the transition `stopVideo()` reports would undo the reset.
      if (this.#src && !this.#loaded && state !== STATE_UNSTARTED) this.#onLoaded();

      if (state === STATE_PLAYING || state === STATE_BUFFERING) {
        if (!this.#playFired) {
          this.#playFired = true;
          this.#paused = false;
          this.#ended = false;
          emit('play');
        }

        this.#syncTextTracks(player);
      }

      if (state === STATE_BUFFERING) {
        emit('waiting');
      } else if (state === STATE_PLAYING) {
        if (this.#seeking && this.#seekTarget === null) {
          this.#seeking = false;
          emit('seeked');
        }

        this.#readyState = READY_STATE_HAVE_FUTURE_DATA;
        this.#paused = false;
        emit('playing');
      } else if (state === STATE_PAUSED) {
        const diff = Math.abs(player.getCurrentTime() - this.#currentTime);

        if (!this.#seeking && diff > 0.1) {
          this.#seeking = true;
          emit('seeking');
        }

        this.#playFired = false;
        this.#paused = true;
        emit('pause');
      } else if (state === STATE_ENDED) {
        this.#playFired = false;
        this.#paused = true;
        emit('pause');
        this.#ended = true;
        emit('ended');

        if (this.#loop) void this.play();
      }
    });

    player.addEventListener('onPlaybackRateChange', () => {
      if (this.#isStale(attachId)) return;

      this.#playbackRate = player.getPlaybackRate();
      emit('ratechange');
    });

    player.addEventListener('onVolumeChange', () => {
      if (this.#isStale(attachId)) return;

      this.#volume = player.getVolume() / 100;
      this.#muted = player.isMuted();
      emit('volumechange');
    });
  }

  // The iframe API pushes no timeupdate/progress/seek events, so poll like `youtube-video-element` does.
  #startPolling() {
    this.#stopPolling();
    this.#pollInterval = setInterval(() => this.#poll(), 50);
  }

  #stopPolling() {
    if (this.#pollInterval !== null) {
      clearInterval(this.#pollInterval);
      this.#pollInterval = null;
    }
  }

  #hasAppliedSeek(time: number) {
    const target = this.#seekTarget;
    const origin = this.#seekOrigin;
    if (target === null || origin === null) return false;

    // YouTube can report coarse clock samples or land on a nearby keyframe. Give a matching origin
    // time a chance to change before accepting it as the final position of a short or no-op seek.
    const clockSettled = time !== origin || Date.now() - this.#seekStartedAt >= SEEK_SETTLE_TIMEOUT;

    return clockSettled && Math.abs(time - target) <= SEEK_TOLERANCE;
  }

  #poll() {
    const player = this.#player;
    if (!player) return;

    const time = player.getCurrentTime();
    const duration = player.getDuration();
    const bufferedEnd = player.getVideoLoadedFraction() * duration;
    const wasSeeking = this.#seeking;
    const appliedSeek = this.#hasAppliedSeek(time);

    if (!wasSeeking && player.getPlayerState() !== STATE_PLAYING && Math.abs(time - this.#currentTime) > 0.1) {
      this.#seeking = true;
      this.dispatchEvent(new Event('seeking'));
    }

    // Preserve the requested time until YouTube's clock catches up with a programmatic seek.
    if ((this.#seekTarget === null || appliedSeek) && time !== this.#currentTime) {
      this.#currentTime = time;
      this.dispatchEvent(new Event('timeupdate'));
    }

    if (wasSeeking && (appliedSeek || (this.#seekTarget === null && bufferedEnd > 0.1))) {
      this.#seeking = false;
      this.#seekTarget = null;
      this.#seekOrigin = null;
      this.#seekStartedAt = 0;
      this.dispatchEvent(new Event('seeked'));
    }

    if (isNumber(duration) && duration > 0 && duration !== this.#duration) {
      this.#duration = duration;
      this.dispatchEvent(new Event('durationchange'));
    }

    if (bufferedEnd !== this.#progress) {
      this.#progress = bufferedEnd;

      if (duration > 0 && bufferedEnd >= duration) {
        this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;
      }

      this.dispatchEvent(new Event('progress'));
    }
  }

  #setupTextTracks(player: YouTubePlayerApi) {
    const doc = globalThis.document;
    if (isUndefined(doc)) return;

    this.#teardownTextTracks();
    const host = doc.createElement('video');

    this.#textTracksHost = host;
    this.#textTracksDisconnect = new AbortController();
    host.textTracks?.addEventListener?.(
      'change',
      () => {
        const showing = Array.from(host.textTracks).find((t) => t.mode === 'showing');

        tryCall(() => player.setOption('captions', 'track', showing ? { languageCode: showing.language } : {}));
      },
      { signal: this.#textTracksDisconnect.signal }
    );
  }

  // Caption metadata is only available once playback starts.
  #syncTextTracks(player: YouTubePlayerApi) {
    const host = this.#textTracksHost;
    if (!host) return;

    const trackList = (player.getOption('captions', 'tracklist') ?? []) as YouTubeCaptionTrack[];

    for (const track of trackList) {
      if (!track.languageCode) continue;

      if (Array.from(host.textTracks).some((t) => t.language === track.languageCode)) continue;

      // Throws in jsdom and other environments without text-track support.
      tryCall(() => host.addTextTrack?.('subtitles', track.displayName ?? '', track.languageCode));
    }
  }

  #teardownTextTracks() {
    this.#textTracksDisconnect?.abort();
    this.#textTracksDisconnect = null;
    this.#textTracksHost = null;
  }
}

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_FUTURE_DATA = 3;
const READY_STATE_HAVE_ENOUGH_DATA = 4;
