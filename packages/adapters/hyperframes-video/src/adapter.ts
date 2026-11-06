// Plays a HyperFrames composition through the HyperFrames runtime, driven over its postMessage bridge
// (`runtime-api.ts`). Inline markup is written into a same-origin frame and the runtime injected after it, the late
// injection `@hyperframes/player` falls back to; a composition document gets the runtime first in its head instead.

import { MediaError, NO_TIME_RANGES_YET, type Video } from '@videojs/media';
import { createTimeRange, MediaPlayedRangesMixin } from '@videojs/media/dom';
import { createPublicPromise, tryCall } from '@videojs/utils/function';
import { clamp } from '@videojs/utils/number';
import { isFunction, isString } from '@videojs/utils/predicate';

import type { HyperFramesAdapterProps } from './props';
import {
  createRuntimeControl,
  DEFAULT_RUNTIME_FPS,
  fpsToNumber,
  parseRuntimeMessage,
  type RuntimeControlAction,
  type RuntimeFps,
  type RuntimeStateMessage,
} from './runtime-api';
import {
  buildCompositionDocument,
  buildInlineDocument,
  DEFAULT_COMPOSITION_HEIGHT,
  DEFAULT_COMPOSITION_WIDTH,
  DEFAULT_RUNTIME_SRC,
  getMountContainer,
  getSourceKind,
  getSourceSrc,
  type HyperFramesSource,
  isSameSource,
  resolveCompositionRoot,
} from './source';

/**
 * Plays a [HyperFrames](https://github.com/heygen-com/hyperframes) composition: HTML clips timed with `data-start` and
 * `data-duration`, animated by a seekable timeline. The composition plays in an iframe the adapter owns, under the
 * HyperFrames runtime, which the adapter drives as media.
 *
 * @fires sourcechange - Fired when `source` names a different composition. Read `source` for the new value.
 * @internal
 */
export class HyperFramesAdapter extends MediaPlayedRangesMixin(EventTarget) implements Partial<Video> {
  static readonly defaultProps: HyperFramesAdapterProps = {
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
    runtimeSrc: DEFAULT_RUNTIME_SRC,
  };

  /** Engine this media plays through, reported to analytics such as Mux Data. */
  static readonly engineName: string = 'hyperframes';

  #target: HTMLIFrameElement | null = null;
  // Cancels the `message` and frame `load` listeners; the first lives on `window`, so nothing removes it with the frame.
  #listeners: AbortController | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #loadComplete = createPublicPromise<void>();
  // Identifies the current load; anything a replaced load still has in flight checks it and stands down.
  #loadId = 0;
  // The inline load waiting on its frame's `load` to mount its markup and inject the runtime.
  #pendingInline: number | null = null;
  #loadTimeout: ReturnType<typeof setTimeout> | undefined;
  #tickFrame: number | undefined;

  #source: HyperFramesSource | null = HyperFramesAdapter.defaultProps.source;
  #runtimeSrc = HyperFramesAdapter.defaultProps.runtimeSrc;
  #autoplay = HyperFramesAdapter.defaultProps.autoplay;
  #defaultMuted = HyperFramesAdapter.defaultProps.defaultMuted;
  #loop = HyperFramesAdapter.defaultProps.loop;
  #controls = HyperFramesAdapter.defaultProps.controls;
  #playsInline = HyperFramesAdapter.defaultProps.playsInline;
  #preload = HyperFramesAdapter.defaultProps.preload;
  #poster = HyperFramesAdapter.defaultProps.poster;

  // Whether the runtime listens for controls; until it does, play and seek are held and replayed on `ready`.
  #runtimeReady = false;
  #playRequested = false;
  #pendingSeek: number | null = null;
  // Set from a play until the runtime reports playing, so the reports it posted before it took the play don't read as
  // a pause. Reports during a seek are already held back by the seek.
  #awaitingPlay = false;
  // The runtime always lands a seek paused; a seek made while playing resumes once it lands.
  #resumeAfterSeek = false;
  #seekTarget = 0;
  // The composition's frame rate, as the runtime reports it; controls carry it and seeks land on its frames.
  #fps: RuntimeFps = DEFAULT_RUNTIME_FPS;
  // `playing` follows `play` once the runtime reports it is actually moving, as a media element's does.
  #announcedPlaying = false;

