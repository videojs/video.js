import type { EngineAdapter } from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import { deepEqual } from '@videojs/utils/object';
import * as dashjs from 'dashjs';

import { DashMediaTracksMixin } from './media-tracks';

/**
 * Structured DASH source: which source to play, plus how to play it.
 *
 * @experimental
 */
export interface DashSource {
  /** MPD URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: DashEngineConfig | undefined;
}

/**
 * The engines a DASH source can configure.
 *
 * @experimental
 */
export interface DashEngineConfig {
  /** Dash.js's own settings, passed through untouched. Replacing them resets any previously applied settings. */
  dashJs?: dashjs.MediaPlayerSettingClass | undefined;
}

/** @experimental */
export interface DashAdapterProps {
  src: string;
  source: DashSource | null;
}

class DashAdapterCore
  extends MediaTracksMixin(HTMLVideoAdapter)
  implements EngineAdapter<dashjs.MediaPlayerClass, HTMLVideoElement>, DashAdapterProps
{
  static readonly defaultProps: DashAdapterProps = {
    src: '',
    source: null,
  };

  #engine: dashjs.MediaPlayerClass;
  #src = DashAdapterCore.defaultProps.src;
  #source: DashSource | null = DashAdapterCore.defaultProps.source;

  constructor() {
    super();
    this.#engine = dashjs.MediaPlayer().create();
    this.#engine.initialize(undefined, undefined, false);
  }

  attach(target: HTMLVideoElement) {
    super.attach(target);
    this.#engine.attachView(target);
  }

  detach() {
    super.detach();
    // dash.js types don't reflect null support, but null is valid for detaching
    this.#engine.attachView(null as unknown as HTMLVideoElement);
  }

  destroy() {
    this.detach();
    this.#engine.destroy();
    super.destroy();
  }

  /**
   * Underlying playback engine — the dash.js `MediaPlayerClass` instance. An advanced escape hatch for direct engine
   * access; normal playback is driven through this element's own properties and methods.
   */
  get engine() {
    return this.#engine;
  }

  get src() {
    return this.#src;
  }

  /** MPD URL. Setting it re-derives `source`, carrying its settings over. */
  set src(value) {
    const { engine } = this.#source ?? {};
    const next: DashSource = { ...(engine && { engine }), ...(value && { src: value }) };

    // Everything happens in the `source` setter, so there is one path for
    // storing it, telling the engine, and dispatching `sourcechange`.
    this.source = Object.keys(next).length > 0 ? next : null;
  }

  /**
   * Structured source: the MPD URL in `src`, plus dash.js settings in `engine.dashJs`. Replacing it re-derives `src`.
   *
   * Dash.js takes settings on a live player, so changing `engine.dashJs` re-applies them in place instead of recreating
   * the engine.
   */
  get source(): DashSource | null {
    return this.#source;
  }

  set source(value: DashSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs
    // nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';

    // Assigning is always a source change, so it is always announced. Only the
    // engine calls are guarded, so re-assigning an equivalent source — an inline
    // React prop, say — never disturbs what is already playing.
    const configChanged = !deepEqual(this.#source?.engine?.dashJs ?? null, source?.engine?.dashJs ?? null);
    const srcChanged = this.#src !== src;

    this.#source = source;
    this.#src = src;

    if (configChanged) this.#applyEngineConfig(source?.engine?.dashJs);

    if (srcChanged) this.#engine.attachSource(src);

    this.dispatchEvent(new Event('sourcechange'));
  }

  // `engine.dashJs` is replaced, not merged, but dash.js merges every
  // `updateSettings()` call into the current settings — reset first so dropping
  // a key clears it instead of leaving the previous value behind.
  #applyEngineConfig(settings?: dashjs.MediaPlayerSettingClass) {
    this.#engine.resetSettings();

    if (settings) this.#engine.updateSettings(settings);
  }
}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by resolving a new `src`. Read `source` for the
 *   new value.
 * @experimental
 */
export class DashAdapter extends DashMediaTracksMixin(DashAdapterCore) {}
