// Minimal typings for the Twitch embed's postMessage protocol, transcribed because Twitch ships no SDK to type
// against (https://dev.twitch.tv/docs/embed/video-and-clips/).

import { isObject, isString } from '@videojs/utils/predicate';

/** Embed origin: where the embed is served from and where commands are posted. */
export const TWITCH_PLAYER_ORIGIN = 'https://player.twitch.tv';

/** Namespace on the commands the host posts, and on the state snapshots that come back. */
export const PLAYER_PROXY_NAMESPACE = 'twitch-embed-player-proxy';

/** Namespace on the lifecycle events the embed emits. */
export const EMBED_NAMESPACE = 'twitch-embed';

// Commands the embed accepts, posted as the numeric `eventName` of a `twitch-embed-player-proxy` message.
export const COMMAND_DISABLE_CAPTIONS = 0;
export const COMMAND_ENABLE_CAPTIONS = 1;
export const COMMAND_PAUSE = 2;
export const COMMAND_PLAY = 3;
export const COMMAND_SEEK = 4;
export const COMMAND_SET_CHANNEL = 5;
export const COMMAND_SET_CHANNEL_ID = 6;
export const COMMAND_SET_COLLECTION = 7;
export const COMMAND_SET_QUALITY = 8;
export const COMMAND_SET_VIDEO = 9;
export const COMMAND_SET_MUTED = 10;
export const COMMAND_SET_VOLUME = 11;

// Values the `playback` field of a player state snapshot takes.
export const PLAYBACK_IDLE = 'Idle';
export const PLAYBACK_READY = 'Ready';
export const PLAYBACK_BUFFERING = 'Buffering';
export const PLAYBACK_PLAYING = 'Playing';
export const PLAYBACK_ENDED = 'Ended';

/**
 * Where the embed is in its playback lifecycle.
 *
 * @internal
 */
export type TwitchPlaybackState =
  | typeof PLAYBACK_IDLE
  | typeof PLAYBACK_READY
  | typeof PLAYBACK_BUFFERING
  | typeof PLAYBACK_PLAYING
  | typeof PLAYBACK_ENDED;

/**
 * Delivery statistics the embed reports alongside its player state.
 *
 * @internal
 */
export interface TwitchVideoStats extends Record<string, unknown> {
  /** Seconds of media buffered ahead of the playhead. */
  bufferSize?: number;
}

/**
 * Player state snapshot. The embed sends only what changed, so a snapshot reads as a patch, not a whole state.
 *
 * @internal
 */
export interface TwitchPlayerState {
  /** Length of the VOD in seconds. Live channels report no meaningful duration. */
  duration?: number;
  currentTime?: number;
  /** Volume in the `0`–`1` range, matching `HTMLMediaElement`. */
  volume?: number;
  muted?: boolean;
  playback?: TwitchPlaybackState;
  stats?: { videoStats?: TwitchVideoStats };
}

/**
 * Lifecycle event the embed emits (`ready`, `play`, `pause`, `seek`, `ended`, `offline`, …).
 *
 * @internal
 */
export interface TwitchEmbedMessage {
  namespace: typeof EMBED_NAMESPACE;
  eventName: string;
  params?: unknown;
}

/**
 * Player state snapshot, pushed on the same namespace the host sends commands on.
 *
 * @internal
 */
export interface TwitchPlayerProxyMessage {
  namespace: typeof PLAYER_PROXY_NAMESPACE;
  eventName: string;
  params?: TwitchPlayerState;
}

/**
 * Anything the embed posts back to the host.
 *
 * @internal
 */
export type TwitchInboundMessage = TwitchEmbedMessage | TwitchPlayerProxyMessage;

/**
 * Command the host posts to the embed. Its `eventName` is one of the numeric codes above.
 *
 * @internal
 */
export interface TwitchCommandMessage {
  namespace: typeof PLAYER_PROXY_NAMESPACE;
  eventName: number;
  params?: unknown;
}

/** Narrow a `message` payload to something the embed sent; any page can post here, so the namespace is the filter. */
export function isTwitchMessage(data: unknown): data is TwitchInboundMessage {
  if (!isObject(data)) return false;

  const { namespace, eventName } = data as { namespace?: unknown; eventName?: unknown };

  return isString(eventName) && (namespace === EMBED_NAMESPACE || namespace === PLAYER_PROXY_NAMESPACE);
}
