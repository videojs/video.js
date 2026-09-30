/** Parsed pieces of a Vimeo source URL. */
export interface ParsedVimeoSource {
  id: number;
  /** `'video'` for regular clips, `'event'` for live events. */
  kind: 'video' | 'event';
  /** Unlisted-video / event hash (the `h` parameter). */
  hash: string | null;
}

/** Extract a Vimeo video id from a numeric id, `vimeo/<id>` shorthand, vimeo.com URL, or player URL. */
export function parseVimeoVideoId(src: string) {
  return parseVimeoSource(src)?.id ?? null;
}

/**
 * Parse a Vimeo source: a numeric id, a `vimeo/<id>` shorthand, `vimeo.com/<id>`, `vimeo.com/video/<id>`,
 * `player.vimeo.com/video/<id>`, or `vimeo.com/event/<id>` (live events), plus unlisted/event hashes from `?h=` or a
 * `/<hash>` segment. Shorthands also take the hash from `?hash=`.
 */
export function parseVimeoSource(src: string): ParsedVimeoSource | null {
  if (!src) return null;

  if (/^\d+$/.test(src)) return { id: Number(src), kind: 'video', hash: null };

  const shorthand = SHORTHAND_SRC.exec(src);
  if (shorthand) return { id: Number(shorthand[1]), kind: 'video', hash: shorthand[2] ?? null };

  const match = MATCH_SRC.exec(src);
  if (!match) return null;

  const kind = match[1] === 'event/' ? 'event' : 'video';
  let queryHash: string | null = null;

  try {
    queryHash = new URL(src).searchParams.get('h');
  } catch {
    // Bare ids and paths are not valid URLs.
  }

  return { id: Number(match[2]), kind, hash: queryHash ?? match[3] ?? null };
}

const SHORTHAND_SRC = /^vimeo\/(?:video\/)?(\d+)(?:(?:\?hash=|\?h=|\/)([\w-]+))?$/;
const MATCH_SRC = /vimeo\.com\/(video\/|event\/)?(\d+)(?:\/([\w-]+))?/;
