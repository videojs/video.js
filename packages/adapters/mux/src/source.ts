import type { DrmSystemsConfig } from '@videojs/media';
import type { MediaContentData, MediaResolution } from '@videojs/media';
/**
 * The Mux source: playback identity, the params that modify it, and the URLs derived from both. Engine-neutral on
 * purpose — every Mux Media needs it, and they don't share an engine. Nothing here may reach for a specific one
 * (license-server derivation lives in `../drm.ts`, for the engines that license), because `@videojs/spf` imports this
 * module for its own Mux Media.
 */
import { parseJwt } from '@videojs/utils/jwt';
import { isNil } from '@videojs/utils/predicate';
import { camelCase, snakeCase } from '@videojs/utils/string';

export const MUX_VIDEO_DOMAIN = 'mux.com';

/** Mux's rendition-height shorthand. Alias of {@link MediaResolution}. */
export type MuxResolution = MediaResolution;
export type MuxRenditionOrder = 'desc';
export type MuxImageExt = 'webp' | 'jpg' | 'png';
export type MuxPosterFitMode = 'preserve' | 'stretch' | 'crop' | 'smartcrop' | 'pad';

/**
 * Stream URL params, appended to the URL as `snake_case` query params (`assetStartTime` → `asset_start_time`). A signed
 * playback `token` replaces every other param.
 */
export interface MuxPlaybackParams {
  /**
   * Signed playback token: a JWT with the `v` audience, signed for this playback ID. When set, the stream URL carries
   * the token alone and the other `playback` params are left out of it.
   */
  token?: string | undefined;
  /**
   * Highest rendition resolution Mux puts in the manifest. Applied by Mux's servers: renditions above it are left out
   * of the manifest, so the player never receives them and can't select them, automatically or by hand.
   */
  maxResolution?: MuxResolution | undefined;
  /**
   * Lowest rendition resolution Mux puts in the manifest. Applied by Mux's servers: renditions below it are left out of
   * the manifest, so the player never receives them.
   */
  minResolution?: MuxResolution | undefined;
  /** Order of the renditions in the manifest. `'desc'` lists them from highest to lowest resolution. */
  renditionOrder?: MuxRenditionOrder | undefined;
  /** Start of an instant clip of a live stream, as an epoch time compared to the stream's program date time. */
  programStartTime?: number | undefined;
  /** End of an instant clip of a live stream, as an epoch time compared to the stream's program date time. */
  programEndTime?: number | undefined;
  /** Start of an instant clip, in seconds from the start of the asset. */
  assetStartTime?: number | undefined;
  /** End of an instant clip, in seconds from the start of the asset. */
  assetEndTime?: number | undefined;
  /** Includes HLS redundant streams in the manifest. */
  redundantStreams?: boolean | undefined;
  /** Adds timeline hover preview support for Roku devices to the manifest. */
  rokuTrickPlay?: boolean | undefined;
  /** Language of the subtitle or caption track the manifest marks as default, as a BCP 47 language code. */
  defaultSubtitlesLang?: string | undefined;
  /** Leaves `EXT-X-PROGRAM-DATE-TIME` tags out of the manifest of an asset recorded from a live stream. */
  excludePdt?: boolean | undefined;
  [param: string]: string | number | boolean | undefined;
}

/** Poster image URL params, appended to the URL as `snake_case` query params. A signed `token` replaces the others. */
export interface MuxPosterParams {
  /**
   * Signed image token: a JWT with the `t` audience, signed for this playback ID. When set, the poster URL carries the
   * token alone and the other `poster` params are left out of it. A token with another audience builds no poster URL.
   */
  token?: string | undefined;
  /**
   * Image format, in the URL path (`thumbnail.<ext>`).
   *
   * @default 'webp'
   */
  ext?: MuxImageExt | undefined;
  /**
   * Video time, in seconds, the image is taken from. Without it, Mux takes the image from the middle of the video. On
   * `<mux-video>`, the `poster-time` attribute sets it.
   */
  time?: number | undefined;
  /** Image width in pixels. Without it, Mux uses the width of the original video. */
  width?: number | undefined;
  /** Image height in pixels. Without it, Mux uses the height of the original video. */
  height?: number | undefined;
  /** Clockwise rotation of the image, in degrees. */
  rotate?: number | undefined;
  /** How the image fits within `width` and `height`. */
  fitMode?: MuxPosterFitMode | undefined;
  /** Flips the image top to bottom, after every other transformation. */
  flipV?: boolean | undefined;
  /** Flips the image left to right, after every other transformation. */
  flipH?: boolean | undefined;
  /**
   * Time the image is taken from in an instant clip of a live stream, as an epoch time compared to the stream's program
   * date time.
   */
  programTime?: number | undefined;
  /** Takes the image from the latest frame of a live stream in progress. */
  latest?: boolean | undefined;
  [param: string]: string | number | boolean | undefined;
}

