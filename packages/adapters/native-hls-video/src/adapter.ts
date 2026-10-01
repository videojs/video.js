import { type DrmSystemsConfig, type MediaStreamType, MediaStreamTypes } from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';

import { NativeHlsDrmMixin } from './drm';
import { NativeHlsErrorsMixin } from './errors';
import { NativeHlsLiveMixin } from './live';
import { NativeHlsStreamTypeMixin } from './stream-type';

export type PreloadType = '' | 'none' | 'metadata' | 'auto';
export type StreamType = MediaStreamType;

/** @internal */
export const StreamTypes = MediaStreamTypes;

export interface NativeHlsAdapterProps {
  src: string;
  source: NativeHlsSource | null;
  preload: PreloadType;
  streamType: StreamType;
}

/**
 * Structured native HLS source: which source to play, plus how to play it.
 *
 * Playback options sit under `engine`, keyed by engine, rather than at the top level. Native HLS is one of two paths
 * `HlsJsVideo` can take, and namespacing by engine lets a single source describe both without either reading the
 * other's options.
 */
export interface NativeHlsSource {
  /** Manifest URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /**
   * License servers for protected content, keyed by EME key system id. Safari negotiates keys itself and reaches
   * FairPlay only, so the `com.apple.fps` entry is the one read here — the rest can ride along for an engine that can
   * negotiate them.
   */
  drm?: DrmSystemsConfig | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: NativeHlsEngineConfig | undefined;
}

/** The engines a native HLS source can configure. */
export interface NativeHlsEngineConfig {
  /** Options for the browser's own HLS playback. */
  nativeHls?: NativeHlsConfig | undefined;
}

/**
 * Native HLS playback options. There is no JS engine to configure here — the browser plays the manifest itself — so
 * this is what Video.js does around it.
 */
export interface NativeHlsConfig {
  /**
   * License servers for protected content, keyed by EME key system id. An escape hatch for licensing native playback
   * differently from every other path: naming it replaces `source.drm` here, and nowhere else.
   */
  drmSystems?: DrmSystemsConfig | undefined;
}

class NativeHlsAdapterCore extends HTMLVideoAdapter implements Omit<NativeHlsAdapterProps, 'streamType'> {
  static readonly defaultProps: NativeHlsAdapterProps = {
    src: '',
    source: null,
    preload: 'metadata',
    streamType: MediaStreamTypes.UNKNOWN,
  };

  #src = NativeHlsAdapterCore.defaultProps.src;
  #source: NativeHlsSource | null = NativeHlsAdapterCore.defaultProps.source;
  #preload = NativeHlsAdapterCore.defaultProps.preload;

  /** Underlying playback engine — always `null`. Native HLS has no JS engine; the browser handles playback directly. */
  get engine() {
    return null;
  }

  /**
   * Media source URL. Assigning it replaces the identity half of `source` and leaves `engine` intact, so changing the
   * URL never disturbs key exchange.
   *
   * Like the element's own `src`, assigning it always loads — including the URL already playing.
   */
  get src() {
    return this.#src;
  }

  set src(src: string) {
    // `src` says which source to play; everything else says how to play it, so
    // it carries over.
    const { drm, engine } = this.#source ?? {};
    const next: NativeHlsSource = {
      ...(drm && { drm }),
      ...(engine && { engine }),
      ...(src && { src }),
    };

    this.#source = Object.keys(next).length > 0 ? next : null;
    this.#src = src;

    if (this.target) this.target.src = src;
  }

  /**
   * Structured source: what to play (`src`) plus how to play it (`engine.nativeHls`). Assigning it derives `src`.
   *
   * Only a new URL reaches the element, so reassigning an equivalent source neither reloads nor disturbs key exchange.
   * Use `src` or `load()` to reload what is already playing.
   *
   * Changing this source does not emit `sourcechange`. When the hls.js media component uses native HLS playback, it
   * emits its own `sourcechange` and forwards the native playback events.
   */
  get source(): NativeHlsSource | null {
    return this.#source;
  }

  set source(value: NativeHlsSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs
    // nothing.
    if (source === this.#source) return;

    const src = source?.src ?? '';
    // Assigning the element's `src` restarts the media load algorithm, even for
    // the URL it already holds, so only a different one reaches it. Nothing else
    // here is read up front — the DRM options are read when a key request
    // arrives — so an equivalent source cannot interrupt playback.
    const srcChanged = this.#src !== src;

    this.#source = source;
    this.#src = src;

    if (srcChanged && this.target) this.target.src = src;
  }

  /** Preload type (`'none'` / `'metadata'` / `'auto'`). */
  get preload() {
    return this.#preload;
  }

  set preload(value: PreloadType) {
    this.#preload = value;

    if (this.target) this.target.preload = value;
  }

  attach(target: HTMLVideoElement) {
    super.attach(target);

    if (this.preload !== target.preload) target.preload = this.preload;

    if (this.src) target.src = this.src;
  }
}

export class NativeHlsAdapter extends NativeHlsLiveMixin(
  NativeHlsStreamTypeMixin(NativeHlsDrmMixin(NativeHlsErrorsMixin(NativeHlsAdapterCore)))
) {}
