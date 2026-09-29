// Utilities for parsing HLS m3u8 playlists.
//
// Native HLS playback does not expose manifest-level information like
// `HOLD-BACK` / `PART-HOLD-BACK` through a JS API, so consumers that need it
// (e.g. the live-edge mixin) fetch the playlist themselves and parse the
// relevant tags here.
//
// Mirrors the approach in `muxinc/elements/playback-core`. See:
// - https://github.com/muxinc/elements/blob/main/packages/playback-core/src/index.ts
// - https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-12

export interface StreamInfo {
  /**
   * Describes the kind of live window available. `0` for a sliding live window, `Infinity` for a live event with
   * playback history, and `NaN` for on-demand. This value is not a duration.
   */
  targetLiveWindow: number;
  /** Offset (seconds) from `seekable.end` at which the live edge window begins. `undefined` when the stream is not live. */
  liveEdgeStartOffset: number | undefined;
}

/**
 * Returns `true` when `src` looks like an HLS playlist URL. Permissive: a path or query string containing `.m3u8` is
 * enough.
 */
export function looksLikeM3u8(src: string) {
  return src.toLowerCase().includes('.m3u8');
}

/**
 * Returns `true` when the playlist text is a multivariant (master) playlist.
 *
 * The presence of `#EXT-X-STREAM-INF` is conclusive — media playlists only contain `#EXTINF` segment tags.
 */
export function isMultivariantPlaylist(playlist: string) {
  return playlist.includes('#EXT-X-STREAM-INF');
}

/**
 * Resolves the first media playlist URL referenced by a multivariant playlist, relative to `baseUrl`. Returns `null`
 * when none is found or the URL cannot be parsed.
 */
export function resolveFirstMediaPlaylistUrl(multivariant: string, baseUrl: string): string | null {
  const lines = multivariant.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith('#EXT-X-STREAM-INF'));
  if (start === -1) return null;

  // The URI appears on the first non-blank, non-comment line that follows.
  const uri = lines
    .slice(start + 1)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'));
  if (!uri) return null;

  try {
    return new URL(uri, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Matches one attribute of a tag's comma-separated `key=value` list. The name is anchored to a delimiter so `HOLD-BACK`
 * cannot read the value of `PART-HOLD-BACK`, and the value must run to a delimiter so a malformed one (`1e1`) reads as
 * absent rather than silently truncating to its leading digits.
 */
function attributePattern(name: string): RegExp {
  return new RegExp(String.raw`(?:^|[:,\s])${name}\s*=\s*([0-9.]+)\s*(?=[,]|$)`, 'i');
}

const PART_TARGET = attributePattern('PART-TARGET');
const HOLD_BACK = attributePattern('HOLD-BACK');
const PART_HOLD_BACK = attributePattern('PART-HOLD-BACK');

/** Reads a numeric attribute out of one tag line, or `undefined` when it is absent or not a plain number. */
function readAttribute(line: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(line);
  if (!match) return undefined;

  const value = Number(match[1]);

  return Number.isFinite(value) ? value : undefined;
}

/**
 * Parses the subset of media-playlist tags needed to derive live edge state: `#EXT-X-PLAYLIST-TYPE`, `#EXT-X-ENDLIST`,
 * `#EXT-X-TARGETDURATION`, `#EXT-X-PART-INF`, `#EXT-X-SERVER-CONTROL`.
 *
 * See spec: - VOD or `#EXT-X-ENDLIST` present → on-demand, `targetLiveWindow = NaN`. - `EVENT` playlist → DVR,
 * `targetLiveWindow = Infinity`. - Otherwise → standard live sliding window, `targetLiveWindow = 0`.
 *
 * The edge offset is the hold-back the server declares, falling back to `PART-TARGET * 2` for low-latency live and
 * `TARGETDURATION * 3` otherwise. A client is not meant to play closer to the end than the declared hold-back, so a
 * declared value always wins over the multiple.
 */
export function parseStreamInfo(playlist: string): StreamInfo {
  const lines = playlist.split(/\r?\n/);

  let playlistType: string | undefined;
  let hasEndList = false;
  let targetDuration: number | undefined;
  let partTarget: number | undefined;
  let holdBack: number | undefined;
  let partHoldBack: number | undefined;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
      playlistType = line.slice('#EXT-X-PLAYLIST-TYPE:'.length).trim().toUpperCase();
    } else if (line === '#EXT-X-ENDLIST') {
      hasEndList = true;
    } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      const value = Number(line.slice('#EXT-X-TARGETDURATION:'.length));

      if (Number.isFinite(value)) targetDuration = value;
    } else if (line.startsWith('#EXT-X-PART-INF')) {
      partTarget = readAttribute(line, PART_TARGET) ?? partTarget;
    } else if (line.startsWith('#EXT-X-SERVER-CONTROL')) {
      partHoldBack = readAttribute(line, PART_HOLD_BACK) ?? partHoldBack;
      holdBack = readAttribute(line, HOLD_BACK) ?? holdBack;
    }
  }

  if (playlistType === 'VOD' || hasEndList) {
    return { targetLiveWindow: Number.NaN, liveEdgeStartOffset: undefined };
  }

  const targetLiveWindow = playlistType === 'EVENT' ? Number.POSITIVE_INFINITY : 0;

  // Falsy rather than nullish, matching the hls.js adapter: its LevelDetails reads an undeclared hold-back as 0, so
  // the multiple has to win over a zero. Low latency follows PART-INF here, where the hls.js path keys off the parsed
  // part list; the two agree except on a playlist that declares PART-INF before publishing any part.
  const liveEdgeStartOffset =
    partTarget !== undefined
      ? partHoldBack || partTarget * 2
      : holdBack || (targetDuration !== undefined ? targetDuration * 3 : undefined);

  return { targetLiveWindow, liveEdgeStartOffset };
}

async function fetchPlaylist(url: string, init: RequestInit): Promise<{ text: string; url: string }> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Failed to fetch playlist (${response.status}): ${url}`);

  return { text: await response.text(), url: response.url || url };
}

/**
 * Fetches the HLS playlist at `src`, following the first variant if it's a multivariant playlist, and parses it into a
 * {@link StreamInfo}.
 *
 * @throws When the fetch fails or no media playlist URL can be resolved.
 */
export async function getStreamInfoFromSrc(src: string, signal?: AbortSignal): Promise<StreamInfo> {
  const init: RequestInit = signal ? { signal } : {};
  const { text, url } = await fetchPlaylist(src, init);
  if (!isMultivariantPlaylist(text)) return parseStreamInfo(text);

  const mediaUrl = resolveFirstMediaPlaylistUrl(text, url);
  if (!mediaUrl) throw new Error('No media playlist URL found in multivariant playlist');

  const media = await fetchPlaylist(mediaUrl, init);

  return parseStreamInfo(media.text);
}