/** Storyboard URL params, appended to the URL as `snake_case` query params. A signed `token` replaces the others. */
export interface MuxStoryboardParams {
  /**
   * Signed storyboard token: a JWT with the `s` audience, signed for this playback ID. When set, the storyboard URL
   * carries the token alone and the other `storyboard` params are left out of it. A token with another audience builds
   * no storyboard URL.
   */
  token?: string | undefined;
  /**
   * Image format of the storyboard tiles the VTT file references.
   *
   * @default 'webp'
   */
  format?: MuxImageExt | undefined;
  [param: string]: string | number | undefined;
}

/** License servers keyed by EME key system, plus a Mux license `token` to derive them from. */
export interface MuxDrmParams extends DrmSystemsConfig {
  /**
   * DRM license token: a JWT with the `d` audience, signed for this playback ID. Derives Mux's FairPlay, Widevine, and
   * PlayReady license servers on the `license.mux.com` host. A token with another audience derives none. Mux serves
   * DRM-protected playback IDs only to signed playback, so the stream also takes a `playback.token`.
   */
  token?: string | undefined;
}

/**
 * What identifies a Mux stream and modifies it, independent of what plays it. Each Mux Media extends it with what its
 * own engine takes; `MuxSource` is the hls.js-backed one.
 */
export interface MuxSourceBase {
  /**
   * Manifest URL, played when there is no `playbackId`, such as a stream Mux doesn't host. Ignored when `playbackId` is
   * set.
   */
  src?: string | undefined;
  /**
   * Mux playback ID. Derives the stream URL `https://stream.mux.com/{playbackId}.m3u8`, the poster URL
   * `https://image.mux.com/{playbackId}/thumbnail.webp` (read through `contentData.poster`), and the storyboard URL
   * `https://image.mux.com/{playbackId}/storyboard.vtt?format=webp` (read through `contentData.storyboard`). The
   * `playback`, `poster`, and `storyboard` params are appended to their URLs.
   */
  playbackId?: string | undefined;
  /** Domain that replaces `mux.com` in the `stream.`, `image.`, and `license.` hosts the URLs are built on. */
  customDomain?: string | undefined;
  /**
   * Params for the stream URL. Mux applies them on its servers, so they change the manifest itself. Params not listed
   * here are appended the same way.
   */
  playback?: MuxPlaybackParams | undefined;
  /**
   * Params for the poster URL. When `playback.token` is set and `poster.token` is not, no poster URL is built. Params
   * not listed here are appended the same way.
   */
  poster?: MuxPosterParams | undefined;
  /**
   * Params for the storyboard URL. When `playback.token` is set and `storyboard.token` is not, no storyboard URL is
   * built. Params not listed here are appended the same way.
   */
  storyboard?: MuxStoryboardParams | undefined;
  /**
   * License servers for protected content, keyed by EME key system (`com.apple.fps`, `com.widevine.alpha`,
   * `com.microsoft.playready`, `org.w3.clearkey`), plus a Mux license `token`. A server named here replaces the one
   * `token` derives for the same key system.
   */
  drm?: MuxDrmParams | undefined;
}

/**
 * Serialize params to a query string (`?a=1&b=2`), mapping camelCase keys to `snake_case` and skipping nullish values.
 * A `token` replaces every other param — signed URLs bake all modifiers into the token itself.
 */
export function createMuxQuery(params: Record<string, unknown> = {}): string {
  const { token, ...rest } = params;
  if (token) return `?${new URLSearchParams({ token: String(token) })}`;

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(rest)) {
    if (!isNil(value)) search.set(snakeCase(key), String(value));
  }

  const query = search.toString();

  return query ? `?${query}` : '';
}

/** Build the Mux HLS stream URL for a source. */
export function createMuxVideoURL(source?: MuxSourceBase | null): string | undefined {
  if (!source?.playbackId) return undefined;

  const { playbackId, customDomain = MUX_VIDEO_DOMAIN, playback } = source;

  if (__DEV__ && playback?.minResolution && playback?.maxResolution) {
    if (Number.parseInt(playback.maxResolution, 10) < Number.parseInt(playback.minResolution, 10)) {
      console.warn(
        `[vjs-mux] minResolution (${playback.minResolution}) must be <= maxResolution (${playback.maxResolution})`
      );
    }
  }

  return `https://stream.${customDomain}/${playbackId}.m3u8${createMuxQuery(playback)}`;
}

