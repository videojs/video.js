/**
 * The v/a segment **load pipeline** — the step vocabulary and base steps a segment loader runs, extracted from the
 * loader actor so the "what" (the composable steps) is separable from the "how" (the actor's scheduling). A pipeline is
 * a per-op list of {@link LoadStep}s the loader drains in order; the default is `fetch → dispatch`, and a composition
 * can insert its own steps between them (e.g. non-zero-PTS relocation) without the loader knowing.
 *
 * The base steps reach their SourceBuffer sink through the structural {@link AppendSink} seam rather than the concrete
 * actor type — the loader folds the real actor into `config` at construction, and it satisfies the seam by structure —
 * so this module carries no dependency on the actor implementation, and no dependency on the DOM.
 */
import type { AnySlotMap } from '../../core/composition/define-behavior';
import { effect } from '../../core/signals/effect';
import type { ReadonlySignal } from '../../core/signals/primitives';
import type { AddressableObject } from '../../media/types';
import type {
  AppendInitMessage,
  AppendSegmentMessage,
  IndividualSourceBufferMessage,
  RemoveMessage,
} from './source-buffer-messages';

// ============================================================================
// SINK SEAM
// ============================================================================

/**
 * The structural view of a SourceBuffer sink the base steps use — just the ops {@link dispatchStep} needs (`send` + a
 * `snapshot` to await idle). The concrete `SourceBufferActor` satisfies it by structure, so the pipeline names no
 * actor.
 */
export interface AppendSink {
  send(message: IndividualSourceBufferMessage): void;
  snapshot: ReadonlySignal<{ value: string }>;
}

// ============================================================================
// STEP MODEL
// ============================================================================

/**
 * A LoadTask is the intent to perform one unit of SegmentLoader work. Unlike SourceBufferMessage, fetch-based tasks
 * carry a URL rather than pre-fetched data — the runner fetches and appends them in sequence.
 *
 * Derived from SourceBufferMessage types by removing `data` and adding a fetch URL via AddressableObject.
 *
 * @todo Rename — "LoadTask" risks confusion with the `Task` class used for SourceBufferActor scheduling. These are
 *   closer to operation descriptors or messages than tasks in that sense.
 */
export type LoadTask =
  | (Omit<AppendInitMessage, 'data'> & AddressableObject)
  | (Omit<AppendSegmentMessage, 'data'> & AddressableObject)
  | RemoveMessage;

/**
 * A {@link LoadTask} mid-reassembly into its append message. `LoadTask` is a message with `data` omitted and a URL
 * added; the pipeline reverses that — `fetchStep` produces `data`, `dispatchStep` reassembles the message. `data` is
 * the omitted payload (kept as the fetched stream — the loader never produces the `ArrayBuffer` arm of `SegmentData` —
 * widened back at dispatch). `meta` overrides `op.meta` for `append-segment` (e.g. a stamped `timestampOffset`); an
 * `append-init` dispatches `op.meta` directly.
 */
export interface Frame {
  readonly op: LoadTask;
  data?: AsyncIterable<Uint8Array>;
  meta?: AppendSegmentMessage['meta'];
}

/**
 * One stage of a message pipeline. Mutates the {@link Frame} in place and may be async; the runner checks
 * `signal.aborted` before each step and passes the actor's {@link StepDeps} on every call, so a stateless step (e.g.
 * {@link fetchStep}) is a plain value, and a step that needs composition signals (relocation's discover/stamp) reads
 * them from `deps` at call time.
 */
export type LoadStep = (frame: Frame, signal: AbortSignal, deps: StepDeps) => void | Promise<void>;

/**
 * The uniform passthrough handed to every {@link LoadStep} on every call — the composition triple, nothing more.
 * `state`/`context` are the full composition signal maps; `config` is the threaded config with the loader's own wiring
 * folded in (see {@link stepWiring} + `createSegmentLoaderActor`). All three are typed loose: the loader is a conduit
 * and never reads them; a step asserts the slots it knows are present (composition steps read `state`; base steps read
 * the folded wiring off `config`).
 */
export interface StepDeps {
  state: AnySlotMap;
  context: AnySlotMap;
  config: object;
}

