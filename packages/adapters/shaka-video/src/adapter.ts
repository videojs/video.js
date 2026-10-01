// Keep this import first: it lends shaka's UMD evaluation the `self` global a
// server runtime lacks. See `server-shim.ts`.
import './server-shim';
import {
  type DrmSystemsConfig,
  type EngineAdapter,
  MediaError,
  type MediaPreloadType,
  type MediaStreamType,
  MediaStreamTypes,
} from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import { deepEqual } from '@videojs/utils/object';
import { isObject } from '@videojs/utils/predicate';
// The es2021 bundle is the same everything-but-UI API as the package default,
// minus the ES5 down-compilation nothing this repo targets needs. Shaka ships
// no `exports` map, so the deep path is public surface — and `dist/*.ui*` is
// where the UI library lives; never import those.
import shaka from 'shaka-player/dist/shaka-player.compiled-es2021.js';

import { ShakaLiveMixin } from './live';
import { ShakaMediaTracksMixin } from './media-tracks';
import { didShimSelf } from './server-shim';
import { ShakaStreamTypeMixin } from './stream-type';

export { shaka };

if (didShimSelf) {
  Reflect.deleteProperty(globalThis, 'self');
}

type Opaque = string | number | boolean | bigint | symbol | null | undefined | ArrayBufferView;

/**
 * Every level optional. Shaka's own configuration type describes a fully resolved configuration, while `configure()`
 * merges whatever subset it is handed into the current one.
 */
type DeepPartial<T> = T extends Opaque | readonly any[] | ((...args: any[]) => any)
  ? T
  : { [Key in keyof T]?: DeepPartial<T[Key]> };

/**
 * Shaka Player's configuration, as `configure()` accepts it.
 *
 * @experimental
 */
export type ShakaConfig = DeepPartial<shaka.extern.PlayerConfiguration>;

/**
 * Structured Shaka source: which source to play, plus how to play it.
 *
 * @experimental
 */
export interface ShakaSource {
  /**
   * Manifest URL. Shaka plays DASH, HLS, and progressive files from the same property. Mirrors the host's `src`
   * property.
   */
  src?: string | undefined;
  /**
   * MIME type of the source. Handed to Shaka as the type to parse `src` as, which is what makes an extensionless
   * manifest URL playable.
   */
  type?: string | undefined;
  /**
   * License servers for protected content, keyed by EME key system id.
   *
   * Translated into the `drm.servers` and `drm.advanced` Shaka configures EME from. Name every system you hold a
   * license server for — which one is used is the browser's choice.
   */
  drm?: DrmSystemsConfig | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: ShakaEngineConfig | undefined;
}

/**
 * The engines a Shaka source can configure.
 *
 * @experimental
 */
export interface ShakaEngineConfig {
  /**
   * Shaka Player's own configuration, passed through untouched. Replacing it resets any previously applied
   * configuration. A `drm.servers` of its own replaces `source.drm` — an escape hatch for licensing against the parts
   * of Shaka's DRM configuration `source.drm` does not cover.
   */
  shaka?: ShakaConfig | undefined;
}

/** @experimental */
export interface ShakaAdapterProps {
  src: string;
  source: ShakaSource | null;
  preload: MediaPreloadType;
  streamType: MediaStreamType;
}

/**
 * Configuration this element applies on top of Shaka's own defaults — the Shaka spelling of what the hls.js media ships
 * (`capLevelToPlayerSize`): adaptation stays within renditions no larger than the element rendering them. Anything
 * under `source.engine.shaka` overrides it.
 */
const defaultShakaConfig: ShakaConfig = {
  abr: { restrictToElementSize: true },
};

