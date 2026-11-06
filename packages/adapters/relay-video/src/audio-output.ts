import { type AudioPlayer, createAudioPlayer } from '@caprid/moq-media';
import { noop } from '@videojs/utils/function';

/**
 * Whether an element's audio can play: `off` until an `AudioContext` runs, which a browser allows only from a user
 * gesture; `starting` while the context runs and the player loads its worklet; `ready` once the player takes inputs.
 */
export type AudioOutputStatus = { state: 'off' } | { state: 'starting' } | { state: 'ready'; player: AudioPlayer };

export interface AudioOutput {
  readonly status: AudioOutputStatus;
  /** Start the output as soon as the page allows it: at once inside a user gesture, else at the next gesture. */
  request(): void;
  /** Stop waiting for a gesture. A context already running keeps running. */
  cancelRequest(): void;
  /** The output's gain, from 0 (silent) to 1. */
  gain: number;
  close(): void;
}

export interface AudioOutputOptions {
  /** The status changed. */
  onChange(): void;
}

type Player = { state: 'loading' } | { state: 'failed' } | { state: 'loaded'; player: AudioPlayer };

const OFF: AudioOutputStatus = { state: 'off' };
const STARTING: AudioOutputStatus = { state: 'starting' };

// Input events that grant user activation, which `AudioContext` needs to start.
const GESTURES = ['pointerdown', 'pointerup', 'keydown'] as const;

export function createAudioOutput({ onChange }: AudioOutputOptions): AudioOutput {
  let output: { context: AudioContext; player: Player } | null = null;
  let gain = 1;
  let waiting = false;
  let closed = false;

  const hasActivation = () => globalThis.navigator?.userActivation?.isActive ?? true;

  const status = (): AudioOutputStatus => {
    if (output?.context.state !== 'running') return OFF;

    const { player } = output;
    if (player.state === 'loaded') return { state: 'ready', player: player.player };

    return player.state === 'loading' ? STARTING : OFF;
  };

  const open = (): { context: AudioContext; player: Player } => {
    const context = new AudioContext({ latencyHint: 'interactive' });
    const opened: { context: AudioContext; player: Player } = { context, player: { state: 'loading' } };

    context.addEventListener('statechange', onChange);
    createAudioPlayer({ context }).then(
      (player) => {
        if (closed) {
          player.close();
          return;
        }

        player.output.gain.value = gain;
        player.output.connect(context.destination);
        opened.player = { state: 'loaded', player };
        onChange();
      },
      (error: unknown) => {
        if (__DEV__) console.warn('<relay-video> could not start its audio player; playing video only.', error);

        opened.player = { state: 'failed' };
        onChange();
      }
    );

    return opened;
  };

  const start = () => {
    stopWaiting();
    output ??= open();

    if (output.context.state !== 'running') output.context.resume().catch(noop);
  };

  const onGesture = () => {
    if (hasActivation()) start();
  };

  const stopWaiting = () => {
    if (!waiting) return;

    waiting = false;

    for (const type of GESTURES) globalThis.document?.removeEventListener(type, onGesture, true);
  };

  return {
    get status() {
      return status();
    },
    request() {
      if (closed || !globalThis.AudioContext || output?.context.state === 'running') return;

      if (hasActivation()) {
        start();
        return;
      }

      if (waiting) return;

      waiting = true;

      for (const type of GESTURES) globalThis.document?.addEventListener(type, onGesture, true);
    },
    cancelRequest: stopWaiting,
    get gain() {
      return gain;
    },
    set gain(value) {
      gain = value;

      if (output?.player.state === 'loaded') output.player.player.output.gain.value = value;
    },
    close() {
      closed = true;
      stopWaiting();

      if (!output) return;

      output.context.removeEventListener('statechange', onChange);

      if (output.player.state === 'loaded') output.player.player.close();

      output.context.close().catch(noop);
      output = null;
    },
  };
}
