// The HyperFrames runtime bridge (protocol v1): the host posts `hf-parent` controls into the composition frame, and
// the runtime posts `hf-preview` reports back. Only the messages the adapter acts on are typed here.
// https://github.com/heygen-com/hyperframes/blob/main/packages/core/src/runtime/README.md

import { isNumber, isObject } from '@videojs/utils/predicate';

/** The protocol version the adapter speaks; a runtime reporting another is refused. */
export const RUNTIME_PROTOCOL_VERSION = 1;

/** Controls the adapter sends. */
export type RuntimeControlAction =
  | 'play'
  | 'pause'
  | 'seek'
  | 'tick'
  | 'set-muted'
  | 'set-volume'
  | 'set-playback-rate';

/** A frame rate as the protocol carries it, so rates such as 29.97 stay exact. */
export interface RuntimeFps {
  numerator: number;
  denominator: number;
}

/** The rate a runtime is assumed to run at until it reports its own, as the runtime assumes for a legacy host. */
export const DEFAULT_RUNTIME_FPS: RuntimeFps = { numerator: 30, denominator: 1 };

export interface RuntimeControlMessage {
  source: 'hf-parent';
  type: 'control';
  action: RuntimeControlAction;
  protocolVersion: typeof RUNTIME_PROTOCOL_VERSION;
  // A v1 runtime refuses a control that declares a version without these two.
  capabilities: readonly string[];
  fps: RuntimeFps;
  [key: string]: unknown;
}

/** Sent once the runtime listens for controls, again on every reload of the composition document. */
export interface RuntimeReadyMessage {
  type: 'ready';
}

/** The composition's manifest, posted once it binds a timeline and again whenever the manifest changes. */
export interface RuntimeTimelineMessage {
  type: 'timeline';
  durationSeconds: number;
  durationInFrames: number;
  compositionWidth?: number | undefined;
  compositionHeight?: number | undefined;
}

/** Posted once the composition's media, images, and fonts have settled, or the runtime stopped waiting on them. */
export interface RuntimeAssetsReadyMessage {
  type: 'assets-ready';
  timedOut?: boolean;
}

/** The playhead, posted every frame while playing and on a slower heartbeat while paused. */
export interface RuntimeStateMessage {
  type: 'state';
  currentTime: number;
  isPlaying: boolean;
  ended: boolean;
  buffering: boolean;
}

export type RuntimeMessage = (
  | RuntimeReadyMessage
  | RuntimeTimelineMessage
  | RuntimeAssetsReadyMessage
  | RuntimeStateMessage
  | { type: 'unsupported-protocol'; version: unknown }
) & {
  /** The composition's frame rate, where the runtime reported one with the message. */
  fps?: RuntimeFps | undefined;
};

export function createRuntimeControl(
  action: RuntimeControlAction,
  fps: RuntimeFps,
  extra: Record<string, unknown> = {}
): RuntimeControlMessage {
  return {
    ...extra,
    source: 'hf-parent',
    type: 'control',
    action,
    protocolVersion: RUNTIME_PROTOCOL_VERSION,
    capabilities: [],
    fps,
  };
}

export function fpsToNumber({ numerator, denominator }: RuntimeFps): number {
  return numerator / denominator;
}

function parseFps(value: unknown): RuntimeFps | undefined {
  if (!isObject(value)) return undefined;

  const { numerator, denominator } = value as Record<string, unknown>;

  return isNumber(numerator) && isNumber(denominator) && numerator > 0 && denominator > 0
    ? { numerator, denominator }
    : undefined;
}

/** The runtime message in `data`, or null when it is not one the adapter acts on. */
export function parseRuntimeMessage(data: unknown): RuntimeMessage | null {
  const message = parseMessage(data);
  if (!message) return null;

  const fps = parseFps((data as Record<string, unknown>).fps);

  return fps ? { ...message, fps } : message;
}

function parseMessage(data: unknown): RuntimeMessage | null {
  if (!isObject(data) || (data as { source?: unknown }).source !== 'hf-preview') return null;

  const message = data as Record<string, unknown>;

  // A message without a version predates the protocol and is read as v1, as the runtime itself does.
  if ('protocolVersion' in message && message.protocolVersion !== RUNTIME_PROTOCOL_VERSION) {
    return { type: 'unsupported-protocol', version: message.protocolVersion };
  }

  switch (message.type) {
    case 'ready':
      return { type: 'ready' };
    case 'timeline':
      if (!isNumber(message.durationInFrames) || !isNumber(message.durationSeconds)) return null;

      return {
        type: 'timeline',
        durationSeconds: message.durationSeconds,
        durationInFrames: message.durationInFrames,
        compositionWidth: isNumber(message.compositionWidth) ? message.compositionWidth : undefined,
        compositionHeight: isNumber(message.compositionHeight) ? message.compositionHeight : undefined,
      };
    case 'assets-ready':
      return { type: 'assets-ready', timedOut: message.timedOut === true };
    case 'state':
      if (!isNumber(message.currentTime)) return null;

      return {
        type: 'state',
        currentTime: message.currentTime,
        isPlaying: message.isPlaying === true,
        ended: message.ended === true,
        buffering: message.buffering === true,
      };
    default:
      return null;
  }
}
