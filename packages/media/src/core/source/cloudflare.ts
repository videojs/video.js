/**
 * Parsed pieces of a Cloudflare Stream source.
 *
 * @internal
 */
export interface ParsedCloudflareSource {
  /** Video UID, or the signed token standing in for one. */
  id: string;
  /** Whether `id` is a signed token rather than a plain video UID. */
  signed: boolean;
  /**
   * Per-customer embed origin (`https://customer-<code>.cloudflarestream.com`) when the source names one, otherwise
   * null for the shared host. Signed and access-controlled videos are only served from the customer origin, so it has
   * to survive parsing rather than being collapsed into the shared one.
   */
  origin: string | null;
}

/**
 * Extract a Cloudflare video UID from a raw UID, a signed token, or any recognized URL.
 *
 * @internal
 */
export function parseCloudflareVideoId(src: string) {
  return parseCloudflareSource(src)?.id ?? null;
}

/**
 * Parse a Cloudflare Stream source string. Recognizes `videodelivery.net` and `cloudflarestream.com` URLs (embed,
 * iframe, manifest, and thumbnail paths all carry the id in the same position), raw 32-character video UIDs, and signed
 * tokens, which stand in for the UID wherever it appears.
 *
 * @internal
 */
export function parseCloudflareSource(src: string): ParsedCloudflareSource | null {
  if (!src) return null;

  const id = MATCH_SRC.exec(src)?.[1] ?? (MATCH_VIDEO_ID.test(src) || MATCH_SIGNED_TOKEN.test(src) ? src : null);
  if (!id) return null;

  return { id, signed: MATCH_SIGNED_TOKEN.test(id), origin: MATCH_CUSTOMER_ORIGIN.exec(src)?.[1] ?? null };
}

const MATCH_SRC = /(?:cloudflarestream\.com|videodelivery\.net)\/([\w-.]+)/i;

// Only the per-customer subdomain is preserved. The `watch.` and bare hosts are
// pages rather than embeds, so they still resolve to the shared embed host.
const MATCH_CUSTOMER_ORIGIN = /^(https?:\/\/customer-[\w-]+\.cloudflarestream\.com)/i;

const MATCH_VIDEO_ID = /^[a-z\d]{32}$/i;

// Signed tokens are JWTs, so a bare one is three dot-separated base64url segments.
const MATCH_SIGNED_TOKEN = /^[\w-]+\.[\w-]+\.[\w-]+$/;
