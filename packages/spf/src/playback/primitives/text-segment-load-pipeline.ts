/**
 * The text-track **load pipeline** — the step vocabulary and base steps a text-segment loader runs, the text mirror of
 * `segment-load-pipeline`. Extracted from the loader actor so the "what" (the composable steps) is separable from the
 * "how" (scheduling). A pipeline is a flat, ordered list of {@link TextLoadStep}s (text has a single op type, so no
 * per-type `Record`); the default is `resolveCues → dispatchCues`, and a composition can insert its own steps (e.g.
 * non-zero-PTS cue rebase) without the loader knowing.
 *
 * The dispatch step reaches its cue sink through the structural {@link CueSink} seam rather than the concrete
 * `TextTracksActor` type — the loader folds the real actor into `config`, and it satisfies the seam by structure — so
 * this module names no actor and stays DOM-free (generic over the cue type `C`).
 */
import type { AnySlotMap } from '../../core/composition/define-behavior';
import type { Cue, Segment } from '../../media/types';
import type { AddCuesMessage } from './text-track-messages';

// ============================================================================
// SINK SEAM
// ============================================================================

/**
 * The structural view of a cue sink the base steps use — just the `send` {@link dispatchCuesStep} needs. The concrete
 * `TextTracksActor` satisfies it by structure, so the pipeline names no actor.
 */
export interface CueSink<C extends Cue = Cue> {
  send(message: AddCuesMessage<C>): void;
}

// ============================================================================
// STEP MODEL
// ============================================================================

/**
 * Resolves a text-track segment URL into the array of cues it contains.
 *
 * "Resolve" because the fn covers both network fetch and parse into the domain model. Host-agnostic — the concrete
 * resolver (e.g. the browser's native VTT resolver) is supplied at engine-assembly time, so this stays DOM-free. A pure
 * `url → cues` primitive (the text analog of the v/a loader's `fetchBytes`); composition-awareness lives in the
 * injected {@link TextLoadStep}s, not here.
 */
export type TextTrackSegmentResolver<C extends Cue = Cue> = (url: string) => Promise<C[]>;

/** Internal load-task descriptor — one segment fetch + dispatch unit. */
export interface TextLoadTask {
  segment: Segment;
  trackId: string;
}

/**
 * A text load in mid-pipeline — the text analog of the v/a loader's `Frame`. `resolveCuesStep` fills `cues`;
 * `dispatchCuesStep` sends them. `metadata` is opaque header metadata a resolve step may attach for a later step to
 * read (e.g. relocation stashes the `X-TIMESTAMP-MAP` correlation here for its rebase step). Typed `unknown` so the
 * generic loader stays host-agnostic — the step that reads it knows its concrete shape (mirrors `StepDeps.state`).
 */
export interface TextFrame<C extends Cue = Cue> {
  readonly op: TextLoadTask;
  cues?: C[];
  metadata?: unknown;
}

/**
 * One stage of a text message pipeline — the text analog of the v/a loader's `LoadStep`. Mutates the {@link TextFrame}
 * in place and may be async; the runner checks `signal.aborted` before each step and passes the actor's
 * {@link TextStepDeps} on every call, so a stateless step (`resolveCuesStep`) is a plain value and a step that needs
 * composition signals (relocation's cue rebase) reads them from `deps` at call time.
 */
export type TextLoadStep<C extends Cue = Cue> = (
  frame: TextFrame<C>,
  signal: AbortSignal,
  deps: TextStepDeps
) => void | Promise<void>;

/**
 * The uniform passthrough handed to each {@link TextLoadStep} — the composition triple, the text analog of `StepDeps`.
 * `state`/`context` are the composition signal maps; `config` is the threaded config with the loader's wiring folded in
 * (see {@link textStepWiring} + `createTextTrackSegmentLoaderActor`). Typed loose: composition steps read `state`; base
 * steps read the folded wiring off `config`.
 */
export interface TextStepDeps {
  state: AnySlotMap;
  context: AnySlotMap;
  config: object;
}

/**
 * Base-step view of the loader's wiring, folded into `config` by `createTextTrackSegmentLoaderActor` so base steps read
 * it from the uniform passthrough — present in both composition and standalone use. `config` is loose (`object`), so
 * assert the shape here (mirrors the v/a loader's `stepWiring`). The sink is the structural {@link CueSink}, not the
 * concrete actor.
 */
export function textStepWiring<C extends Cue>(
  deps: TextStepDeps
): { textTracksActor: CueSink<C>; resolveSegment: TextTrackSegmentResolver<C> } {
  return deps.config as { textTracksActor: CueSink<C>; resolveSegment: TextTrackSegmentResolver<C> };
}

/**
 * Builds the ordered step list, called **once per actor** (mirrors the v/a loader's `MessagePipelines`, but text has a
 * single op type so it's a flat array, not a `Record`). The default ({@link DEFAULT_TEXT_MESSAGE_PIPELINES}) is
 * `resolveCues → dispatchCues`; a non-zero-PTS composition returns a list that inserts a cue-rebase step (see
 * `relocatingTextPipelines`), so the loader stays oblivious to relocation.
 */
export type TextMessagePipelines<C extends Cue = Cue> = () => TextLoadStep<C>[];

// ============================================================================
// BASE STEPS
// ============================================================================

// Base steps are generic over the cue type `C` (generic arrow consts, not
// `TextLoadStep<Cue>` values): each touches `C` — `frame.cues: C[]` and the
// `C`-typed `textStepWiring<C>` — so a `Cue`-typed const wouldn't slot into a
// `VTTCue` pipeline. A generic function assigns to any `TextLoadStep<C>`.

/** Resolve the op's cues (via the injected host primitive) into the frame. The text analog of `fetchStep`. */
export const resolveCuesStep = async <C extends Cue>(
  frame: TextFrame<C>,
  signal: AbortSignal,
  deps: TextStepDeps
): Promise<void> => {
  const cues = await textStepWiring<C>(deps).resolveSegment(frame.op.segment.url);

  if (signal.aborted) return;

  frame.cues = cues;
};

/** Dispatch the frame's cues to the TextTracksActor as `add-cues`. The text analog of `dispatchStep`. */
export const dispatchCuesStep = <C extends Cue>(
  frame: TextFrame<C>,
  _signal: AbortSignal,
  deps: TextStepDeps
): void => {
  const { op } = frame;

  textStepWiring<C>(deps).textTracksActor.send({
    type: 'add-cues',
    meta: {
      trackId: op.trackId,
      id: op.segment.id,
      startTime: op.segment.startTime,
      duration: op.segment.duration,
    },
    cues: frame.cues ?? [],
  });
};

/** Tier 0 default: resolve then dispatch. No relocation vocabulary. */
export const DEFAULT_TEXT_MESSAGE_PIPELINES = <C extends Cue>(): TextLoadStep<C>[] => [
  resolveCuesStep,
  dispatchCuesStep,
];