/**
 * Parse a Mux stream URL (`https://stream.<domain>/<playback-id>.m3u8?...`, with or without the `.m3u8` extension) into
 * a `MuxSourceBase`, mapping `snake_case` query params back to camelCase playback params. Returns `undefined` for
 * non-Mux URLs.
 */
export function parseMuxVideoURL(src: string): MuxSourceBase | undefined {
  if (!src) return undefined;

  let url: URL;

  try {
    url = new URL(src);
  } catch {
    return undefined;
  }

  const [, domain] = url.hostname.match(/^stream\.(.+)$/) ?? [];
  // Mux serves the manifest with or without `.m3u8`, so both parse, matching what `resolveAdapterType` calls `mux`.
  const [, playbackId] = url.pathname.match(/^\/([^/.]+)(?:\.m3u8)?$/) ?? [];
  if (!domain || !playbackId) return undefined;

  const source: MuxSourceBase = { playbackId };

  if (domain !== MUX_VIDEO_DOMAIN) source.customDomain = domain;

  const playback: MuxPlaybackParams = {};

  for (const [key, value] of url.searchParams) {
    playback[camelCase(key)] = key === 'token' ? value : parseMuxParamValue(value);
  }

  if (Object.keys(playback).length > 0) source.playback = playback;

  return source;
}

/**
 * Coerce a query param string back to the boolean/number types declared on `MuxPlaybackParams`. Numbers only convert
 * when the string round-trips exactly (so `1080p`, `007`, and JWTs stay strings).
 */
function parseMuxParamValue(value: string): string | number | boolean {
  if (value === 'true') return true;

  if (value === 'false') return false;

  if (value !== '' && String(Number(value)) === value) return Number(value);

  return value;
}

/**
 * What a Mux source says about its content, as every Mux Media exposes it through `contentData`.
 *
 * `poster` and `storyboard` are image URLs the source describes rather than plays, derived from it alone. A key is
 * absent when its URL can't be built — no playback ID, or signed playback without a matching image token. `title` comes
 * from the metadata document Mux publishes for the asset, so it arrives once that has loaded — see `MuxMetadataLoader`
 * — and is absent until then, or when the asset has none. The document's other entries ride along under their own
 * keys.
 *
 * The index signature comes from `MediaContentData`, which the shared `contentData` capability is typed as, so it can't
 * be closed off here — extending it is what keeps this assignable to that contract.
 */
export interface MuxContentData extends MediaContentData {
  readonly title?: string;
  readonly poster?: string;
  readonly storyboard?: string;
}

/**
 * Build the poster image URL a source describes. Read through `MuxVideoAdapter`'s `contentData`.
 *
 * @internal
 */
export function createMuxPosterURL(source?: MuxSourceBase | null): string | undefined {
  if (!source?.playbackId) return undefined;

  const { playbackId, customDomain = MUX_VIDEO_DOMAIN, poster, playback } = source;
  const { ext = 'webp', token, ...query } = poster ?? {};
  // Image tokens must carry the image (`t`) audience.
  if (token && parseJwt<MuxJWT>(token)?.aud !== 't') return undefined;

  // Signed playback requires a matching image token; an unsigned URL would be rejected.
  if (!token && playback?.token) return undefined;

  return `https://image.${customDomain}/${playbackId}/thumbnail.${ext}${createMuxQuery({ token, ...query })}`;
}

/**
 * Build the storyboard (thumbnail sprite) VTT URL a source describes. Read through `MuxVideoAdapter`'s `contentData`.
 *
 * @internal
 */
export function createMuxStoryboardURL(source?: MuxSourceBase | null): string | undefined {
  if (!source?.playbackId) return undefined;

  const { playbackId, customDomain = MUX_VIDEO_DOMAIN, storyboard, playback } = source;
  const { token, ...query } = storyboard ?? {};
  // Storyboard tokens must carry the storyboard (`s`) audience.
  if (token && parseJwt<MuxJWT>(token)?.aud !== 's') return undefined;

  // Signed playback requires a matching storyboard token; an unsigned URL would be rejected.
  if (!token && playback?.token) return undefined;

  return `https://image.${customDomain}/${playbackId}/storyboard.vtt${createMuxQuery({ token, format: 'webp', ...query })}`;
}

export type MuxJWT = {
  sub: string;
  aud: 'v' | 't' | 'g' | 's' | 'd';
  exp: number;
};
