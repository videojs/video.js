/**
 * The entities Spotify can embed.
 *
 * @internal
 */
export type SpotifyEntityType = 'track' | 'episode' | 'album' | 'playlist' | 'show' | 'artist';

/**
 * Parsed pieces of a Spotify source URL or URI.
 *
 * @internal
 */
export interface ParsedSpotifySource {
  /** Which kind of entity the embed plays; it names the embed path. */
  type: SpotifyEntityType;
  /** Base62 entity id. */
  id: string;
  /** Start position in seconds parsed from the `t` parameter. */
  startTime: number | null;
}

/**
 * Extract a Spotify entity id from any recognized URL or `spotify:` URI.
 *
 * @internal
 */
export function parseSpotifyEntityId(src: string) {
  return parseSpotifySource(src)?.id ?? null;
}

/**
 * Parse a Spotify source string. Recognizes `open.spotify.com` URLs for every embeddable entity — including the
 * localized (`/intl-de/`) and already-embedded (`/embed/`) forms, since the entity type and id sit in the same place in
 * all of them — `spotify:<type>:<id>` URIs, and start positions via the `t` parameter.
 *
 * @internal
 */
export function parseSpotifySource(src: string): ParsedSpotifySource | null {
  if (!src) return null;

  const match = MATCH_URI.exec(src) ?? MATCH_SRC.exec(src);
  const type = match?.[1]?.toLowerCase() as SpotifyEntityType | undefined;
  const id = match?.[2];
  if (!type || !id) return null;

  return { type, id, startTime: parseStartTime(src) };
}

/** Parse the `t` parameter from a Spotify share URL. Spotify spells it in seconds. */
function parseStartTime(url: string): number | null {
  const value = /[?&]t=(\d+)/.exec(url)?.[1];

  return value ? Number.parseInt(value, 10) : null;
}

// The entity type and id are always the last two path segments, so whatever
// Spotify puts in front of them (`/intl-de/`, `/embed/`) is skipped.
const MATCH_SRC = /open\.spotify\.com\/(?:[\w-]+\/)*?(track|episode|album|playlist|show|artist)\/(\w+)/i;

const MATCH_URI = /^spotify:(track|episode|album|playlist|show|artist):(\w+)$/i;
