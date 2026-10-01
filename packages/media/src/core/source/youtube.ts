/**
 * Parsed pieces of a YouTube source URL.
 *
 * @internal
 */
export interface ParsedYouTubeSource {
  /** 11-character video id (null for playlist-only sources). */
  id: string | null;
  /** `'video'` for single videos, `'playlist'` for playlist sources. */
  kind: 'video' | 'playlist';
  /** Playlist id (the `list` parameter). */
  listId: string | null;
  /** Start time in seconds parsed from the `t` parameter. */
  startTime: number | null;
  /** Whether the source uses the youtube-nocookie.com privacy-enhanced host. */
  noCookie: boolean;
}

/**
 * Extract a YouTube video id from a raw 11-character id, a `youtube/<id>` shorthand, or any recognized URL.
 *
 * @internal
 */
export function parseYouTubeVideoId(src: string) {
  return parseYouTubeSource(src)?.id ?? null;
}

/**
 * Parse a YouTube source string. Recognizes raw 11-character ids, `youtube/<id>` and `youtube/shorts/<id>` shorthands,
 * `youtu.be` short links, `watch?v=`, `embed/`, `v/`, `shorts/` and `live/` URLs (with or without the `-nocookie`
 * host), playlist URLs via the `list` parameter, and start times via the `t` parameter.
 *
 * @internal
 */
export function parseYouTubeSource(src: string): ParsedYouTubeSource | null {
  if (!src) return null;

  if (/^[\w-]{11}$/.test(src)) {
    return { id: src, kind: 'video', listId: null, startTime: null, noCookie: false };
  }

  const shorthandId = SHORTHAND_SRC.exec(src)?.[1];
  // Shorthands play from the privacy-enhanced host, so a source written as one doesn't set YouTube cookies.
  if (shorthandId) return { id: shorthandId, kind: 'video', listId: null, startTime: null, noCookie: true };

  const noCookie = src.includes('-nocookie');
  const videoMatch = VIDEO_MATCH_SRC.exec(src);
  const listMatch = PLAYLIST_MATCH_SRC.exec(src);
  // Playlist embed URLs use the `videoseries` placeholder in the video id slot.
  const videoId = videoMatch?.[1] ?? null;
  const id = videoId === 'videoseries' ? null : videoId;
  if (!id && !listMatch) return null;

  return {
    id,
    kind: id ? 'video' : 'playlist',
    listId: listMatch?.[1] ?? null,
    startTime: parseStartTime(src),
    noCookie,
  };
}

/**
 * Parse the `t` parameter from a YouTube URL and convert it to seconds. Supports formats like: `t=171`, `t=171s`,
 * `t=2m51s`, `t=2m`, `t=1h30m15s`.
 */
function parseStartTime(url: string): number | null {
  const tValue = /[?&]t=([\dhms]+)/i.exec(url)?.[1]?.toLowerCase();
  if (!tValue) return null;

  let totalSeconds = 0;
  let hasValue = false;
  const hours = /(\d+)h/.exec(tValue)?.[1];

  if (hours) {
    totalSeconds += Number.parseInt(hours, 10) * 3600;
    hasValue = true;
  }

  const minutes = /(\d+)m/.exec(tValue)?.[1];

  if (minutes) {
    totalSeconds += Number.parseInt(minutes, 10) * 60;
    hasValue = true;
  }

  const seconds = /(\d+)s?$/.exec(tValue)?.[1];

  if (seconds) {
    totalSeconds += Number.parseInt(seconds, 10);
    hasValue = true;
  }

  return hasValue ? totalSeconds : null;
}

const SHORTHAND_SRC = /^youtube\/(?:shorts\/)?([\w-]{11})$/;

const VIDEO_MATCH_SRC =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((?:\w|-){11})/;

const PLAYLIST_MATCH_SRC = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/.*?[?&]list=)([\w-]+)/;
