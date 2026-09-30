import { parseCloudflareSource } from './cloudflare';
import { parseSpotifySource } from './spotify';
import { parseTikTokSource } from './tiktok';
import { parseTwitchSource } from './twitch';
import { parseVimeoSource } from './vimeo';
import { parseWistiaMediaId } from './wistia';
import { parseYouTubeSource } from './youtube';

/** A type of adapter {@link resolveAdapterType} recognizes. Each type is played by a different media component. */
export type AdapterType =
  | 'youtube'
  | 'vimeo'
  | 'wistia'
  | 'mux'
  | 'cloudflare'
  | 'spotify'
  | 'tiktok'
  | 'twitch'
  | 'hls'
  | 'dash'
  | 'video'
  | 'audio';

/**
 * Resolve which type of adapter plays a source URL, so you can render the media component for it and pass it the same
 * `src`. Recognizes YouTube, Vimeo, Wistia, Mux, Cloudflare Stream, Spotify, TikTok, and Twitch URLs; HLS and DASH
 * manifests; and video and audio files, by MIME type when you pass one and by file extension otherwise.
 *
 * Returns `null` for anything else, including bare ids: an 11-character YouTube id and a 10-character Wistia id look
 * alike, so services are only matched on URLs, `spotify:` URIs, and `youtube/<id>` and `vimeo/<id>` shorthands.
 *
 * `hls` covers every HLS adapter, and `dash` every DASH adapter. Choosing between them is up to you.
 *
 * @param src - The source URL, or a `youtube/<id>` or `vimeo/<id>` shorthand.
 * @param type - The source's MIME type, when known. It takes precedence over the file extension, so manifests and files
 *   without one can still be resolved. Parameters such as `codecs` are ignored.
 * @public
 */
export function resolveAdapterType(src: string, type?: string): AdapterType | null {
  const source = src.trim();
  if (!source) return null;

  return fromService(source) ?? fromMimeType(type) ?? fromMimeType(resolveMimeType(source));
}

/**
 * Resolve a source's MIME type from its file extension, such as `application/x-mpegurl` for `.m3u8` or `video/mp4` for
 * `.mp4`. The query string and hash are ignored.
 *
 * Returns `null` when the URL has no extension or one that isn't an HLS or DASH manifest or a common video or audio
 * file.
 *
 * @param src - The source URL.
 * @public
 */
export function resolveMimeType(src: string): string | null {
  const extension = EXTENSION.exec(src.trim().split(/[?#]/, 1)[0]!)?.[1]?.toLowerCase();

  return (extension && MIME_TYPES.get(extension)) || null;
}

function fromService(src: string): AdapterType | null {
  // Shorthands go through the same parsers the YouTube and Vimeo media use, so the media accepts what matches here.
  if (src.startsWith('youtube/')) return parseYouTubeSource(src) ? 'youtube' : null;

  if (src.startsWith('vimeo/')) return parseVimeoSource(src) ? 'vimeo' : null;

  if (SPOTIFY_URI.test(src)) return parseSpotifySource(src) ? 'spotify' : null;

  const url = parseUrl(src);
  if (!url) return null;

  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return parseYouTubeSource(src) ? 'youtube' : null;

  if (VIMEO_HOSTS.has(host)) return parseVimeoSource(src) ? 'vimeo' : null;

  if (
    isHost(host, 'wistia.com') ||
    isHost(host, 'wistia.net') ||
    isHost(host, 'wi.st') ||
    url.searchParams.has('wvideo')
  ) {
    return parseWistiaMediaId(src) ? 'wistia' : null;
  }

  // `player.mux.com` page URLs aren't matched: Mux media plays stream URLs, with or without the `.m3u8` extension.
  if (host === 'stream.mux.com') return MUX_STREAM_PATH.test(url.pathname) ? 'mux' : null;

  if (isHost(host, 'cloudflarestream.com') || isHost(host, 'videodelivery.net')) {
    return parseCloudflareSource(src) ? 'cloudflare' : null;
  }

  if (host === 'open.spotify.com') return parseSpotifySource(src) ? 'spotify' : null;

  if (TIKTOK_HOSTS.has(host)) return parseTikTokSource(src) ? 'tiktok' : null;

  if (TWITCH_HOSTS.has(host)) return parseTwitchSource(src) ? 'twitch' : null;

  return null;
}

function fromMimeType(type: string | null | undefined): AdapterType | null {
  // Parameters such as `; codecs=…` don't change which media plays the type.
  const mimeType = type?.split(';', 1)[0]!.trim().toLowerCase();
  if (!mimeType) return null;

  if (HLS_TYPES.has(mimeType)) return 'hls';

  if (mimeType === DASH_TYPE) return 'dash';

  if (mimeType.startsWith('video/')) return 'video';

  if (mimeType.startsWith('audio/')) return 'audio';

  return null;
}

function isHost(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Parse an absolute URL, or a host-first one such as `youtu.be/<id>`. Paths and bare ids don't parse. */
function parseUrl(src: string): URL | null {
  if (URL_SCHEME.test(src)) return tryParseUrl(src);

  return HOST_FIRST.test(src) ? tryParseUrl(`https://${src}`) : null;
}

function tryParseUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch {
    return null;
  }
}

const SPOTIFY_URI = /^spotify:/i;
const URL_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
// A dotted host followed by a path, like `youtu.be/<id>`, as opposed to a relative path like `media/video.mp4`.
const HOST_FIRST = /^[\w-]+(?:\.[\w-]+)+\//;
const EXTENSION = /\.([a-z\d]+)$/i;
const MUX_STREAM_PATH = /^\/[^/.]+(?:\.m3u8)?$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
// `vm.tiktok.com` short links carry an opaque code instead of the numeric video id.
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
// `clips.twitch.tv` is a different embed the Twitch media can't play.
const TWITCH_HOSTS = new Set(['twitch.tv', 'www.twitch.tv', 'go.twitch.tv']);

const HLS_TYPES: ReadonlySet<string> = new Set([
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'application/mpegurl',
  'audio/mpegurl',
  'audio/x-mpegurl',
]);
const DASH_TYPE = 'application/dash+xml';

const MIME_TYPES: ReadonlyMap<string, string> = new Map([
  ['m3u8', 'application/x-mpegurl'],
  ['mpd', DASH_TYPE],
  ['mp4', 'video/mp4'],
  ['webm', 'video/webm'],
  ['mov', 'video/quicktime'],
  ['ogv', 'video/ogg'],
  ['mp3', 'audio/mpeg'],
  ['m4a', 'audio/mp4'],
  ['wav', 'audio/wav'],
  ['ogg', 'audio/ogg'],
  ['flac', 'audio/flac'],
  ['aac', 'audio/aac'],
]);
