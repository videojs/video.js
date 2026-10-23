import {
  type AdapterType,
  adapterTypeForMimeType,
  matchServiceHost,
  parseSourceUrl,
  resolveMimeType,
  SPOTIFY_URI,
} from './adapter-type';

/** A source as lazy media sees it, worked out once so each media's `match` stays cheap. */
export interface LazySource {
  /** The trimmed source URL. */
  src: string;
  /** The MIME type the source was given, if any. */
  type: string | undefined;
  /** `src` parsed as a URL, or `null` for a path or bare id. */
  url: URL | null;
  /**
   * The kind of source by host, MIME type, or file extension, with the same names `resolveAdapterType` returns. A media
   * file on a service host, such as a direct Vimeo MP4, counts as that file.
   */
  adapterType: AdapterType | null;
  /** How HLS should play here, or `undefined` while that isn't known, such as during server rendering. */
  playback: 'native' | 'mse' | undefined;
}

/** A media lazy media can render, by the sources it plays. */
export interface LazyMediaMatcher {
  /**
   * Whether this media plays the source. Return `undefined` when it can't tell yet; the media isn't chosen until it
   * can, and nothing after it is tried.
   */
  match(source: LazySource): boolean | undefined;
}

/**
 * How the browser plays HLS without an engine: `'preferred'` by default, `'supported'` when it can but an engine plays
 * better, or `'unsupported'`.
 *
 * @internal
 */
export type NativeHlsSupport = 'preferred' | 'supported' | 'unsupported';

/** @internal */
export interface ResolveLazySourceOptions {
  /** MIME type of the source. Takes precedence over its file extension. */
  type?: string | undefined;
  /**
   * `'native'` plays HLS natively wherever the browser can, and `'mse'` always loads an engine. Unset, HLS plays
   * natively only where that's the browser's preferred path.
   */
  preferPlayback?: 'native' | 'mse' | undefined;
  /** `undefined` while it isn't known, such as during server rendering. */
  nativeHls: NativeHlsSupport | undefined;
}

/**
 * Work out a source once for every media's `match`. Returns `null` for an empty source.
 *
 * @internal
 */
export function resolveLazySource(src: string, options: ResolveLazySourceOptions): LazySource | null {
  const source = src.trim();
  if (!source) return null;

  // `resolveAdapterType`'s service step without the per-service parsers, which are most of its weight: services match
  // by host or `spotify:` URI, and the media they resolve to checks the id itself.
  const url = parseSourceUrl(source);
  const service = SPOTIFY_URI.test(source) ? 'spotify' : url && matchServiceHost(url);
  const mimeType = resolveMimeType(source);

  return {
    src: source,
    type: options.type,
    url,
    adapterType:
      // A media file on a service host plays as that file; Mux and Cloudflare streams are manifests.
      (!mimeType || service === 'mux' || service === 'cloudflare' ? service : null) ??
      adapterTypeForMimeType(options.type) ??
      adapterTypeForMimeType(mimeType),
    playback: resolvePlayback(options),
  };
}

/**
 * The first media that plays a source: `null` when none does, or `undefined` while an earlier one can't tell yet.
 *
 * @internal
 */
export function findLazyMedia<Media extends LazyMediaMatcher>(
  medias: readonly Media[],
  source: LazySource | null
): Media | null | undefined {
  if (!source) return null;

  for (const media of medias) {
    const matched = media.match(source);
    if (matched !== false) return matched ? media : undefined;
  }

  return null;
}

/**
 * A `match` for media that play any of the given kinds of source.
 *
 * @internal
 */
export function matchAdapterType(...types: AdapterType[]): LazyMediaMatcher['match'] {
  return ({ adapterType }) => !!adapterType && types.includes(adapterType);
}

/**
 * A `match` for HLS media that play by one path, native or MSE.
 *
 * @internal
 */
export function matchHls(playback: 'native' | 'mse'): LazyMediaMatcher['match'] {
  return ({ adapterType, playback: path }) => adapterType === 'hls' && path && path === playback;
}

function resolvePlayback({ preferPlayback, nativeHls }: ResolveLazySourceOptions): LazySource['playback'] {
  if (preferPlayback === 'mse') return 'mse';

  if (!nativeHls) return undefined;

  const native = preferPlayback === 'native' ? nativeHls !== 'unsupported' : nativeHls === 'preferred';

  return native ? 'native' : 'mse';
}