class ShakaAdapterCore
  extends MediaTracksMixin(HTMLVideoAdapter)
  implements EngineAdapter<shaka.Player, HTMLVideoElement>, Omit<ShakaAdapterProps, 'streamType'>
{
  static readonly defaultProps: ShakaAdapterProps = {
    src: '',
    source: null,
    preload: 'metadata',
    streamType: MediaStreamTypes.UNKNOWN,
  };

  #engine: shaka.Player | null = null;
  #src = ShakaAdapterCore.defaultProps.src;
  #source: ShakaSource | null = ShakaAdapterCore.defaultProps.source;
  #preload: MediaPreloadType = ShakaAdapterCore.defaultProps.preload;
  #playIntentAbort: AbortController | null = null;
  #isLoadDeferred = false;
  #clampedGoals: { bufferingGoal: number; rebufferingGoal: number } | null = null;
  #error: MediaError | null = null;
  // The raw Shaka failures already announced. Held weakly: it answers nothing
  // but "seen before", and each failure is a fresh object.
  #reported = new WeakSet<object>();
  #isDestroyed = false;

  constructor() {
    super();

    // A server render has no DOM to probe or play into; the client constructs
    // an instance of its own. Even the support check needs browser globals.
    if (typeof document === 'undefined') return;

    installPolyfills();

    if (!shaka.Player.isBrowserSupported()) {
      if (__DEV__) {
        console.warn('[vjs-shaka] This browser lacks the APIs Shaka Player needs. Nothing will play.');
      }

      return;
    }

    this.#engine = new shaka.Player();
    this.#engine.configure(defaultShakaConfig);
    this.#engine.addEventListener('error', this.#onEngineError);
  }

  attach(target: HTMLVideoElement) {
    // Shaka's `attach()` tears playback down and builds it back up, so the
    // target it is already playing in is left alone.
    const isNewTarget = this.target !== target;
    // Read before attaching: a source assigned while there was nothing to play
    // it in never reached the engine, and this attach is what loads it. Anything
    // assigned from here on has a target of its own to load into.
    const hasUnloadedSource = Boolean(this.#src);

    super.attach(target);

    // The stored preload may predate the target; the element reads its own.
    if (target.preload !== this.#preload) target.preload = this.#preload;

    const engine = this.#engine;
    if (!engine || !isNewTarget) return;

    this.#run(engine.attach(target));

    // Shaka takes its lock in call order, so this runs after the attach above
    // without waiting on it here.
    if (hasUnloadedSource) this.#loadSource(engine);
  }

  detach() {
    const engine = this.#engine;
    const wasAttached = this.target !== null;

    // The play listener belongs to the target that is leaving.
    this.#disarmPlayIntent();

    super.detach();

    if (engine && wasAttached) this.#run(engine.detach());
  }

  destroy() {
    this.detach();
    this.#disarmPlayIntent();

    const engine = this.#engine;

    // Anything still in flight has nothing left to report to.
    this.#engine = null;
    this.#isDestroyed = true;

    if (engine) {
      engine.removeEventListener('error', this.#onEngineError);
      // Shaka aborts whatever is in flight itself, so a teardown that races a
      // load has nothing left to report.
      engine.destroy().catch(() => {});
    }

    super.destroy();
  }

  /**
   * Underlying playback engine — the Shaka `Player` instance, or `null` when the browser cannot run it. An advanced
   * escape hatch for direct engine access; normal playback is driven through this element's own properties and
   * methods.
   */
  get engine() {
    return this.#engine;
  }

  /**
   * The last playback failure Shaka could not recover from, or `null`. Shaka loads asynchronously, so a manifest that
   * cannot be played fails after `src` was assigned rather than at the assignment; the `error` event is when to read
   * this.
   *
   * A Shaka failure says more about what went wrong than the media element's own `error` does, so it wins while there
   * is one; anything the element failed on by itself still reads through.
   */
  get error() {
    return this.#error ?? super.error;
  }

  get src() {
    return this.#src;
  }

  /** Manifest URL. Setting it re-derives `source`, carrying its settings over. */
  set src(value) {
    // `src` says which source to play; every other field says how to play it,
    // so they carry over.
    const { type, drm, engine } = this.#source ?? {};
    const next: ShakaSource = {
      ...(type && { type }),
      ...(drm && { drm }),
      ...(engine && { engine }),
      ...(value && { src: value }),
    };

    // Everything happens in the `source` setter, so there is one path for
    // storing it, telling the engine, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  /**
   * How much to fetch before playback is asked for, mirroring the media element's own `preload`. Shaka has no split
   * between "know the source" and "buffer it", so this maps onto when and how `engine.load()` runs:
   *
   * - `'auto'` — load immediately with the configured buffering goals.
   * - `'metadata'` — load immediately, holding buffering to about a segment; the configured goals come back on the first
   *   play intent.
   * - `'none'` / `''` — hold the load entirely until the first play intent.
   *
   * A play intent is a `play` event, a target that is already playing, or `autoplay` — which the spec lets override
   * `preload` for good reason: with nothing fetched there is nothing whose readiness could ever fire it. Widening
   * (`none` → `auto`) takes effect immediately; narrowing after a load began cannot un-fetch and leaves it alone.
   */
  get preload(): MediaPreloadType {
    return this.#preload;
  }

  set preload(value: MediaPreloadType) {
    if (this.#preload === value) return;

    this.#preload = value;

    const { target } = this;

    if (target && target.preload !== value) target.preload = value;

    const engine = this.#engine;
    if (!engine) return;

    if (this.#isLoadDeferred && (value === 'metadata' || value === 'auto')) {
      this.#loadSource(engine);
      return;
    }

    if (this.#clampedGoals && value === 'auto') this.#restoreBuffering(engine);
  }

  /**
   * Structured source: what to play (`src`, an optional `type`) plus how to play it (`drm`, `engine.shaka`). Replacing
   * it re-derives `src`.
   *
   * Shaka takes configuration on a live player, so changing `engine.shaka` re-applies it in place instead of recreating
   * the engine.
   */
  get source(): ShakaSource | null {
    return this.#source;
  }

  set source(value: ShakaSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs
    // nothing.
    if (source === this.#source) return;

    // Assigning is always a source change, so it is always announced. Only the
    // engine calls are guarded, so re-assigning an equivalent source — an inline
    // React prop, say — never disturbs what is already playing.
    const configChanged = !deepEqual(engineConfigKey(this.#source), engineConfigKey(source));
    const loadChanged = this.#src !== (source?.src ?? '') || this.#source?.type !== source?.type;

    this.#source = source;
    this.#src = source?.src ?? '';

    if (configChanged) this.#applyEngineConfig();

    if (loadChanged) this.#requestLoad();

    this.dispatchEvent(new Event('sourcechange'));
  }

  // `engine.shaka` is replaced, not merged, but Shaka merges every
  // `configure()` call into the current configuration — reset first so dropping
  // a key clears it instead of leaving the previous value behind.
  #applyEngineConfig() {
    const engine = this.#engine;
    if (!engine) return;

    engine.resetConfiguration();
    engine.configure(defaultShakaConfig);

    const config = withDrmConfig(this.#source?.engine?.shaka, this.#source?.drm);

    if (config) engine.configure(config);

    // A wholesale re-apply raised the buffering goals a pending `'metadata'`
    // clamp held down; clamp again against the configuration now in force.
    if (this.#clampedGoals) this.#clampBuffering(engine);
  }

  #requestLoad() {
    const engine = this.#engine;
    // Nothing to load into yet — `attach()` loads what is waiting.
    if (!engine || !this.target) return;

    this.#loadSource(engine);
  }

  #loadSource(engine: shaka.Player) {
    this.#error = null;
    this.#disarmPlayIntent();
    this.#isLoadDeferred = false;
    // Each load decides its own clamping. Lifting the previous load's clamp
    // first keeps a fresh clamp from capturing the clamped goals as the ones
    // to restore, and lets a load with play intent run at full goals.
    this.#restoreBuffering(engine);

    const { src } = this;

    if (!src) {
      this.#run(engine.unload());
      return;
    }

    const { target } = this;
    const hasPlayIntent = Boolean(target && (!target.paused || target.autoplay));
    const preload = this.#preload;

    if (!hasPlayIntent && (preload === 'none' || preload === '')) {
      this.#isLoadDeferred = true;
      // The `play` is itself the intent — no second look at the target.
      this.#armPlayIntent(() => {
        const deferredEngine = this.#engine;

        if (deferredEngine) this.#startLoad(deferredEngine);
      });
      return;
    }

    if (!hasPlayIntent && preload === 'metadata') {
      this.#clampBuffering(engine);
      this.#armPlayIntent(() => {
        const clampedEngine = this.#engine;

        if (clampedEngine) this.#restoreBuffering(clampedEngine);
      });
    }

    this.#startLoad(engine);
  }

  #startLoad(engine: shaka.Player) {
    this.#isLoadDeferred = false;
    this.#error = null;
    this.#run(engine.load(this.src, undefined, this.#source?.type));
  }

  /**
   * Holds Shaka's buffering to about one segment — the closest analog of fetching "metadata" an engine that always
   * buffers through MSE has. The goals in force are captured first so the first play intent can put back exactly what
   * configuration produced them.
   */
  #clampBuffering(engine: shaka.Player) {
    const { bufferingGoal, rebufferingGoal } = engine.getConfiguration().streaming;

    this.#clampedGoals = { bufferingGoal, rebufferingGoal };
    engine.configure({ streaming: { bufferingGoal: 1, rebufferingGoal: 1 } });
  }

  #restoreBuffering(engine: shaka.Player) {
    const goals = this.#clampedGoals;
    if (!goals) return;

    this.#clampedGoals = null;
    engine.configure({ streaming: goals });
  }

  #armPlayIntent(onPlay: () => void) {
    this.#disarmPlayIntent();

    const { target } = this;
    if (!target) return;

    this.#playIntentAbort = new AbortController();
    target.addEventListener('play', onPlay, { signal: this.#playIntentAbort.signal, once: true });
  }

  #disarmPlayIntent() {
    this.#playIntentAbort?.abort();
    this.#playIntentAbort = null;
  }

  /**
   * Shaka's `attach()`, `load()`, `unload()`, and `detach()` are asynchronous, and the player orders them itself: each
   * takes an internal lock in call order, and a newer one interrupts whatever it supersedes. So a call is issued as it
   * comes — holding it until the one before it settles would keep a new source waiting on a manifest that hangs, when
   * cutting that load short is the point of assigning one.
   *
   * Nothing awaits these, so a rejection is reported rather than left unhandled.
   */
  #run(operation: Promise<unknown>) {
    operation.catch((error) => this.#reportError(error));
  }

  #onEngineError = (event: Event) => {
    this.#reportError((event as Event & { detail?: unknown }).detail);
  };

  #reportError(error: unknown) {
    // A teardown rejects whatever it was racing; there is no one left to tell.
    if (this.#isDestroyed) return;

    // One failure can arrive twice — rejecting the engine call it broke and
    // announcing itself on the `error` event — so whichever lands first is the
    // one that counts. This outlives the load it came from: an `error` handler
    // that assigns a fallback `src` would otherwise see the rejection still in
    // flight land as a fresh failure against the source it just started.
    if (isObject(error)) {
      if (this.#reported.has(error)) return;

      this.#reported.add(error);
    }

    const mediaError = toMediaError(error);
    // An aborted load or a failure Shaka intends to retry is not worth
    // announcing.
    if (!mediaError) return;

    this.#error = mediaError;
    this.dispatchEvent(new ErrorEvent('error', { error: mediaError, message: mediaError.message }));
  }
}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 * @fires error - Fired when playback fails in a way Shaka could not recover from. Read `error` for the failure.
 * @fires streamtypechange - Fired when the detected stream type changes. Read `streamType` for the new value.
 * @fires targetlivewindowchange - Fired when `targetLiveWindow` changes. Read it for the new value.
 * @experimental
 */
export class ShakaAdapter extends ShakaLiveMixin(ShakaStreamTypeMixin(ShakaMediaTracksMixin(ShakaAdapterCore))) {}

let arePolyfillsInstalled = false;

/**
 * Patches the browser APIs Shaka expects before anything reads them. Shaka ships these as polyfills it does not install
 * itself, and both `isBrowserSupported()` and the DRM path depend on them — FairPlay EME on Safari is patched in from
 * here. Installing is global, so it happens once.
 */
function installPolyfills() {
  if (arePolyfillsInstalled) return;

  arePolyfillsInstalled = true;

  shaka.polyfill.installAll();
}

/**
 * Everything Shaka is configured from. Compared structurally, so equivalent options never re-apply — including nested
 * ones like `drm`, which a flat comparison would see as changed whenever the object identity did.
 */
function engineConfigKey(source: ShakaSource | null) {
  return { drm: source?.drm ?? null, shaka: source?.engine?.shaka ?? null };
}

/**
 * Shaka configuration with the source's DRM licensing folded in. Shaka names license servers under `drm.servers` and
 * server certificates under `drm.advanced`, so `source.drm` is translated into both — unless `engine.shaka.drm.servers`
 * names servers of its own, which replaces it.
 */
function withDrmConfig(config: ShakaConfig | undefined, drm: DrmSystemsConfig | undefined) {
  const systems = Object.entries(drm ?? {});
  if (systems.length === 0 || config?.drm?.servers) return config;

  const servers: Record<string, string> = {};
  const advanced: Record<string, { serverCertificateUri: string }> = {};

  for (const [keySystem, system] of systems) {
    servers[keySystem] = system.licenseUrl;

    if (system.serverCertificateUrl) advanced[keySystem] = { serverCertificateUri: system.serverCertificateUrl };
  }

  return {
    ...config,
    drm: {
      ...config?.drm,
      servers,
      // Advanced options a caller set for a key system are more specific than a
      // certificate URL derived from `source.drm`, so they win.
      ...(Object.keys(advanced).length > 0 && { advanced: { ...advanced, ...config?.drm?.advanced } }),
    },
  } satisfies ShakaConfig;
}

const categoryToCode: Record<number, number> = {
  [shaka.util.Error.Category.NETWORK]: MediaError.MEDIA_ERR_NETWORK,
  [shaka.util.Error.Category.MEDIA]: MediaError.MEDIA_ERR_DECODE,
  [shaka.util.Error.Category.MANIFEST]: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
  [shaka.util.Error.Category.STREAMING]: MediaError.MEDIA_ERR_DECODE,
  [shaka.util.Error.Category.DRM]: MediaError.MEDIA_ERR_ENCRYPTED,
};

/** Shaka codes for a load that a newer one replaced. */
const abortedCodes = new Set<number>([shaka.util.Error.Code.LOAD_INTERRUPTED, shaka.util.Error.Code.OPERATION_ABORTED]);

/**
 * A Shaka failure as a `MediaError`, or `null` when there is nothing to report.
 *
 * Only a failure Shaka gave up on is reported. Shaka marks one it means to retry as recoverable and fires it on the way
 * through, and an announced error stands until the next load — so announcing those would leave the error UI over
 * playback that is still running. Whatever a retry cannot save comes back as critical.
 *
 * Shaka classifies a failure by category rather than by a media error code, so the code is derived from that.
 */
function toMediaError(error: unknown): MediaError | null {
  if (!isShakaError(error)) {
    return error instanceof Error ? new MediaError(error.message, MediaError.MEDIA_ERR_CUSTOM, true) : null;
  }

  if (abortedCodes.has(error.code)) return null;

  if (error.severity !== shaka.util.Error.Severity.CRITICAL) {
    if (__DEV__) {
      console.warn('[vjs-shaka] Shaka reported a recoverable failure and will retry it.', error);
    }

    return null;
  }

  const code = categoryToCode[error.category] ?? MediaError.MEDIA_ERR_CUSTOM;
  const mediaError = new MediaError(error.message, code, true, `shaka-${error.code}`);

  mediaError.data = error;

  return mediaError;
}

function isShakaError(value: unknown): value is shaka.util.Error & { message?: string } {
  return typeof value === 'object' && value !== null && 'code' in value && 'category' in value;
}
