/**
 * Mock hosts for one element shipped over two engines — mirrors the hls.js-backed and SPF-backed `MuxVideoAdapter`.
 *
 * Exercises: rows only one flavor has (`quality`, `engine`), a native property one flavor overrides and the other
 * forwards (`volume`), and source fields only the primary flavor's source declares.
 */
import { HTMLVideoAdapter } from '../simple';
import type { FlavorSource, FlavorSourceBase } from './source';

export class FlavorHost extends HTMLVideoAdapter {
  static readonly defaultProps = { src: '', source: null, quality: 'auto' };

  #src = '';
  #source: FlavorSource | null = null;
  #quality = 'auto';

  get src(): string {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
  }

  /** Structured source. */
  get source(): FlavorSource | null {
    return this.#source;
  }
  set source(value: FlavorSource | null) {
    this.#source = value;
  }

  /** Quality preset. */
  get quality(): string {
    return this.#quality;
  }
  set quality(value: string) {
    this.#quality = value;
  }

  /** The playback engine instance. */
  get engine(): object | null {
    return null;
  }
}

export class FlavorLiteHost extends HTMLVideoAdapter {
  static readonly defaultProps = { src: '', source: null };

  #src = '';
  #source: FlavorSourceBase | null = null;
  #volume = 1;

  get src(): string {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
  }

  /** Structured source. */
  get source(): FlavorSourceBase | null {
    return this.#source;
  }
  set source(value: FlavorSourceBase | null) {
    this.#source = value;
  }

  get volume(): number {
    return this.#volume;
  }
  set volume(value: number) {
    this.#volume = value;
  }
}
