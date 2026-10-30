import type { HlsSource } from '@videojs/hlsjs-video';
import { parseKalturaSource } from '@videojs/media';

/** Kaltura's SaaS deployment, where the API and the streams live unless a source names another. */
export const KALTURA_SERVICE_URL = 'https://cdnapisec.kaltura.com';

/**
 * Structured Kaltura source: the entry to play and how to reach it, plus everything the HLS layer takes: `type`,
 * `preferPlayback`, the rendition caps, and its `engine` config.
 */
export interface KalturaSource extends HlsSource {
  /**
   * A Kaltura URL or `kaltura/<partnerId>/<entryId>` shorthand. V2 and V7 embed URLs, V2 frame URLs, preview pages, and
   * `playManifest` URLs are recognized; any other URL plays as a plain HLS stream.
   */
  src?: string | undefined;
  /** The publisher account the entry belongs to. Read from `src` when it names one. */
  partnerId?: number | undefined;
  /** The entry to play, such as `1_sf5ovm7u`. Read from `src` when it names one. */
  entryId?: string | undefined;
  /**
   * A Kaltura Session your server signed for this viewer, for entries that access control restricts. Without one, an
   * anonymous widget session is started, which plays public entries only. Read from `src` when it carries one.
   *
   * Sign it on your server with `privileges` such as `sview:<entryId>,setrole:PLAYBACK_BASE_ROLE` and a short expiry.
   * Never send an admin secret to the browser. A session that expires is not renewed for you: assign a new source.
   */
  ks?: string | undefined;
  /** The player configuration an embed URL names. Playback does not depend on it; Kaltura attributes the play to it. */
  uiConfId?: number | undefined;
  /**
   * Base URL of the Kaltura deployment, for self-hosted and regional accounts. Defaults to
   * `https://cdnapisec.kaltura.com`, or the host of a `src` URL from another deployment. A trailing `/api_v3` is
   * accepted.
   */
  serviceUrl?: string | undefined;
  /**
   * The page URL Kaltura access control checks domain restrictions against. Defaults to the current page URL, without
   * its fragment. `false` sends none, which plays only entries without a domain restriction.
   */
  referrer?: string | false | undefined;
  /** Plays the HLS source of this Kaltura delivery profile instead of the default one. */
  deliveryProfileId?: number | undefined;
}

/** Everything resolving one Kaltura entry depends on. */
export interface KalturaEntryRequest {
  partnerId: number;
  entryId: string;
  serviceUrl: string;
  ks?: string | undefined;
  uiConfId?: number | undefined;
  referrer?: string | false | undefined;
  deliveryProfileId?: number | undefined;
  /** A `playManifest` HLS URL the source names, which plays as written instead of waiting on the API. */
  manifestUrl?: string | undefined;
}

/** The Kaltura fields a URL implies, to store on a source alongside it. Empty for a URL that names no Kaltura entry. */
export function readKalturaSourceFields(src: string): Partial<KalturaSource> {
  const parsed = parseKalturaSource(src);
  if (!parsed) return {};

  const { manifestUrl: _manifestUrl, ...fields } = parsed;

  return fields;
}

/**
 * The entry a source names, or `null` when it names none and plays its `src` as plain HLS. Fields on the source win
 * over what `src` implies. A `playManifest` URL only plays as written when it names the same entry.
 */
export function toKalturaEntryRequest(source: KalturaSource | null | undefined): KalturaEntryRequest | null {
  if (!source) return null;

  const parsed = source.src ? parseKalturaSource(source.src) : null;
  const partnerId = source.partnerId ?? parsed?.partnerId;
  const entryId = source.entryId ?? parsed?.entryId;
  if (partnerId === undefined || !entryId) return null;

  const { ks, uiConfId, referrer, deliveryProfileId } = source;
  const sameEntry = parsed?.partnerId === partnerId && parsed.entryId === entryId;

  return {
    partnerId,
    entryId,
    serviceUrl: normalizeServiceUrl(source.serviceUrl ?? parsed?.serviceUrl),
    ks: ks ?? parsed?.ks,
    uiConfId: uiConfId ?? parsed?.uiConfId,
    referrer,
    deliveryProfileId,
    manifestUrl: sameEntry ? parsed.manifestUrl : undefined,
  };
}

function normalizeServiceUrl(value: string | undefined): string {
  const url = value
    ?.trim()
    .replace(/\/+$/, '')
    .replace(/\/api_v3$/i, '');

  return url || KALTURA_SERVICE_URL;
}