  #paused = true;
  #ended = false;
  #seeking = false;
  #waiting = false;
  #currentTime = 0;
  #duration = Number.NaN;
  #videoWidth = 0;
  #videoHeight = 0;
  // Volume, mute, and rate survive a source change, as on a media element, and are asserted on each new runtime.
  #volume = 1;
  #muted = false;
  #playbackRate = 1;
  #readyState = READY_STATE_HAVE_NOTHING;
  #error: MediaError | null = null;
  #isFullscreen = false;

  /** The composition frame's window, where the runtime runs. Null until a composition loads. */
  get engine(): Window | null {
    return this.#target?.contentWindow ?? null;
  }

  get target(): HTMLIFrameElement | null {
    return this.#target;
  }

  /** Bind the iframe the composition plays in. The composition follows once a source is set, which may be after. */
  attach(target: HTMLIFrameElement | null): void {
    if (!target || this.#target === target) return;

    if (this.#target) this.detach();

    this.#target = target;
    this.#listen(target);
    this.#fitFrame();
    void this.load();
  }

  detach(): void {
    const target = this.#target;
    if (!target) return;

    this.#post('pause');
    this.#loadId++;
    this.#pendingInline = null;
    this.#listeners?.abort();
    this.#listeners = null;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#target = null;
    this.#playRequested = false;
    this.#stopTicks();
    clearTimeout(this.#loadTimeout);
    // Unblock callers awaiting load; they re-check `#target` (now null) and no-op.
    this.#loadComplete.resolve();
    this.#resetState();
  }

  override destroy() {
    this.detach();
    super.destroy();
  }

  get src() {
    return getSourceSrc(this.#source);
  }
  /** A composition document URL. Setting it replaces `source`. */
  set src(value) {
    this.source = value ? { src: value } : null;
  }

  get currentSrc() {
    return this.#readyState > READY_STATE_HAVE_NOTHING ? getSourceSrc(this.#source) : '';
  }

  /**
   * The composition to play. A source naming the same composition as the current one (see `HyperFramesSource.id`) is
   * taken as an update: the next load reads it, and playback carries on.
   */
  get source(): HyperFramesSource | null {
    return this.#source;
  }
  set source(value: HyperFramesSource | null) {
    const source = value ?? null;
    const same = isSameSource(this.#source, source);

    this.#source = source;

    if (same) return;

    void this.load();
    this.dispatchEvent(new Event('sourcechange'));
  }

  get runtimeSrc() {
    return this.#runtimeSrc;
  }
  /** Read when a composition loads, so a change applies from the next one. */
  set runtimeSrc(value) {
    this.#runtimeSrc = value || DEFAULT_RUNTIME_SRC;
  }

  get readyState() {
    return this.#readyState;
  }

  /** Rebuild the composition frame for the current source. */
  async load() {
    const target = this.#target;
    if (!target) return;

    const loadId = ++this.#loadId;
    const hadMedia = this.#readyState > READY_STATE_HAVE_NOTHING || !!this.#error;

    this.#loadComplete.resolve();
    this.#loadComplete = createPublicPromise<void>();
    this.#pendingInline = null;
    this.#stopTicks();
    clearTimeout(this.#loadTimeout);
    this.#resetState();

    if (hadMedia) this.dispatchEvent(new Event('emptied'));

    // Wait a microtask so a framework's prop writes all land before the frame is written, once.
    await Promise.resolve();

    if (loadId !== this.#loadId || this.#target !== target) return;

    const source = this.#source;
    const kind = source && getSourceKind(source);

    if (!source || !kind) {
      target.removeAttribute('srcdoc');
      this.#loadComplete.resolve();
      return;
    }

    this.dispatchEvent(new Event('loadstart'));
    // Hidden until the runtime reports the timeline: inline markup is on screen before the runtime hides its future
    // clips, and every clip would flash.
    target.style.visibility = 'hidden';
    this.#fitFrame();
    this.#loadTimeout = setTimeout(() => {
      if (loadId === this.#loadId && this.#readyState === READY_STATE_HAVE_NOTHING) {
        this.#fail(
          new MediaError('The HyperFrames composition did not report a timeline.', MEDIA_ERR_SRC_NOT_SUPPORTED)
        );
      }
    }, LOAD_TIMEOUT_MS);

    if (kind === 'inline') {
      const { content } = source;
      const markup = isString(content) ? content : isFunction(content) ? '' : (content?.innerHTML ?? '');

      // Same origin, so the markup can be mounted from here and its timeline built from the page's GSAP.
      target.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      this.#pendingInline = loadId;
      target.srcdoc = buildInlineDocument(markup, globalThis.document?.baseURI ?? '');
      return;
    }

    const baseUrl = resolveUrl(source.src ?? '');
    let html = source.html;

    if (!html) {
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        html = await response.text();
      } catch (error) {
        if (loadId === this.#loadId) {
          this.#fail(
            new MediaError(`Could not load the HyperFrames composition at ${baseUrl}: ${error}`, MEDIA_ERR_NETWORK)
          );
        }

        return;
      }

      if (loadId !== this.#loadId || this.#target !== target) return;
    }

    // Opaque: a composition document brings its own scripts, which must not reach the page.
    target.setAttribute('sandbox', 'allow-scripts');
    target.srcdoc = buildCompositionDocument(html, this.#runtimeSrc, baseUrl);
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
    if (!this.#source) return;

    if (!this.#runtimeReady) {
      this.#ended = false;
      this.#playRequested = true;
      return;
    }

    // Playing from the end starts over, as a media element does: back to the start, then on from there.
    if (this.#ended) {
      this.#seek(0);
      this.#resumeAfterSeek = true;
      this.#setPlayRequested();
      return;
    }

    this.#startPlayback();
  }

  pause() {
    // A pause is the later intent, so it cancels a play still pending and the resume after a seek.
    this.#playRequested = false;
    this.#awaitingPlay = false;
    this.#resumeAfterSeek = false;
    this.#stopTicks();
    this.#post('pause');
    this.#setPaused();
  }

  get currentTime() {
    return this.#currentTime;
  }
  set currentTime(value) {
    const time = Number.isFinite(this.#duration) ? clamp(value, 0, this.#duration) : Math.max(0, value);
    if (time === this.#currentTime && !this.#seeking) return;

    // Before the runtime listens, the position is held and the seek sent when it does.
    if (!this.#runtimeReady) {
      this.#pendingSeek = time;
      this.#currentTime = time;
      this.dispatchEvent(new Event('timeupdate'));
      return;
    }

    this.#seek(time);
  }

  get duration() {
    return this.#duration;
  }

  get videoWidth() {
    return this.#videoWidth;
  }

  get videoHeight() {
    return this.#videoHeight;
  }

  get volume() {
    return this.#volume;
  }
  set volume(value) {
    const volume = clamp(value, 0, 1);
    if (this.#volume === volume) return;

    this.#volume = volume;
    this.dispatchEvent(new Event('volumechange'));
    this.#post('set-volume', { volume });
  }

  get muted() {
    return this.#muted;
  }
  set muted(value) {
    if (this.#muted === value) return;

    this.#muted = value;
    this.dispatchEvent(new Event('volumechange'));
    this.#post('set-muted', { muted: value });
  }

  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#playbackRate === value || !(value > 0)) return;

    this.#playbackRate = value;
    this.dispatchEvent(new Event('ratechange'));
    this.#post('set-playback-rate', { playbackRate: value });
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

    // Seed `muted` until the runtime is up; `#onReady` asserts it.
    if (!this.#runtimeReady) this.#muted = value;
  }

  /** Looping is done here: at the end the composition is sought back to the start and played again. */
  get loop() {
    return this.#loop;
  }
  set loop(value) {
    this.#loop = value;
  }

  /** A composition has no chrome of its own, so this is stored and reported without effect. */
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

  /** A composition is local once its assets settle, so all of it counts as available from then on. */
  get buffered() {
    return this.#readyState >= READY_STATE_HAVE_ENOUGH_DATA && this.#duration > 0
      ? createTimeRange(0, this.#duration)
      : NO_TIME_RANGES_YET;
  }

  get seekable() {
    return this.#duration > 0 && Number.isFinite(this.#duration)
      ? createTimeRange(0, this.#duration)
      : NO_TIME_RANGES_YET;
  }

  get error() {
    return this.#error;
  }

  /** Unsupported: a composition draws its own captions, and the bridge reports none. */
  get textTracks() {
    return undefined;
  }

  get isFullscreen() {
    return this.#isFullscreen;
  }

  async requestFullscreen() {
    if (!this.#target?.requestFullscreen) return;

    await this.#target.requestFullscreen();
    this.#isFullscreen = true;
  }

  async exitFullscreen() {
    const doc = globalThis.document;

    if (doc?.fullscreenElement && doc.fullscreenElement === this.#target) await doc.exitFullscreen();

    this.#isFullscreen = false;
  }

  // Listen for what the runtime reports; messages arrive on `window`, so each is matched against this host's frame.
  #listen(target: HTMLIFrameElement) {
    const win = globalThis.window;
    if (!win) return;

    this.#listeners = new AbortController();

    const { signal } = this.#listeners;

    win.addEventListener('message', (event) => this.#onMessage(event, target), { signal });
    target.addEventListener('load', () => this.#onFrameLoad(target), { signal });

    // The frame lays out at the composition's size and is scaled to fit whatever holds it.
    const container = target.parentElement;

    if (container && typeof ResizeObserver !== 'undefined') {
      this.#resizeObserver = new ResizeObserver(() => this.#fitFrame());
      this.#resizeObserver.observe(container);
    }
  }

  // An inline composition's document has loaded: mount the markup, register the timeline, then bring in the runtime,
  // which binds what it finds.
  async #onFrameLoad(target: HTMLIFrameElement) {
    const loadId = this.#pendingInline;
    // Read now rather than when the load began: an update to the same composition (a timeline set after the markup was
    // parsed, a re-render's mount function) is not a new load, and the latest one is what gets built.
    const source = this.#source;
    if (loadId === null || loadId !== this.#loadId || !source) return;

    const doc = target.contentDocument;
    const win = target.contentWindow as (Window & { __timelines?: Record<string, unknown> }) | null;
    const container = doc && getMountContainer(doc);
    // A load for a document other than the one written for this composition, such as the blank one before it.
    if (!doc || !win || !container) return;

    this.#pendingInline = null;

    try {
      if (isFunction(source.content)) await source.content(container);

      if (loadId !== this.#loadId) return;

      const root = resolveCompositionRoot(container, source);

      if (source.timeline) {
        const timeline = source.timeline(root);

        // The runtime drives the timeline from its own clock; left playing, it would also run on GSAP's.
        timeline.pause();
        win.__timelines ??= {};
        win.__timelines[root.getAttribute('data-composition-id')!] = timeline;
      }
    } catch (error) {
      if (loadId === this.#loadId) {
        this.#fail(
          new MediaError(`The HyperFrames composition could not be built: ${error}`, MediaError.MEDIA_ERR_CUSTOM, true)
        );
      }

      return;
    }

    this.#fitFrame();

    const script = doc.createElement('script');

    script.src = this.#runtimeSrc;
    script.addEventListener('error', () => {
      if (loadId === this.#loadId) {
        this.#fail(new MediaError(`The HyperFrames runtime failed to load from ${script.src}.`, MEDIA_ERR_NETWORK));
      }
    });
    doc.head.append(script);
  }

  #onMessage(event: MessageEvent, target: HTMLIFrameElement) {
    // A frame that is gone cannot have sent anything, so an absent window must not match.
    const frame = target.contentWindow;
    if (!frame || event.source !== frame) return;

    const message = parseRuntimeMessage(event.data);
    if (!message) return;

    if (message.fps) this.#fps = message.fps;

    switch (message.type) {
      case 'unsupported-protocol':
        this.#fail(
          new MediaError(
            `The HyperFrames runtime speaks protocol version ${String(message.version)}, which this player does not.`,
            MEDIA_ERR_SRC_NOT_SUPPORTED
          )
        );
        break;
      case 'ready':
        this.#onReady();
        break;
      case 'timeline':
        this.#onTimeline(message.durationSeconds, message.compositionWidth, message.compositionHeight);
        break;
      case 'assets-ready':
        this.#onAssetsReady();
        break;
      case 'state':
        this.#onState(message);
        break;
    }
  }

  // The runtime listens for controls, on every load of the composition document. Assert what the host was asked for
  // while it could not: the runtime starts unmuted, at full volume and normal speed.
  #onReady() {
    this.#runtimeReady = true;

    if (this.#muted) this.#post('set-muted', { muted: true });

    if (this.#volume !== 1) this.#post('set-volume', { volume: this.#volume });

    if (this.#playbackRate !== 1) this.#post('set-playback-rate', { playbackRate: this.#playbackRate });

    if (this.#pendingSeek !== null) {
      const time = this.#pendingSeek;

      this.#pendingSeek = null;
      this.#seek(time);
    }

    if (this.#autoplay || this.#playRequested) {
      this.#playRequested = false;
      this.#startPlayback();
    }
  }

  #onTimeline(duration: number, width = DEFAULT_COMPOSITION_WIDTH, height = DEFAULT_COMPOSITION_HEIGHT) {
    if (!(duration > 0)) return;

    if (width !== this.#videoWidth || height !== this.#videoHeight) {
      this.#videoWidth = width;
      this.#videoHeight = height;
      this.#fitFrame();
      this.dispatchEvent(new Event('resize'));
    }

    if (duration !== this.#duration) {
      this.#duration = duration;
      this.dispatchEvent(new Event('durationchange'));
    }

    if (this.#readyState !== READY_STATE_HAVE_NOTHING) return;

    clearTimeout(this.#loadTimeout);
    this.#readyState = READY_STATE_HAVE_METADATA;

    if (this.#target) this.#target.style.visibility = '';

    this.dispatchEvent(new Event('loadedmetadata'));
  }

  #onAssetsReady() {
    if (this.#readyState === READY_STATE_HAVE_NOTHING || this.#readyState >= READY_STATE_HAVE_ENOUGH_DATA) return;

    this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;

    for (const type of ['loadeddata', 'progress', 'canplay', 'canplaythrough']) {
      this.dispatchEvent(new Event(type));
    }

    this.#loadComplete.resolve();
  }

  #onState({ currentTime, isPlaying, ended, buffering }: RuntimeStateMessage) {
    // Reports from before a seek landed would drag the playhead back; the seek settles on the first at its target.
    if (this.#seeking) {
      // A seek lands on the nearest frame, at most half a frame from where it was asked to.
      if (Math.abs(currentTime - this.#seekTarget) > 1 / fpsToNumber(this.#fps)) return;

      this.#settleSeek(currentTime);
      return;
    }

    this.#applyCurrentTime(currentTime);
    this.#applyBuffering(buffering);

    if (ended && !this.#ended) {
      this.#onEnded();
      return;
    }

    if (isPlaying) {
      this.#awaitingPlay = false;
      this.#setPlaying();
    } else if (!this.#awaitingPlay && !ended) {
      this.#stopTicks();
      this.#setPaused();
    }
  }

  #onEnded() {
    this.#awaitingPlay = false;

    // A looping media element never ends: the composition goes back to the start and plays again.
    if (this.#loop) {
      this.#seek(0);
      this.#resumeAfterSeek = true;
      return;
    }

    this.#stopTicks();
    this.#ended = true;
    this.#setPaused();
    this.dispatchEvent(new Event('ended'));
  }

  #startPlayback() {
    this.#awaitingPlay = true;
    this.#post('play');
    this.#startTicks();
    this.#setPlayRequested();
  }

  // `play` announces the request, as on a media element; `playing` waits for the runtime to report it moving.
  #setPlayRequested() {
    if (!this.#paused) return;

    this.#paused = false;
    this.dispatchEvent(new Event('play'));
  }

  // The runtime lands every seek paused, so one made while playing is resumed once the runtime reports it landed.
  #seek(time: number) {
    if (!this.#paused) this.#resumeAfterSeek = true;

    this.#seeking = true;
    this.#seekTarget = time;
    // Seeking away from the end leaves it, as on a media element.
    this.#ended = false;
    this.#currentTime = time;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));
    this.#post('seek', { timeSeconds: time });
  }

  #settleSeek(time: number) {
    this.#seeking = false;
    this.#applyCurrentTime(time);
    this.dispatchEvent(new Event('seeked'));

    if (!this.#resumeAfterSeek) return;

    this.#resumeAfterSeek = false;

    // Playing on from the end would have the runtime start over; a media element sought to its end ends there instead.
    if (time >= this.#duration - 1 / fpsToNumber(this.#fps)) {
      this.#onEnded();
      return;
    }

    this.#startPlayback();
  }

  #applyCurrentTime(time: number) {
    if (time === this.#currentTime) return;

    this.#currentTime = time;
    this.dispatchEvent(new Event('timeupdate'));
  }

  #applyBuffering(buffering: boolean) {
    if (buffering === this.#waiting || this.#readyState === READY_STATE_HAVE_NOTHING) return;

    this.#waiting = buffering;

    if (buffering) {
      this.#readyState = READY_STATE_HAVE_CURRENT_DATA;
      this.dispatchEvent(new Event('waiting'));
    } else {
      this.#readyState = READY_STATE_HAVE_ENOUGH_DATA;

      if (!this.#paused) this.dispatchEvent(new Event('playing'));
    }
  }

  #setPlaying() {
    if (!this.#paused) {
      if (!this.#announcedPlaying) {
        this.#announcedPlaying = true;
        this.dispatchEvent(new Event('playing'));
      }

      return;
    }

    // The runtime started without being asked here, as it does for a composition that plays itself.
    this.#paused = false;
    this.#announcedPlaying = true;
    this.#startTicks();
    this.dispatchEvent(new Event('play'));
    this.dispatchEvent(new Event('playing'));
  }

  #setPaused() {
    this.#announcedPlaying = false;

    if (this.#paused) return;

    this.#paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  // The runtime advances its clock on the host's frames, as `@hyperframes/player` drives it, so a frame the browser
  // throttles does not stall playback while the page is still painting.
  #startTicks() {
    if (this.#tickFrame !== undefined || typeof requestAnimationFrame === 'undefined') return;

    const tick = () => {
      if (this.#paused && !this.#awaitingPlay) {
        this.#tickFrame = undefined;
        return;
      }

      this.#post('tick');
      this.#tickFrame = requestAnimationFrame(tick);
    };

    this.#tickFrame = requestAnimationFrame(tick);
  }

  #stopTicks() {
    if (this.#tickFrame === undefined) return;

    cancelAnimationFrame(this.#tickFrame);
    this.#tickFrame = undefined;
  }

  // Lay the frame out at the composition's size, centred and scaled to fit what holds it.
  #fitFrame() {
    const target = this.#target;
    const container = target?.parentElement;
    if (!target || !container) return;

    const width = this.#videoWidth || this.#source?.width || DEFAULT_COMPOSITION_WIDTH;
    const height = this.#videoHeight || this.#source?.height || DEFAULT_COMPOSITION_HEIGHT;
    const scale = Math.min(container.clientWidth / width, container.clientHeight / height) || 0;

    Object.assign(target.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${width}px`,
      height: `${height}px`,
      border: '0',
      transformOrigin: 'center',
      transform: `translate(-50%, -50%) scale(${scale})`,
    });
  }

  #fail(error: MediaError) {
    clearTimeout(this.#loadTimeout);
    this.#stopTicks();
    this.#error = error;
    this.dispatchEvent(new Event('error'));
    // Unblock callers awaiting load so they don't hang.
    this.#loadComplete.resolve();
  }

  // Posting to a frame being torn down throws and is swallowed. Controls sent before the runtime listens are dropped;
  // `#onReady` replays the state they carried.
  #post(action: RuntimeControlAction, extra?: Record<string, unknown>) {
    const frame = this.#target?.contentWindow;
    if (!frame || !this.#runtimeReady) return;

    tryCall(() => frame.postMessage(createRuntimeControl(action, this.#fps, extra), '*'));
  }

  #resetState() {
    this.#runtimeReady = false;
    this.#fps = DEFAULT_RUNTIME_FPS;
    this.#pendingSeek = null;
    this.#awaitingPlay = false;
    this.#resumeAfterSeek = false;
    this.#announcedPlaying = false;
    this.#currentTime = 0;
    this.#duration = Number.NaN;
    this.#videoWidth = 0;
    this.#videoHeight = 0;
    this.#paused = true;
    this.#ended = false;
    this.#seeking = false;
    this.#waiting = false;
    this.#readyState = READY_STATE_HAVE_NOTHING;
    this.#error = null;
    this.#isFullscreen = false;
  }
}

function resolveUrl(url: string): string {
  try {
    return new URL(url, globalThis.document?.baseURI).href;
  } catch {
    return url;
  }
}

// How long a composition may take to report its timeline before the load fails, as `@hyperframes/player` allows.
const LOAD_TIMEOUT_MS = 15_000;

const MEDIA_ERR_NETWORK = MediaError.MEDIA_ERR_NETWORK;
const MEDIA_ERR_SRC_NOT_SUPPORTED = MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

const READY_STATE_HAVE_NOTHING = 0;
const READY_STATE_HAVE_METADATA = 1;
const READY_STATE_HAVE_CURRENT_DATA = 2;
const READY_STATE_HAVE_ENOUGH_DATA = 4;
