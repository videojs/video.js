/**
 * Parsed pieces of a Twitch source URL.
 *
 * @internal
 */
export interface ParsedTwitchSource {
  /** `'video'` for VODs, `'channel'` for live channels. */
  kind: 'video' | 'channel';
  /** Numeric VOD id, without the `v` prefix the embed parameter carries. Null for channels. */
  id: string | null;
  /** Channel name. Null for VODs. */
  channel: string | null;
}

/**
 * Extract a Twitch VOD id from any recognized video URL.
 *
 * @internal
 */
export function parseTwitchVideoId(src: string) {
  return parseTwitchSource(src)?.id ?? null;
}

/**
 * Parse a Twitch source string. Recognizes VOD URLs (`twitch.tv/videos/<id>` and `twitch.tv/?video=<id>`) and channel
 * URLs (`twitch.tv/<channel>`), with or without the `www.` and `go.` hosts, and with or without a trailing slash. Also
 * recognizes the embed URLs Twitch's own embed code uses (`player.twitch.tv/?video=<id>` and
 * `player.twitch.tv/?channel=<name>`), alongside other query parameters such as `parent`.
 *
 * @internal
 */
export function parseTwitchSource(src: string): ParsedTwitchSource | null {
  if (!src) return null;

  // A VOD URL also satisfies the channel pattern's host, so it is tried first.
  const videoId = MATCH_VIDEO.exec(src)?.[1] ?? MATCH_PLAYER_VIDEO.exec(src)?.[1];
  if (videoId) return { kind: 'video', id: videoId, channel: null };

  const channel = MATCH_CHANNEL.exec(src)?.[1] ?? MATCH_PLAYER_CHANNEL.exec(src)?.[1];
  if (channel) return { kind: 'channel', id: null, channel };

  return null;
}

// The host is pinned to the start of the string or to the `//` a scheme ends
// with, so that another Twitch subdomain cannot pass for one of these: a
// `clips.twitch.tv` URL names a clip this embed cannot play, not a channel of
// the same name.
// The `video` parameter may carry the `v` prefix the embed uses.
const MATCH_VIDEO = /(?:^|\/\/)(?:www\.|go\.)?twitch\.tv\/(?:videos?\/|\?video=v?)(\d+)\/?(?:$|\?)/;

const MATCH_CHANNEL = /(?:^|\/\/)(?:www\.|go\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?(?:$|\?)/;

// The embed host names its media in the query, among other parameters such as
// `parent`, in any order.
const MATCH_PLAYER_VIDEO = /(?:^|\/\/)player\.twitch\.tv\/?\?(?:[^#]*&)?video=v?(\d+)(?:$|[&#])/;

const MATCH_PLAYER_CHANNEL = /(?:^|\/\/)player\.twitch\.tv\/?\?(?:[^#]*&)?channel=([a-zA-Z0-9_]+)(?:$|[&#])/;
