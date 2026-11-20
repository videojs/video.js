/**
 * Mock structured sources — mirror `MuxSourceBase` and the hls.js-backed `MuxSource`.
 *
 * Exercises: source fields documented as sub-rows, nested authored interfaces expanded under a dotted name, `engine`
 * expanded one level only, `@internal` and `never` fields left out, a redeclared field keeping the inherited JSDoc, and
 * `@default` tags.
 */

/** Signed and server-side stream params. */
export interface FlavorPlaybackParams {
  /** Signed playback token. Replaces the other params. */
  token?: string | undefined;
  /** Highest rendition the server puts in the manifest. */
  maxResolution?: string | undefined;
  [param: string]: string | undefined;
}

/** Options for the fast engine; documented in its own section, so never expanded here. */
export interface FastEngineConfig {
  /** Buffer ahead, in seconds. */
  bufferAhead?: number | undefined;
}

/** The engines a flavor source can configure. */
export interface FlavorEngineConfig {
  /** The fast engine's own options. */
  fast?: FastEngineConfig | undefined;
}

/** What every flavor's source takes. */
export interface FlavorSourceBase {
  /** Manifest URL, played when there is no `playbackId`. */
  src?: string | undefined;
  /** Playback ID the URLs derive from. */
  playbackId?: string | undefined;
  /** Params for the stream URL. */
  playback?: FlavorPlaybackParams | undefined;
  /** License servers keyed by key system. */
  drm?: Record<string, string> | undefined;
  /** @internal */
  debugTag?: string | undefined;
}

/** The primary flavor's source: the base plus what its engine takes. */
export interface FlavorSource extends FlavorSourceBase {
  /** Highest resolution adaptive selection picks on its own. */
  maxAutoResolution?: string | undefined;
  /**
   * Whether the element's size caps selection.
   *
   * @default true
   */
  capToPlayerSize?: boolean | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: FlavorEngineConfig | undefined;
  // Redeclared without JSDoc: the row keeps the base's description.
  drm?: Record<string, string> | undefined;
  /** The other half of a discriminated union; never documented. */
  legacyUrl?: never;
}