/**
 * Base-step view of the loader's own wiring. `createSegmentLoaderActor` folds its `sourceBufferActor` + `fetch` into
 * the threaded `config` so base steps read them from the uniform passthrough — present whether the loader runs inside a
 * composition or standalone. `config` is loose (`object`), so assert the shape here (one cast, like relocation's
 * `containerSlot`).
 */
function stepWiring(deps: StepDeps): { sourceBufferActor: AppendSink; fetch: FetchBytes } {
  return deps.config as { sourceBufferActor: AppendSink; fetch: FetchBytes };
}

/**
 * Builds the ordered step list for each message type. Called **once per actor** — its role is per-actor instantiation,
 * so stateful steps (relocation's origin discoverer) get fresh state per source reset; deps arrive at step-call time,
 * not here. The default ({@link DEFAULT_MESSAGE_PIPELINES}) is `fetch → dispatch`; a non-zero-PTS composition returns a
 * map that inserts its own discover/stamp steps between them (see `establishStartMediaTime`), so the loader stays
 * oblivious to relocation and the Tier 0 pipeline carries no relocation vocabulary at all.
 */
export type MessagePipelines = () => Record<LoadTask['type'], LoadStep[]>;

// ============================================================================
// BASE STEPS
// ============================================================================

export type FetchBytes = (
  addressable: AddressableObject,
  options?: RequestInit & { minChunkSize?: number }
) => Promise<AsyncIterable<Uint8Array>>;

/**
 * Resolves when the SourceBufferActor snapshot reaches 'idle'. Rejects if the signal is aborted or the actor is
 * destroyed.
 *
 * Used to sequence SourceBufferActor operations without awaiting send() directly — send() is fire-and-forget; callers
 * observe completion via state transition.
 */
function waitForIdle(snapshot: AppendSink['snapshot'], signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (snapshot.get().value === 'idle') {
      resolve();
      return;
    }

    if (snapshot.get().value === 'destroyed') {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    let stop: (() => void) | undefined;

    const cleanup = (fn: () => void) => {
      stop?.();
      signal.removeEventListener('abort', onAbort);
      fn();
    };

    const onAbort = () => cleanup(() => reject(signal.reason));

    stop = effect(() => {
      const value = snapshot.get().value;

      if (value === 'idle') cleanup(resolve);
      else if (value === 'destroyed') cleanup(() => reject(new DOMException('Aborted', 'AbortError')));
    });

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Build the SourceBuffer message a completed frame dispatches. `fetchStep` always precedes `dispatchStep` in append
 * pipelines, so `data` is set by now.
 */
function toMessage({ op, data, meta }: Frame): IndividualSourceBufferMessage {
  switch (op.type) {
    case 'remove':
      return op;
    case 'append-init':
      return { type: 'append-init', data: data!, meta: op.meta };
    case 'append-segment':
      return { type: 'append-segment', data: data!, meta: meta ?? op.meta };
  }
}

/**
 * Fetch this op's bytes into the frame. Init segments need the full body (`minChunkSize: Infinity`) before appending;
 * media segments stream so chunks append as they arrive. Awaiting headers eagerly also starts the HTTP connection (and
 * records the fetch in observers like tests).
 */
export const fetchStep: LoadStep = async (frame, signal, deps) => {
  const { op } = frame;
  if (op.type === 'remove') return; // fetchStep only appears in append pipelines

  const { fetch } = stepWiring(deps);

  frame.data = await fetch(op, op.type === 'append-init' ? { signal, minChunkSize: Infinity } : { signal });
};

/** Dispatch the frame's message to the SourceBufferActor and await its return to idle. */
export const dispatchStep: LoadStep = async (frame, signal, deps) => {
  const { sourceBufferActor } = stepWiring(deps);

  sourceBufferActor.send(toMessage(frame));
  await waitForIdle(sourceBufferActor.snapshot, signal);
};

/** Tier 0 default: fetch (for ops that carry bytes) then dispatch. No relocation vocabulary. */
export const DEFAULT_MESSAGE_PIPELINES: MessagePipelines = () => ({
  remove: [dispatchStep],
  'append-init': [fetchStep, dispatchStep],
  'append-segment': [fetchStep, dispatchStep],
});
