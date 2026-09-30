/**
 * Parsed pieces of a TikTok source URL. TikTok embeds one thing — a video named by a numeric id — so the id is all
 * there is to take from a source.
 */
export interface ParsedTikTokSource {
  /** Numeric video id. */
  id: string;
}

/** Extract a TikTok video id from a raw numeric id or any recognized URL. */
export function parseTikTokVideoId(src: string) {
  return parseTikTokSource(src)?.id ?? null;
}

/**
 * Parse a TikTok source string. Recognizes raw numeric ids, `player/v1/` embed URLs, `share/video/` links, and the
 * `@user/video/` URLs the app hands out.
 */
export function parseTikTokSource(src: string): ParsedTikTokSource | null {
  if (!src) return null;

  // A bare numeric id is how the embed URL itself names a video, so it is taken
  // as one.
  if (MATCH_ID.test(src)) return { id: src };

  const id = MATCH_SRC.exec(src)?.[1];

  return id ? { id } : null;
}

const MATCH_ID = /^\d+$/;

const MATCH_SRC = /tiktok\.com\/(?:player\/v1\/|share\/video\/|@[^/]+\/video\/)(\d+)/;
