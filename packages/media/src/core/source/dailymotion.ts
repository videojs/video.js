/**
 * Parsed pieces of a Dailymotion source URL.
 *
 * @internal
 */
export interface ParsedDailymotionSource {
  /** Video id, the `x`-prefixed xid Dailymotion names its videos by. */
  id: string;
  /** Player ID of the player configuration an embed URL names. Null for the other URL shapes, which name none. */
  player: string | null;
}

/**
 * Extract a Dailymotion video id from any recognized video URL.
 *
 * @internal
 */
export function parseDailymotionVideoId(src: string) {
  return parseDailymotionSource(src)?.id ?? null;
}

/**
 * Parse a Dailymotion source string. Recognizes video page URLs (`dailymotion.com/video/<id>`), legacy embed URLs
 * (`dailymotion.com/embed/video/<id>`), short links (`dai.ly/<id>`), and player embed URLs
 * (`geo.dailymotion.com/player/<player>.html?video=<id>`), which also name the player configuration. The player embed
 * URL without one (`geo.dailymotion.com/player.html?video=<id>`), where legacy embed URLs now redirect, parses too.
 * Page URLs that still carry the slug Dailymotion once appended (`<id>_<title>`) parse to the bare id.
 *
 * @internal
 */
export function parseDailymotionSource(src: string): ParsedDailymotionSource | null {
  if (!src) return null;

  const embed = MATCH_EMBED.exec(src);
  if (embed) return { id: embed[2]!, player: embed[1] ?? null };

  const id = MATCH_VIDEO.exec(src)?.[1] ?? MATCH_SHORT.exec(src)?.[1];

  return id ? { id, player: null } : null;
}

// The host is pinned to the start of the string or to the `//` a scheme ends with, so that a lookalike domain ending in
// `dailymotion.com` cannot pass for one.
const MATCH_VIDEO = /(?:^|\/\/)(?:www\.)?dailymotion\.com\/(?:embed\/)?video\/(x[a-z0-9]+)(?:_[^/?#]*)?\/?(?:$|[?#])/i;

const MATCH_SHORT = /(?:^|\/\/)dai\.ly\/(x[a-z0-9]+)\/?(?:$|[?#])/i;

const MATCH_EMBED =
  /(?:^|\/\/)geo\.dailymotion\.com\/player(?:\/([a-z0-9]+))?\.html\?(?:[^#]*&)?video=(x[a-z0-9]+)(?:$|[&#])/i;
