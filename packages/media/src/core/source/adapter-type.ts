import { parseCloudflareSource } from './cloudflare';
import { parseMixcloudSource } from './mixcloud';
import { parseSoundCloudSource } from './soundcloud';
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
  | 'soundcloud'
  | 'mixcloud'
  | 'tiktok'
  | 'twitch'
  | 'hls'
  | 'dash'
  | 'video'
  | 'audio';

/**
 * Resolve which type of adapter plays a source URL, so you can render the media component for it and pass it the same
 * `src`. Recognizes YouTube, Vimeo, Wistia, Mux, Cloudflare Stream, Spotify, SoundCloud, Mixcloud, TikTok, and Twitch
 * URLs; HLS and DASH manifests; and video and audio files, by MIME type when you pass one and by file extension
 * otherwise.
 *
 * Returns `null` for anything else, including bare ids: an 11-character YouTube id and a 10-character Wistia id look
 * alike, so services are only matched on URLs and `spotify:` URIs.
 *
 * `hls` covers every HLS adapter, and `dash` every DASH adapter. Choosing between them is up to you.
 *
 * @param src - The source URL, or a `spotify:` URI.
 * @param type - The source's MIME type, when known. It takes precedence over the file extension, so manifests and files
 *   without one can still be resolved. Parameters such as `codecs` are ignored.
 * @public
 */
export function resolveAdapterType(src: string, type?: string): AdapterType | null {
  const source = src.trim();
  if (!source) return null;

  return fromService(source) ?? adapterTypeForMimeType(type) ?? adapterTypeForMimeType(resolveMimeType(source));
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
  const extension = EXTENSION.exec(src.trim())?.[1]!.toLowerCase();

  return (extension && MIME_TYPES.get(extension)) || null;
}

/** A service {@link matchServiceHost} recognizes by host. */
type ServiceType = Exclude<AdapterType, 'hls' | 'dash' | 'video' | 'audio'>;

// Each service's parser confirms the URL names something its media can play.
const SERVICE_PARSERS: Record<ServiceType, (src: string) => unknown> = {
  youtube: parseYouTubeSource,
  vimeo: parseVimeoSource,
  wistia: parseWistiaMediaId,
  mux: () => true,
  cloudflare: parseCloudflareSource,
  spotify: parseSpotifySource,
  soundcloud: parseSoundCloudSource,
  mixcloud: parseMixcloudSource,
  tiktok: parseTikTokSource,
  twitch: parseTwitchSource,
};

function fromService(src: string): AdapterType | null {
  if (SPOTIFY_URI.test(src)) return parseSpotifySource(src) ? 'spotify' : null;

  const url = parseSourceUrl(src);
  const service = url && matchServiceHost(url);

  return service && SERVICE_PARSERS[service](src) ? service : null;
}

/**
 * Match a source URL to a service by host alone, without parsing it for an id. A Mux URL must also have a stream path.
 * A `wvideo` query parameter marks a Wistia popover on any other page.
 *
 * @internal
 */
export function matchServiceHost({ hostname, pathname, searchParams }: URL): ServiceType | null {
  const hostPath = hostname + pathname;


  return (
    // SAFETY: `SERVICE_HOSTS` has exactly one key per service.
    (Object.keys(SERVICE_HOSTS) as ServiceType[]).find((service) => SERVICE_HOSTS[service].test(hostPath)) ??
    (searchParams.has('wvideo') ? 'wistia' : null)
  );
}

/**
 * Map a MIME type to the adapter type that plays it: `hls`, `dash`, `video`, or `audio`. Parameters such as `codecs`
 * are ignored.
 *
 * @internal
 */
export function adapterTypeForMimeType(type: string | null | undefined): AdapterType | null {
  // Parameters such as `; codecs=…` don't change which media plays the type.
  const mimeType = (type ?? '').split(';', 1)[0]!.trim().toLowerCase();
  if (HLS_TYPE.test(mimeType)) return 'hls';

  if (mimeType === DASH_TYPE) return 'dash';

  // SAFETY: `FILE_TYPE` captures only `video` or `audio`.
  return (FILE_TYPE.exec(mimeType)?.[1] as 'video' | 'audio' | undefined) ?? null;
}

/**
 * Parse an absolute URL, or a host-first one such as `youtu.be/<id>`. Paths and bare ids don't parse.
 *
 * @internal
 */
export function parseSourceUrl(src: string): URL | null {
  try {
    return new URL(HOST_FIRST.test(src) ? `https://${src}` : src);
  } catch {
    return null;
  }
}

/** @internal */
export const SPOTIFY_URI = /^spotify:/i;
// A dotted host followed by a path, like `youtu.be/<id>`, as opposed to a relative path like `media/video.mp4`.
const HOST_FIRST = /^[\w-]+(\.[\w-]+)+\//;
// The extension at the end of the path, before any query string or hash.
const EXTENSION = /^[^?#]*\.(\w+)([?#]|$)/;

// Each pattern matches `hostname + pathname`, in order of precedence.
const SERVICE_HOSTS = {
  youtube: /^((www|m)\.)?youtube(-nocookie)?\.com\/|^youtu\.be\//,
  vimeo: /^((www|player)\.)?vimeo\.com\//,
  wistia: /^([^/]+\.)?(wistia\.(com|net)|wi\.st)\//,
  // `player.mux.com` page URLs aren't matched: Mux media plays stream URLs, with or without the `.m3u8` extension.
  mux: /^stream\.mux\.com\/[^/.]+(\.m3u8)?$/,
  cloudflare: /^([^/]+\.)?(cloudflarestream\.com|videodelivery\.net)\//,
  spotify: /^open\.spotify\.com\//,
  soundcloud: /^([^/]+\.)?soundcloud\.com\//,
  mixcloud: /^([^/]+\.)?mixcloud\.com\//,
  // `vm.tiktok.com` short links carry an opaque code instead of the numeric video id.
  tiktok: /^(www\.)?tiktok\.com\//,
  // `clips.twitch.tv` is a different embed the Twitch media can't play.
  twitch: /^((www|go)\.)?twitch\.tv\//,
} satisfies Record<ServiceType, RegExp>;

const HLS_TYPE = /^(application|audio)\/(vnd\.apple\.|x-)?mpegurl$/;
const DASH_TYPE = 'application/dash+xml';
const FILE_TYPE = /^(video|audio)\//;

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
