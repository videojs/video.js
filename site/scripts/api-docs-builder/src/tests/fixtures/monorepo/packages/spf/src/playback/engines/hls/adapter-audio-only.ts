/**
 * Mock SPF audio-only adapter mixin — mirrors HlsAudioMixin.
 *
 * Exercises:
 *   - Cross-package mixin resolution (host lives in core, mixin in spf)
 *   - Defaults declared as `static defaultProps` on the mixin's inner class (SpfAudioOnly.defaultProps), the shape
 *     the SPF adapters use, reached through the composed adapter's extends chain
 *   - `@fires`-declared events: `audiomodechange` also has a dispatch site,
 *     `manifestparsed` is dispatched from a helper the builder never scans —
 *     the `@fires` tag is its only source.
 */
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Adds SPF audio-only HLS playback to a host.
 *
 * @fires manifestparsed - Fired after the multivariant playlist is parsed.
 * @fires audiomodechange - Fired when the audio-only rendition changes.
 */
export const SpfAudioOnlyMixin = <Base extends Constructor>(BaseClass: Base) => {
  class SpfAudioOnly extends BaseClass {
    static readonly defaultProps = {
      src: '',
      preload: '',
    };

    #src: string = SpfAudioOnly.defaultProps.src;
    #preload: string = SpfAudioOnly.defaultProps.preload;

    /** Source URL of the HLS manifest. */
    get src(): string {
      return this.#src;
    }

    set src(value: string) {
      this.#src = value;
      (this as unknown as EventTarget).dispatchEvent(new Event('audiomodechange'));
    }

    /** Preload hint forwarded to the internal audio element. */
    get preload(): string {
      return this.#preload;
    }

    set preload(value: string) {
      this.#preload = value;
    }
  }

  return SpfAudioOnly as unknown as Base & Constructor<{ src: string; preload: string }>;
};
