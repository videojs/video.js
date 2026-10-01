/**
 * Extract a Wistia hashed id from a raw ten-character id or any recognized URL: media pages
 * (`<account>.wistia.com/medias/<id>`), embed URLs (`fast.wistia.net/embed/iframe/<id>` and the `medias/<id>.jsonp` and
 * `playlists/<id>` paths), the `wi.st` short host, and the `wvideo=<id>` parameter Wistia links carry.
 *
 * @internal
 */
export function parseWistiaMediaId(src: string): string | null {
  if (!src) return null;

  if (MATCH_HASHED_ID.test(src)) return src;

  return MATCH_SRC.exec(src)?.[1] ?? MATCH_WVIDEO.exec(src)?.[1] ?? null;
}

/**
 * Parse the `wtime` parameter of a Wistia URL into seconds. Wistia spells timestamps the way it spells them elsewhere:
 * `90`, `90s`, `1m30s`, `1h2m3s`.
 *
 * @internal
 */
export function parseWistiaStartTime(src: string): number | null {
  const value = /[?&]wtime=([\dhms]+)/i.exec(src)?.[1]?.toLowerCase();
  if (!value) return null;

  let seconds: number | null = null;

  for (const [pattern, multiplier] of WTIME_UNITS) {
    const amount = pattern.exec(value)?.[1];

    if (amount) seconds = (seconds ?? 0) + Number.parseInt(amount, 10) * multiplier;
  }

  return seconds;
}

/** The trailing `s` is optional, so the bare-number form (`90`) lands on the same pattern. */
const WTIME_UNITS: readonly (readonly [RegExp, number])[] = [
  [/(\d+)h/, 3600],
  [/(\d+)m/, 60],
  [/(\d+)s?$/, 1],
];

const MATCH_HASHED_ID = /^[a-z\d]{10}$/i;

// The id sits in the same position on every embed path, so the optional segment in front of it covers
// `embed/iframe/<id>`, `embed/medias/<id>.jsonp`, and `embed/playlists/<id>` without a pattern each.
const MATCH_SRC = /(?:wistia\.(?:com|net)|wi\.st)\/(?:medias|embed)\/(?:iframe\/|medias\/|playlists\/)?([a-z\d]{10})/i;

const MATCH_WVIDEO = /[?&]wvideo=([a-z\d]{10})/i;
