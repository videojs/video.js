import {
  type AdapterType,
  adapterTypeForMimeType,
  matchServiceHost,
  parseSourceUrl,
  resolveMimeType,
} from './adapter-type';

/**
 * A media component `LazyVideo` can resolve a source to, named by its module under `media/`. `video` is the browser's
 * own `<video>`.
 *
 * @internal
 */
export type LazyVideoMediaName =
  | 'video'
  | 'native-hls-video'
  | 'hlsjs-video'
  | 'dash-video'
  | 'mux-video'
  | 'youtube-video'
  | 'vimeo-video';

/**
 * A media component `LazyAudio` can resolve a source to, named by its module under `media/`. `audio` is the browser's
 * own `<audio>`.
 *
 * @internal
 */
export type LazyAudioMediaName = 'audio' | 'hls-audio' | 'mux-audio';

/**
 * The playback path a lazy media prefers for HLS: `'native'` uses the browser's own HLS support where there is one, and
 * `'mse'` always loads an engine.
 *
 * @internal
 */
export type LazyMediaPlayback = 'native' | 'mse';

/** @internal */
export interface ResolveLazyMediaOptions {
  /** MIME type of the source. Takes precedence over its file extension. */
  type?: string | undefined;
  /**
   * Whether HLS plays natively by default here, as on Safari, or `undefined` while that isn't known, such as during
   * server rendering.
   */
  nativeHls: boolean | undefined;
  /** Defaults to `'native'`. */
  preferPlayback?: LazyMediaPlayback | undefined;
}

/**
 * Resolve which media component `LazyVideo` renders for a source.
 *
 * Returns `null` for a source no supported media plays, and `undefined` when the choice depends on `nativeHls` and it
 * isn't known yet.
 *
 * @internal
 */
export function resolveLazyVideoMedia(
  src: string,
  options: ResolveLazyMediaOptions
): LazyVideoMediaName | null | undefined {
  switch (resolveLazyAdapterType(src, options.type)) {
    case 'youtube':
      return 'youtube-video';
    case 'vimeo':
      return 'vimeo-video';
    case 'mux':
      return 'mux-video';
    case 'dash':
      return 'dash-video';
    case 'hls':
      return resolveHls(options, 'native-hls-video', 'hlsjs-video');
    // A `<video>` plays audio files too.
    case 'video':
    case 'audio':
      return 'video';
    default:
      return null;
  }
}

/**
 * Resolve which media component `LazyAudio` renders for a source.
 *
 * Returns `null` for a source no supported media plays, and `undefined` when the choice depends on `nativeHls` and it
 * isn't known yet.
 *
 * @internal
 */
export function resolveLazyAudioMedia(
  src: string,
  options: ResolveLazyMediaOptions
): LazyAudioMediaName | null | undefined {
  switch (resolveLazyAdapterType(src, options.type)) {
    case 'mux':
      return 'mux-audio';
    // An `<audio>` plays native HLS on its own, so there is no engine to load.
    case 'hls':
      return resolveHls(options, 'audio', 'hls-audio');
    // An `<audio>` plays the audio of a video file.
    case 'audio':
    case 'video':
      return 'audio';
    default:
      return null;
  }
}

/**
 * `resolveAdapterType` without the service parsers, which are most of its weight. Services match by host or shorthand,
 * and the media they resolve to checks the id itself.
 */
function resolveLazyAdapterType(src: string, type: string | undefined): AdapterType | null {
  const source = src.trim();
  if (!source) return null;

  return fromService(source) ?? adapterTypeForMimeType(type) ?? adapterTypeForMimeType(resolveMimeType(source));
}

function fromService(src: string): AdapterType | null {
  if (YOUTUBE_SHORTHAND.test(src)) return 'youtube';

  if (VIMEO_SHORTHAND.test(src)) return 'vimeo';

  const url = parseSourceUrl(src);

  return url && matchServiceHost(url);
}

// The shorthands the YouTube and Vimeo media accept, matched by shape so a path like `youtube/intro.mp4` stays a file.
const YOUTUBE_SHORTHAND = /^youtube\/(?:shorts\/)?[\w-]{11}(?:[?#]|$)/;
const VIMEO_SHORTHAND = /^vimeo\/\d+(?:[/?#]|$)/;

function resolveHls<Name extends string>(
  { nativeHls, preferPlayback = 'native' }: ResolveLazyMediaOptions,
  native: Name,
  mse: Name
): Name | undefined {
  if (preferPlayback === 'mse') return mse;

  if (nativeHls === undefined) return undefined;

  return nativeHls ? native : mse;
}
