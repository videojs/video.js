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
 * Playback modifiers appended to the stream URL as `snake_case` query params (e.g. `assetStartTime` →
 * `asset_start_time`). A signed playback `token` replaces every other param — they must be baked into the signing
 * token.
 */
export interface MuxPlaybackParams {
  token?: string | undefined;
  /** Maximum resolution of renditions included in the manifest. */
  maxResolution?: MuxResolution | undefined;
  /** Minimum resolution of renditions included in the manifest. */
  minResolution?: MuxResolution | undefined;
  /** Logic to order renditions in the HLS manifest. */
  renditionOrder?: MuxRenditionOrder | undefined;
  /** Start time for instant-clipping assets, as an epoch integer compared to the stream's program date time. */
  programStartTime?: number | undefined;
  /** End time for instant-clipping assets, as an epoch integer compared to the stream's program date time. */
  programEndTime?: number | undefined;
  /** Relative start time of the asset (in seconds) when using the instant clipping feature. */
  assetStartTime?: number | undefined;
  /** Relative end time of the asset (in seconds) when using the instant clipping feature. */
  assetEndTime?: number | undefined;
  /** Include HLS redundant streams in the manifest. */
  redundantStreams?: boolean | undefined;
  /** Add support for timeline hover previews on Roku devices. */
  rokuTrickPlay?: boolean | undefined;
  /** Default subtitles/captions language (BCP 47 compliant language code). */
  defaultSubtitlesLang?: string | undefined;
  /** Omit `EXT-X-PROGRAM-DATE-TIME` tags from HLS manifests for assets from live streams. */
  excludePdt?: boolean | undefined;
  [param: string]: string | number | boolean | undefined;
}

/**
 * Modifiers for the poster still, appended to the image URL as `snake_case` query params. Mux serves it from its
 * `thumbnail` image endpoint.
 */
export interface MuxPosterParams {
  token?: string | undefined;
  /** Image format used in the URL path (`thumbnail.<ext>`). Defaults to `webp`. */
  ext?: MuxImageExt | undefined;
  /** Video time (in seconds) the image is pulled from. Defaults to the middle of the video. */
  time?: number | undefined;
  /** Width of the image (in pixels). Defaults to the width of the original video. */
  width?: number | undefined;
  /** Height of the image (in pixels). Defaults to the height of the original video. */
  height?: number | undefined;
  /** Rotate the image clockwise by the given number of degrees. */
  rotate?: number | undefined;
  /** How to fit the image within the specified width + height. */
  fitMode?: MuxPosterFitMode | undefined;
  /** Flip the image top-bottom after performing all other transformations. */
  flipV?: boolean | undefined;
  /** Flip the image left-right after performing all other transformations. */
  flipH?: boolean | undefined;
  /** Poster time for instant-clipping assets, as an epoch integer compared to the stream's program date time. */
  programTime?: number | undefined;
  /** Pull the latest frame from an ongoing live stream. */
  latest?: boolean | undefined;
  [param: string]: string | number | boolean | undefined;
}

export interface MuxStoryboardParams {
  token?: string | undefined;
  /** Image format of the storyboard tiles referenced by the VTT. Defaults to `webp`. */
  format?: MuxImageExt | undefined;
  [param: string]: string | number | undefined;
}

/**
 * Mux's DRM authoring input: a license token, in place of the license servers `source.drm` normally names. Servers
 * named outright alongside it still win, key by key, for content Mux does not license.
 */
export interface MuxDrmParams extends DrmSystemsConfig {
  /**
   * DRM license token: a JWT signed for the playback ID with the DRM (`d`) audience. Mux derives every license server
   * URL from it, so it is the only thing a caller supplies. DRM playback is always signed, so a matching
   * `playback.token` is required alongside it.
   */
  token?: string | undefined;
}

/**
 * What identifies a Mux stream and modifies it, independent of what plays it. `playbackId` and `customDomain` identify
 * the stream and derive the URL; `src` is a fallback for playing a non-Mux URL.
 *
 * Each Mux Media extends this with whatever its own engine takes — see `MuxSource` for the hls.js-backed one.
 */
export interface MuxSourceBase {
  /** Manifest URL. Derived from `playbackId` when there is one. */
  src?: string | undefined;
  playbackId?: string | undefined;
  customDomain?: string | undefined;
  playback?: MuxPlaybackParams | undefined;
  poster?: MuxPosterParams | undefined;
  storyboard?: MuxStoryboardParams | undefined;
  /** License servers keyed by key system, or a Mux license `token` to derive them from. */
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
