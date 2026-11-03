// Typings and helpers for the postMessage protocol the SoundCloud Widget speaks
// (https://developers.soundcloud.com/docs/api/html5-widget). The official `api.js` client is a thin wrapper over it,
// written against `widget.load()`, which rewrites every parameter but `start_track` to `true` or `false` and so cannot
// carry `color`.

import { isNumber, isObject, isString } from '@videojs/utils/predicate';

/** Where the widget is served from: commands are posted to it, and only its messages are read. */
export const WIDGET_ORIGIN = 'https://w.soundcloud.com';

/** The widget's events, spelled as the protocol spells them. */
export type SoundCloudWidgetEvent =
  | 'ready'
  | 'loadProgress'
  | 'playProgress'
  | 'play'
  | 'pause'
  | 'finish'
  | 'seek'
  | 'error'
  | 'sharePanelOpened'
  | 'downloadClicked'
  | 'buyClicked';

/** Getters answer with a message named after themselves, in the order they were asked. */
export type SoundCloudWidgetGetter =
  | 'getVolume'
  | 'getDuration'
  | 'getPosition'
  | 'getSounds'
  | 'getCurrentSound'
  | 'getCurrentSoundIndex'
  | 'isPaused';

export type SoundCloudWidgetCommand =
  | 'play'
  | 'pause'
  | 'toggle'
  | 'seekTo'
  | 'setVolume'
  | 'next'
  | 'prev'
  | 'skip'
  | 'addEventListener'
  | 'removeEventListener';

/**
 * Payload of the audio events. Positions are in milliseconds and `loadedProgress` is the share of the sound loaded, `0`
 * to `1`. The reference documents it as `loadProgress`, so both spellings are read.
 */
export interface SoundCloudProgress {
  soundId?: number;
  currentPosition?: number;
  relativePosition?: number;
  loadedProgress?: number;
  loadProgress?: number;
}

/** A message from the widget. `widgetId` names the document that sent it and changes with every load. */
export interface SoundCloudWidgetMessage {
  method: SoundCloudWidgetEvent | SoundCloudWidgetGetter | (string & {});
  value?: unknown;
  widgetId?: string;
}

/** Read a `message` event's data as a widget message; anything else another frame posts comes back null. */
export function parseSoundCloudMessage(data: unknown): SoundCloudWidgetMessage | null {
  if (!isString(data) || !data.includes('"method"')) return null;

  let message: unknown;

  try {
    message = JSON.parse(data);
  } catch {
    return null;
  }

  return isObject(message) && isString((message as Partial<SoundCloudWidgetMessage>).method)
    ? (message as SoundCloudWidgetMessage)
    : null;
}

export function createSoundCloudCommand(
  method: SoundCloudWidgetCommand | SoundCloudWidgetGetter,
  value?: string | number
): string {
  return JSON.stringify(value === undefined ? { method } : { method, value });
}

export function isSoundCloudProgress(value: unknown): value is SoundCloudProgress {
  if (!isObject(value)) return false;

  const { currentPosition } = value as Record<string, unknown>;

  return isNumber(currentPosition);
}

/** The share of the sound the widget has loaded, under either spelling. */
export function loadedShareOf(progress: SoundCloudProgress): number | undefined {
  const share = progress.loadedProgress ?? progress.loadProgress;

  return isNumber(share) ? share : undefined;
}
