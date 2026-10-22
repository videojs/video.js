import {
  type AdapterType,
  adapterTypeForMimeType,
  matchServiceHost,
  parseSourceUrl,
  resolveMimeType,
  SPOTIFY_URI,
} from './adapter-type';
import { VIMEO_SHORTHAND_SRC } from './vimeo';
import { YOUTUBE_SHORTHAND_SRC } from './youtube';

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
  | 'vimeo-video'
  | 'wistia-video'
  | 'cloudflare-video'
  | 'tiktok-video'
  | 'twitch-video';

/**
 * A media component `LazyAudio` can resolve a source to, named by its module under `media/`. `audio` is the browser's
 * own `<audio>`.
 *
 * @internal
 */
export type LazyAudioMediaName = 'audio' | 'hls-audio' | 'mux-audio' | 'spotify-audio';

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
  const type = resolveLazyAdapterType(src, options.type);

  // Each service's media module is named after it.
  switch (type) {
    case 'youtube':
    case 'vimeo':
    case 'wistia':
    case 'cloudflare':
    case 'tiktok':
    case 'twitch':
    case 'mux':
    case 'dash':
      return `${type}-video` as const;
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
  const type = resolveLazyAdapterType(src, options.type);

  switch (type) {
    case 'mux':
    case 'spotify':
      return `${type}-audio` as const;
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
 * `resolveAdapterType` without the service parsers, which are most of its weight: services match by host or shorthand,
 * and the media they resolve to checks the id itself. A media file on a service host, such as a direct Vimeo MP4, plays
 * as that file; Mux and Cloudflare are exempt because their streams are manifests.
 */
function resolveLazyAdapterType(src: string, type: string | undefined): AdapterType | null {
  const source = src.trim();
  if (!source) return null;

  return fromService(source) ?? adapterTypeForMimeType(type) ?? adapterTypeForMimeType(resolveMimeType(source));
}

function fromService(src: string): AdapterType | null {
  if (YOUTUBE_SHORTHAND_SRC.test(src)) return 'youtube';

  if (VIMEO_SHORTHAND_SRC.test(src)) return 'vimeo';

  if (SPOTIFY_URI.test(src)) return 'spotify';

  const url = parseSourceUrl(src);
  const service = url && matchServiceHost(url);
  if (!service || service === 'mux' || service === 'cloudflare') return service;

  return resolveMimeType(src) ? null : service;
}

function resolveHls<Name extends string>(
  { nativeHls, preferPlayback = 'native' }: ResolveLazyMediaOptions,
  native: Name,
  mse: Name
): Name | undefined {
  if (preferPlayback === 'mse') return mse;

  if (nativeHls === undefined) return undefined;

  return nativeHls ? native : mse;
}
