/**
 * Mock complex host — mirrors HlsMedia.
 *
 * Exercises: multiple getter/setter pairs with JSDoc descriptions,
 * readonly properties, boolean type, overlap with native attributes
 * (src, preload) that should be deduplicated by the builder, and default
 * values declared as a `static defaultProps` literal on the class (mirrors HlsJsAdapter)
 * including a member reference back into it.
 */
import { MediaStreamTypes } from '../../core/types';
import { HTMLVideoAdapter } from '../simple';

/**
 * @fires sourcechange - Fired when the source changes.
 */
export class ComplexHost extends HTMLVideoAdapter {
  static readonly defaultProps = {
    src: '',
    type: undefined,
    preferPlayback: 'mse',
    config: {},
    debug: false,
    preload: 'metadata',
    streamType: MediaStreamTypes.UNKNOWN,
  };

  #src: string = '';
  #type: string | undefined;
  #preferPlayback: string | undefined = 'mse';
  #config: Record<string, unknown> = {};
  #debug: boolean = false;
  #preload: string = 'metadata';
  #engine: object | null = null;
  #streamType: string = ComplexHost.defaultProps.streamType;

  get src(): string {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;
  }

  /** Explicit source type. When unset, inferred from the source URL extension. */
  get type(): string | undefined {
    return this.#type;
  }

  set type(value: string | undefined) {
    this.#type = value;
  }

  /** Whether to prefer `'mse'` or `'native'` playback. */
  get preferPlayback(): string | undefined {
    return this.#preferPlayback;
  }

  set preferPlayback(value: string | undefined) {
    this.#preferPlayback = value;
  }

  get config(): Record<string, unknown> {
    return this.#config;
  }

  set config(value: Record<string, unknown>) {
    this.#config = value;
  }

  /** Enable debug logging. */
  get debug(): boolean {
    return this.#debug;
  }

  set debug(value: boolean) {
    this.#debug = value;
  }

  get preload(): string {
    return this.#preload;
  }

  set preload(value: string) {
    this.#preload = value;
  }

  /** The underlying playback engine instance. */
  get engine(): object | null {
    return this.#engine;
  }

  /** Callback invoked when playback is ready. */
  get onReady(): ((value: string) => void) | undefined {
    return undefined;
  }

  /** Current stream type. */
  get streamType(): string {
    return this.#streamType;
  }

  set streamType(value: string) {
    this.#streamType = value;
  }
}
