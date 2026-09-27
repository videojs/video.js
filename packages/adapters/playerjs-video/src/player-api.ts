// Minimal typings and helpers for the player.js protocol (https://github.com/embedly/player.js/blob/master/SPEC.rst).
// player.js is a postMessage contract rather than a service: any embed that implements the receiver side speaks it,
// so the protocol is the whole API and no SDK is loaded.

import { isNumber, isObject, isString, isUndefined } from '@videojs/utils/predicate';

/** The `context` every player.js message carries, whichever way it travels. */
export const PLAYER_CONTEXT = 'player.js';

/** The spec version this host speaks. Receivers do not branch on it, but the spec asks for it on every command. */
export const PLAYER_VERSION = '0.0.11';

/**
 * Target origin for commands. `*` rather than the embed URL's origin, since an embed may redirect to another one and
 * commands carry nothing private; what the embed reports is matched by its window instead.
 */
export const PLAYER_TARGET_ORIGIN = '*';

/** Methods from the player.js spec. */
export type PlayerJsSpecMethod =
  | 'play'
  | 'pause'
  | 'getPaused'
  | 'mute'
  | 'unmute'
  | 'getMuted'
  | 'setVolume'
  | 'getVolume'
  | 'getDuration'
  | 'setCurrentTime'
  | 'getCurrentTime'
  | 'setLoop'
  | 'getLoop'
  | 'addEventListener'
  | 'removeEventListener';

/** Methods receivers commonly add on top of the spec (Gumlet's receiver, for one). Only used when advertised. */
export type PlayerJsExtensionMethod = 'setPlaybackRate' | 'getPlaybackRate';

/** @internal */
export type PlayerJsMethod = PlayerJsSpecMethod | PlayerJsExtensionMethod;

/** Events from the player.js spec. */
export type PlayerJsSpecEvent = 'ready' | 'play' | 'pause' | 'ended' | 'timeupdate' | 'progress' | 'error';

/** Events receivers commonly add on top of the spec. Only subscribed to when advertised. */
export type PlayerJsExtensionEvent =
  | 'seeked'
  | 'volumeChange'
  | 'playbackRateChange'
  // Bunny Stream's spelling of the same two.
  | 'volumechange'
  | 'playbackratechange';

/** @internal */
export type PlayerJsEvent = PlayerJsSpecEvent | PlayerJsExtensionEvent;

/**
 * What an embed is assumed to support when its `ready` message carries no lists. The spec's own methods and events, and
 * nothing beyond them: an extension is only used once an embed says it has it.
 */
export const SPEC_METHODS: readonly PlayerJsSpecMethod[] = [
  'play',
  'pause',
  'getPaused',
  'mute',
  'unmute',
  'getMuted',
  'setVolume',
  'getVolume',
  'getDuration',
  'setCurrentTime',
  'getCurrentTime',
  'setLoop',
  'getLoop',
  'addEventListener',
  'removeEventListener',
];

export const SPEC_EVENTS: readonly PlayerJsSpecEvent[] = [
  'ready',
  'play',
  'pause',
  'ended',
  'timeupdate',
  'progress',
  'error',
];

/** What a command carries: an event name, a volume, a time, a rate, or a loop flag. */
export type PlayerJsCommandValue = string | number | boolean;

/**
 * A command on its way to the embed.
 *
 * @internal
 */
export interface PlayerJsCommandMessage {
  context: typeof PLAYER_CONTEXT;
  version: string;
  method: PlayerJsMethod;
  value?: PlayerJsCommandValue;
  listener?: string;
}

/**
 * A message from the embed: an event it fires, or the answer to a getter, which comes back as an event named after the
 * method. `value` stays unknown: it arrives from another origin and its shape depends on the embed.
 *
 * @internal
 */
export interface PlayerJsEventMessage {
  context: typeof PLAYER_CONTEXT;
  version?: string;
  /** Widened past the known events, since embeds report ones we don't handle. */
  event: PlayerJsEvent | PlayerJsMethod | (string & {});
  listener?: string;
  value?: unknown;
}

/**
 * Payload of `ready`: which frame is ready, and what it can do.
 *
 * @internal
 */
export interface PlayerJsReadyValue {
  src?: string;
  methods?: string[];
  events?: string[];
}

/** Payload of `timeupdate` and `progress`. `percent` (0-100) is how some receivers report `progress` instead. */
export interface PlayerJsTimeValue {
  seconds?: number;
  duration?: number;
  percent?: number;
}

/** Payload of `error`. The spec leaves most of it open, so every field is optional. */
export interface PlayerJsErrorValue {
  code?: number;
  msg?: string;
}

// https://github.com/embedly/player.js/blob/master/SPEC.rst#events
export const ERROR_UNDEFINED = -1;
export const ERROR_NOT_SUPPORTED = 1;
// The spec calls 2 "method not supported"; the reference receiver reports 2 for an unknown method and 3 for a known
// one it doesn't implement. Neither says anything about the media.
export const ERROR_INVALID_METHOD = 2;
export const ERROR_METHOD_NOT_SUPPORTED = 3;

/**
 * Read a `message` event's data as a player.js message. The spec sends JSON strings; some receivers post objects, so
 * both are accepted. Anything else on the window — every frame posts here — comes back null.
 */
export function parsePlayerJsMessage(data: unknown): PlayerJsEventMessage | null {
  let message: unknown = data;

  if (isString(data)) {
    // Cheap reject before parsing: other frames post plenty of strings that are not ours.
    if (!data.includes(PLAYER_CONTEXT)) return null;

    try {
      message = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!isObject(message)) return null;

  const { context, event } = message as Partial<PlayerJsEventMessage>;

  return context === PLAYER_CONTEXT && isString(event) ? (message as PlayerJsEventMessage) : null;
}

/** Build a command message, serialized the way the spec sends it. */
export function createPlayerJsCommand(method: PlayerJsMethod, value?: PlayerJsCommandValue, listener?: string): string {
  const message: PlayerJsCommandMessage = {
    context: PLAYER_CONTEXT,
    version: PLAYER_VERSION,
    method,
    ...(value !== undefined && { value }),
    ...(listener !== undefined && { listener }),
  };

  return JSON.stringify(message);
}

/** Whether a `ready` payload's lists, where present, are lists of names. */
export function isPlayerJsReadyValue(value: unknown): value is PlayerJsReadyValue {
  if (!isObject(value)) return false;

  const { methods, events } = value as Record<string, unknown>;

  return isOptionalStringArray(methods) && isOptionalStringArray(events);
}

/** Whether a `timeupdate` or `progress` payload's fields, where present, are numbers. */
export function isPlayerJsTimeValue(value: unknown): value is PlayerJsTimeValue {
  if (!isObject(value)) return false;

  const { seconds, duration, percent } = value as Record<string, unknown>;

  return [seconds, duration, percent].every((field) => isUndefined(field) || isNumber(field));
}

/** Whether an `error` payload's fields, where present, have the spec's types. */
export function isPlayerJsErrorValue(value: unknown): value is PlayerJsErrorValue {
  if (!isObject(value)) return false;

  const { code, msg } = value as Record<string, unknown>;

  return (isUndefined(code) || isNumber(code)) && (isUndefined(msg) || isString(msg));
}

function isOptionalStringArray(value: unknown): boolean {
  return isUndefined(value) || (Array.isArray(value) && value.every(isString));
}
