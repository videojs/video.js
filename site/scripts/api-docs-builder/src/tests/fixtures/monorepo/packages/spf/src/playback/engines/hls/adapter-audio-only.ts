/**
 * Mock SPF audio-only adapter mixin — mirrors HlsAudioMixin.
 *
 * Exercises:
 *   - Cross-package mixin resolution (host lives in core, mixin in spf)
 *   - Defaults declared as `static defaultProps` on the mixin's inner class (SpfAudioOnly.defaultProps), the shape
 *     the SPF adapters use, reached through the composed adapter's extends chain
 *   - Static and `@internal` getters, which stay out of the property table
 *   - `@fires`-declared events: `audiomodechange` also has a dispatch site,
 *     `manifestparsed` is dispatched from a helper the builder never scans —
 *     the `@fires` tag is its only source. `contentdatachange` is typed by the
 *     media contract but is not a standard media event.
 *   - A video-only member (`poster`) kept for a uniform prop shape, as the
 *     audio embeds do; audio references leave it out.
 */
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Adds SPF audio-only HLS playback to a host.
 *
 * @fires manifestparsed - Fired after the multivariant playlist is parsed.
 * @fires audiomodechange - Fired when the audio-only rendition changes.
 * @fires contentdatachange - Fired when `contentData` changes.
 */
export const SpfAudioOnlyMixin = <Base extends Constructor>(BaseClass: Base) => {
  class SpfAudioOnly extends BaseClass {
    static readonly defaultProps = {
      src: '',
      preload: '',
      poster: '',
    };

    #src: string = SpfAudioOnly.defaultProps.src;
    #preload: string = SpfAudioOnly.defaultProps.preload;
    #poster: string = SpfAudioOnly.defaultProps.poster;

    /** Read through the constructor, never the instance. */
    static get alternativeMediaSuggestion(): string | undefined {
      return undefined;
    }

    /**
     * Low-level engine handle.
     *
     * @internal
     */
    get engine(): object {
      return {};
    }

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

    /** Stored without effect: audio has no poster. */
    get poster(): string {
      return this.#poster;
    }

    set poster(value: string) {
      this.#poster = value;
    }
  }

  return SpfAudioOnly as unknown as Base &
    Constructor<{ src: string; preload: string; poster: string }> &
    Pick<typeof SpfAudioOnly, 'defaultProps'>;
};
