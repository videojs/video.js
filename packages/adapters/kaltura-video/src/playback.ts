import { MediaError } from '@videojs/media';
import { isString } from '@videojs/utils/predicate';

import type { KalturaEntryResponse, KalturaPlaybackSource } from './api';

/** The value Kaltura's analytics and logs attribute requests from this media to. */
export const KALTURA_CLIENT_TAG = `videojs:v${getVersion()}`;

const BLOCK_ACTION = 1;
const LIVE_STREAM_ENTRY = 7;
const BLOCKED_MODERATION_STATUSES: ReadonlySet<number> = new Set([1, 3]);
// Kaltura's thumbnail API answers 120×90 without a size.
const POSTER_WIDTH = 1280;
// The same cap Kaltura's own player puts on the page URL it reports.
const MAX_REFERRER_LENGTH = 1000;

/**
 * Decide whether an entry can play, and through which HLS source.
 *
 * Returns the source, or a {@link MediaError} saying why there is none: access control blocked it (with the publisher's
 * message when there is one), moderation holds it back, a live entry is not broadcasting, or every HLS source is
 * DRM-protected or missing. `deliveryProfileId` picks a source by its delivery profile, falling back to the first HTTPS
 * one.
 */
export function selectKalturaPlaybackSource(
  { entry, context, isLive }: KalturaEntryResponse,
  deliveryProfileId?: number
): KalturaPlaybackSource | MediaError {
  if (context.actions.some((action) => action.type === BLOCK_ACTION)) return blockedError(context.messages);

  if (entry.moderationStatus !== undefined && BLOCKED_MODERATION_STATUSES.has(entry.moderationStatus)) {
    return new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, 'ENTRY_MODERATION_ERROR');
  }

  if (entry.type === LIVE_STREAM_ENTRY && isLive === false) {
    return new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, 'LIVE_STREAM_NOT_BROADCASTING');
  }

  const hls = context.sources.filter((source) => source.format === 'applehttp');
  const clear = hls.filter((source) => source.drm.length === 0);

  if (clear.length === 0) {
    return hls.length > 0
      ? new MediaError(undefined, MediaError.MEDIA_ERR_ENCRYPTED, true, 'DRM_NOT_SUPPORTED')
      : new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, 'NO_PLAYABLE_SOURCE');
  }

  if (deliveryProfileId !== undefined) {
    const named = clear.find((source) => source.deliveryProfileId === deliveryProfileId);
    if (named) return named;

    if (__DEV__) {
      console.warn(
        `[vjs-kaltura] No HLS source uses delivery profile ${deliveryProfileId}; playing the default one instead.`
      );
    }
  }

  return clear.find(isHttps) ?? clear[0]!;
}

export interface KalturaPlaybackParams {
  ks?: string | undefined;
  uiConfId?: number | undefined;
  playSessionId: string;
  referrer?: string | undefined;
}

/**
 * Add what Kaltura expects on every stream request to a `playManifest` URL: the app's KS, the player configuration, the
 * play session, this client, and the page as a base64 `referrer` for domain restrictions. Parameters the URL already
 * carries, in its query or as a path segment, are left as written.
 */
export function createKalturaPlaybackURL(url: string, params: KalturaPlaybackParams): string {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const pathKeys = new Set(parsed.pathname.toLowerCase().split('/'));
  const { ks, uiConfId, playSessionId, referrer } = params;
  const query = {
    ks,
    uiConfId: uiConfId === undefined ? undefined : String(uiConfId),
    playSessionId,
    clientTag: KALTURA_CLIENT_TAG,
    referrer: referrer && encodeReferrer(referrer),
  };

  for (const [key, value] of Object.entries(query)) {
    if (!value || parsed.searchParams.has(key) || pathKeys.has(key.toLowerCase())) continue;

    parsed.searchParams.set(key, value);
  }

  return parsed.href;
}

/** A still for the entry from Kaltura's thumbnail API, which needs no request to build. */
export function createKalturaPosterURL(serviceUrl: string, partnerId: number, entryId: string): string {
  return `${serviceUrl}/p/${partnerId}/thumbnail/entry_id/${encodeURIComponent(entryId)}/width/${POSTER_WIDTH}`;
}

/**
 * The page URL access control checks domain restrictions against: the author's own `referrer`, the current page without
 * its fragment by default, or nothing when the author opts out with `false`.
 */
export function resolveKalturaReferrer(referrer: string | false | undefined): string | undefined {
  if (referrer === false) return undefined;

  if (referrer) return referrer;

  const href = globalThis.location?.href;

  return href ? href.split('#', 1)[0] : undefined;
}

/** A random version 4 UUID. `crypto.randomUUID()` exists only in secure contexts, so it is built by hand. */
export function createPlaySessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function blockedError(messages: readonly { message?: unknown; code?: unknown }[]): MediaError {
  const reason = messages.find((message) => isString(message.message) && message.message.trim());
  const message = isString(reason?.message) ? reason.message.trim() : undefined;
  const code = isString(reason?.code) && reason.code ? reason.code : 'ACCESS_CONTROL_BLOCKED';
  const error = new MediaError(message, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, code);

  error.data = { messages };
  return error;
}

function isHttps(source: KalturaPlaybackSource): boolean {
  return source.url.startsWith('https:');
}

/** Base64 of the UTF-8 bytes, since `btoa()` only takes Latin-1. */
function encodeReferrer(referrer: string): string {
  const bytes = new TextEncoder().encode(referrer.slice(0, MAX_REFERRER_LENGTH));

  return btoa(String.fromCharCode(...bytes));
}

function getVersion(): string {
  try {
    return __PLAYER_VERSION__;
  } catch {
    return 'unknown';
  }
}
