/**
 * Mock extending host — mirrors MuxVideoAdapter extending HlsMedia.
 *
 * Exercises: host inheritance. The builder must walk the extends chain
 * to extract properties from both this class and its parent (ComplexHost).
 * Child properties and `@fires` descriptions override the parent's. Defaults
 * spread the parent's `static defaultProps` (mirrors MuxVideoAdapter) — the
 * builder must resolve the spread through the class. `customDomain`
 * deliberately has no default.
 */
import { ComplexHost } from '../complex';

/**
 * @fires sourcechange - Fired when the source changes, and again when the playback ID resolves to a stream.
 */
export class ExtendingHost extends ComplexHost {
  static readonly defaultProps = {
    ...ComplexHost.defaultProps,
    playbackId: '',
    tokens: { drm: '' },
    maxResolution: 1080,
  };

  #playbackId: string = '';
  #customDomain: string = '';
  #tokens: Record<string, string> = { ...ExtendingHost.defaultProps.tokens };
  #maxResolution: number = ExtendingHost.defaultProps.maxResolution;

  /** The playback ID for the video. */
  get playbackId(): string {
    return this.#playbackId;
  }

  set playbackId(value: string) {
    this.#playbackId = value;
  }

  /** Custom domain for asset delivery. */
  get customDomain(): string {
    return this.#customDomain;
  }

  set customDomain(value: string) {
    this.#customDomain = value;
  }

  /** Playback tokens keyed by purpose. */
  get tokens(): Record<string, string> {
    return this.#tokens;
  }

  set tokens(value: Record<string, string>) {
    this.#tokens = value;
  }

  /** Maximum rendition height to request. */
  get maxResolution(): number {
    return this.#maxResolution;
  }

  set maxResolution(value: number) {
    this.#maxResolution = value;
  }

  /** Overrides parent debug — adds network logging. */
  get debug(): boolean {
    return super.debug;
  }

  set debug(value: boolean) {
    super.debug = value;
  }
}
