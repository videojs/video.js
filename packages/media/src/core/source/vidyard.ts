/**
 * Parsed pieces of a Vidyard source.
 *
 * @internal
 */
export interface ParsedVidyardSource {
  /** Player UUID. A player can hold a playlist of videos; the UUID names the player, not one video. */
  uuid: string;
  /** Player parameters the URL carries in its query, as written. */
  params: Record<string, string>;
}

/**
 * Parse a Vidyard source. Recognizes a bare player UUID, the `vidyard/<uuid>` shorthand, sharing page URLs
 * (`share.vidyard.com/watch/<uuid>`, and `/watch/<uuid>` on any other `vidyard.com` host), player URLs
 * (`play.vidyard.com/<uuid>`, with or without `.html`), and embed sharing URLs (`embed.vidyard.com/share/<uuid>`). A
 * URL's query is kept as player parameters.
 *
 * @internal
 */
export function parseVidyardSource(src: string): ParsedVidyardSource | null {
  const value = src.trim();
  if (!value) return null;

  if (UUID.test(value)) return { uuid: value, params: {} };

  const shorthand = SHORTHAND.exec(value);
  if (shorthand) return { uuid: shorthand[1]!, params: {} };

  const url = parseUrl(value);
  if (!url) return null;

  const uuid = matchUuid(url.hostname.toLowerCase(), url.pathname);

  return uuid ? { uuid, params: Object.fromEntries(url.searchParams) } : null;
}

function matchUuid(hostname: string, pathname: string): string | null {
  if (hostname === 'play.vidyard.com') return PLAY_PATH.exec(pathname)?.[1] ?? null;

  if (hostname === 'embed.vidyard.com') return EMBED_PATH.exec(pathname)?.[1] ?? null;

  if (hostname === 'vidyard.com' || hostname.endsWith('.vidyard.com')) return WATCH_PATH.exec(pathname)?.[1] ?? null;

  return null;
}

function parseUrl(src: string): URL | null {
  try {
    const url = new URL(HAS_SCHEME.test(src) ? src : `https://${src.replace(/^\/\//, '')}`);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

// Vidyard's embed code refuses a UUID with any other character.
const UUID_CHARS = '[A-Za-z0-9_-]{10,}';
const UUID = new RegExp(`^${UUID_CHARS}$`);
const SHORTHAND = new RegExp(`^vidyard/(${UUID_CHARS})/?$`);
const PLAY_PATH = new RegExp(`^/(${UUID_CHARS})(?:\\.html)?/?$`);
const EMBED_PATH = new RegExp(`^/share/(${UUID_CHARS})/?$`);
const WATCH_PATH = new RegExp(`^/watch/(${UUID_CHARS})/?$`);
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
