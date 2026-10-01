// Minimal typings and constants for the TikTok embed player (https://developers.tiktok.com/doc/embed-player).
// TikTok ships no SDK: the embed is driven with `window.postMessage` both ways, so the protocol is the whole API.

import { isNumber, isObject, isString } from '@videojs/utils/predicate';

/** Marker every player message carries, whichever way it travels. */
export const PLAYER_MESSAGE_KEY = 'x-tiktok-player';

/** Target origin for commands; `*` since the serving TikTok origin varies and commands carry nothing private. */
export const PLAYER_TARGET_ORIGIN = '*';

/**
 * Commands the embed accepts. Only `seekTo` carries a value: seconds.
 *
 * @internal
 */
export type TikTokPlayerCommand = 'play' | 'pause' | 'seekTo' | 'mute' | 'unMute';

/**
 * A command on its way to the embed.
 *
 * @internal
 */
export interface TikTokPlayerCommandMessage {
  [PLAYER_MESSAGE_KEY]: true;
  type: TikTokPlayerCommand;
  value?: number;
}

/**
 * The events the embed reports.
 *
 * @internal
 */
export type TikTokPlayerEventType =
  | 'onPlayerReady'
  | 'onStateChange'
  | 'onCurrentTime'
  | 'onVolumeChange'
  | 'onMute'
  | 'onPlayerError'
  /** Deprecated by TikTok in favor of `onPlayerError`; older embeds still report it. */
  | 'onError';

/**
 * A message from the embed. `value` stays unknown: it arrives from another origin and depends on `type`.
 *
 * @internal
 */
export interface TikTokPlayerEventMessage {
  [PLAYER_MESSAGE_KEY]: true;
  /** Widened past the known events, since the embed can report ones we don't handle. */
  type: TikTokPlayerEventType | (string & {});
  value?: unknown;
}

/**
 * Payload of `onCurrentTime`, the embed's only progress report.
 *
 * @internal
 */
export interface TikTokCurrentTime {
  currentTime: number;
  duration: number;
}

/** Payload of `onPlayerError`. `errorType` names the code for a human. */
export interface TikTokPlayerError {
  errorCode: number;
  errorType?: string;
}

// `onPlayerError` codes group in thousand-wide categories: 1000s data and validation, 2000s network, 3000s player.
// Only the bounds and the one code that is not an error are named, so codes TikTok adds later read by category too.
export const ERROR_AUTOPLAY = 3002;
export const ERROR_NETWORK_CATEGORY = 2000;
export const ERROR_PLAYER_CATEGORY = 3000;
export const ERROR_CATEGORY_END = 4000;

/** Whether a `message` event's data is one of the embed's; every frame posts here, so the marker tells them apart. */
export function isTikTokPlayerMessage(data: unknown): data is TikTokPlayerEventMessage {
  if (!isObject(data)) return false;

  const message = data as Partial<TikTokPlayerEventMessage>;

  return !!message[PLAYER_MESSAGE_KEY] && isString(message.type);
}

/** Whether a value is the pair `onCurrentTime` reports. */
export function isTikTokCurrentTime(value: unknown): value is TikTokCurrentTime {
  return isObject(value) && isNumber((value as TikTokCurrentTime).currentTime);
}

/** Whether a value is the payload `onPlayerError` reports. */
export function isTikTokPlayerError(value: unknown): value is TikTokPlayerError {
  return isObject(value) && isNumber((value as TikTokPlayerError).errorCode);
}

/** Build a command message. A command without a value must not carry one at all. */
export function createTikTokPlayerCommand(type: TikTokPlayerCommand, value?: number): TikTokPlayerCommandMessage {
  return { [PLAYER_MESSAGE_KEY]: true, type, ...(isNumber(value) && { value }) };
}

// https://developers.tiktok.com/doc/embed-player
export const STATE_INIT = -1;
export const STATE_ENDED = 0;
export const STATE_PLAYING = 1;
export const STATE_PAUSED = 2;
export const STATE_BUFFERING = 3;
