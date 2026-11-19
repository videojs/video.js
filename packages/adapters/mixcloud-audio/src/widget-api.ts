// Typings and helpers for the postMessage protocol the Mixcloud Widget speaks. The official `widgetApi.js` client
// (https://www.mixcloud.com/developers/widget/) is a thin wrapper over it: the widget announces `ready`, answers a
// `getApi` request with the methods and events it offers, and only then reports events.

import { isNumber, isObject, isString } from '@videojs/utils/predicate';

/**
 * Where the widget is served from: commands are posted to it, and only its messages are read. Mixcloud's embed code
 * points at `www.mixcloud.com/widget/iframe/`, which redirects here.
 */
export const WIDGET_ORIGIN = 'https://player-widget.mixcloud.com';

/** The widget's events, spelled as the protocol spells them. */
export type MixcloudWidgetEvent = 'progress' | 'buffering' | 'play' | 'pause' | 'ended' | 'error';

/** Methods answer with a `methodResponse` carrying the id they were called with. */
export type MixcloudWidgetMethod =
  | 'load'
  | 'play'
  | 'pause'
  | 'togglePlay'
  | 'seek'
  | 'setOption'
  | 'getPosition'
  | 'getDuration'
  | 'getIsPaused'
  | 'getVolume'
  | 'setVolume'
  | 'getCurrentKey'
  | 'enableHotkeys';

/** A message from the widget. */
export type MixcloudWidgetMessage =
  | { type: 'ready' }
  | { type: 'api'; data?: unknown }
  | { type: 'event'; eventName: string; args: unknown[] }
  | { type: 'methodResponse'; methodId: number; value: unknown };

/** Read a `message` event's data as a widget message; anything else another frame posts comes back null. */
export function parseMixcloudMessage(data: unknown): MixcloudWidgetMessage | null {
  if (!isString(data) || !data.includes(MESSAGE_MARKER)) return null;

  let message: unknown;

  try {
    message = JSON.parse(data);
  } catch {
    return null;
  }

  if (!isObject(message)) return null;

  const { mixcloud, type, data: payload } = message as { mixcloud?: unknown; type?: unknown; data?: unknown };
  if (mixcloud !== 'playerWidget') return null;

  if (type === 'ready' || type === 'api') return { type };

  if (!isObject(payload)) return null;

  const fields = payload as Record<string, unknown>;

  if (type === 'event' && isString(fields.eventName)) {
    return { type, eventName: fields.eventName, args: Array.isArray(fields.args) ? fields.args : [] };
  }

  if (type === 'methodResponse' && isNumber(fields.methodId)) {
    return { type, methodId: fields.methodId, value: fields.value };
  }

  return null;
}

/** Ask the widget for its API, which also switches on its events. */
export function createMixcloudApiRequest(): string {
  return JSON.stringify({ type: 'getApi' });
}

export function createMixcloudMethodCall(methodId: number, methodName: MixcloudWidgetMethod, args: unknown[]): string {
  return JSON.stringify({ type: 'method', data: { methodId, methodName, args } });
}

const MESSAGE_MARKER = '"playerWidget"';
