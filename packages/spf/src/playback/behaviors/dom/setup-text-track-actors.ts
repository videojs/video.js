import type { AnySlotMap, Behavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal, Signal } from '../../../core/signals/primitives';
import { createTextTracksActor } from '../../actors/dom/text-tracks';
import {
  createTextTrackSegmentLoaderActor,
  type TextTrackSegmentLoaderActor,
  type TextTrackSegmentLoaderActorConfig,
} from '../../actors/text-track-segment-loader';
import type { TextTracksActor } from '../../actors/text-tracks';
import type { TextMessagePipelines, TextTrackSegmentResolver } from '../../primitives/text-segment-load-pipeline';
import { TEXT_TYPE_CONFIG } from '../../primitives/track-types';

export interface TextTrackActorsContext {
  mediaElement?: HTMLMediaElement | undefined;
  textTracksActor?: TextTracksActor<VTTCue> | undefined;
  textTrackSegmentLoaderActor?: TextTrackSegmentLoaderActor | undefined;
}

export interface TextTrackActorsConfig extends Pick<TextTrackSegmentLoaderActorConfig<VTTCue>, 'forwardBuffer'> {
  resolveTextTrackSegment: TextTrackSegmentResolver<VTTCue>;
  /**
   * Ordered text step pipeline, mapped to the loader's `messagePipelines`. Named with the `text` domain prefix to
   * mirror the v/a `video`/`audioMessagePipelines` composition-config slots. Defaults (in the loader) to `resolveCues →
   * dispatchCues`.
   */
  textMessagePipelines?: TextMessagePipelines<VTTCue>;
}

function setupTextTrackActorsSetup({
  state,
  context,
  config,
}: {
  // Forwarded opaquely into the loader's steps (relocation reads composition state);
  // this behavior owns no state of its own (stateKeys: []).
  state: AnySlotMap;
  context: {
    mediaElement: ReadonlySignal<TextTrackActorsContext['mediaElement']>;
    textTracksActor: Signal<TextTrackActorsContext['textTracksActor']>;
    textTrackSegmentLoaderActor: Signal<TextTrackActorsContext['textTrackSegmentLoaderActor']>;
  };
  config: TextTrackActorsConfig;
}): () => void {
  return effect(() => {
    const mediaElement = context.mediaElement.get();
    if (!mediaElement) return;

    const textTracksActor = createTextTracksActor(mediaElement);
    const textTrackSegmentLoaderActor = createTextTrackSegmentLoaderActor(
      textTracksActor,
      config.resolveTextTrackSegment,
      { forwardBuffer: config.forwardBuffer, messagePipelines: config[TEXT_TYPE_CONFIG.messagePipelinesKey] },
      // Composition deps forwarded into each step (relocation reads the primary A/V origin).
      { state, context, config }
    );

    context.textTracksActor.set(textTracksActor);
    context.textTrackSegmentLoaderActor.set(textTrackSegmentLoaderActor);

    return () => {
      textTracksActor.destroy();
      textTrackSegmentLoaderActor.destroy();
      context.textTracksActor.set(undefined);
      context.textTrackSegmentLoaderActor.set(undefined);
    };
  });
}

/**
 * **Own the TextTracks actor pair for the current `mediaElement`.** When a `mediaElement` is in scope, creates the
 * `TextTracksActor` (bound to the element's `textTracks`) and the `TextTrackSegmentLoaderActor` (bound to that actor +
 * the injected cue resolver), and publishes both on `context`. On element identity change or behavior destroy, destroys
 * both actors and clears the slots.
 *
 * Single-resource synchronous create/destroy driven by one signal — the simple-effect form is the right shape (per
 * `behaviors.md` → "Where both shapes are legitimate": criterion 4b applies; sole writer of `textTracksActor` /
 * `textTrackSegmentLoaderActor`, the effect's cleanup return handles destroy + slot clear structurally).
 *
 * Pairs with the `loadTextTrackSegments` behavior (a per-type variant of `setupSegmentLoading` in `load-segments.ts`),
 * which only reads `textTrackSegmentLoaderActor`. The cue resolver is injected via `config` so this behavior owns the
 * DOM-bound part of the text-track pipeline.
 */
// Manual `Behavior` literal (like `end-of-stream`): no state of its own
// (`stateKeys: []`), but the setup forwards the composition `state` to the resolver
// opaquely. A literal (not `defineBehavior`) so `stateKeys: []` can coexist with a
// setup that reads `state`.
export const setupTextTrackActors: Behavior<
  Record<never, never>,
  {
    mediaElement: ReadonlySignal<TextTrackActorsContext['mediaElement']>;
    textTracksActor: Signal<TextTrackActorsContext['textTracksActor']>;
    textTrackSegmentLoaderActor: Signal<TextTrackActorsContext['textTrackSegmentLoaderActor']>;
  },
  TextTrackActorsConfig
> = {
  stateKeys: [],
  contextKeys: ['mediaElement', 'textTracksActor', 'textTrackSegmentLoaderActor'],
  setup: setupTextTrackActorsSetup,
};
