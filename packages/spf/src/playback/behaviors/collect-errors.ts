import { defineBehavior } from '../../core/composition/define-behavior';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal, update } from '../../core/signals/primitives';
import type { SvtaError } from '../../media/errors';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../media/types';
import type { SelectionRule } from '../primitives/selection-rules';

export interface CollectErrorsState {
  presentation?: MaybeResolvedPresentation;
  /**
   * Conditions reported during playback, in the order encountered — appended by whichever behavior detects one
   * (`emitError`), owned and cleared per source by `collectErrors`. Carries no severity: which of these is fatal is
   * decided above the engine, at the adapter. See `internal/design/spf/features/errors.md`.
   */
  errors?: SvtaError[];
}

/**
 * State an error reporter writes into. The slot is _optional_: a behavior reports through this seam without declaring
 * ownership in its own typed slice, and emission no-ops when `collectErrors` isn't composed. Same contract as
 * `failedCdns` / `failoverFetch`.
 */
export interface ErrorEmitterState {
  errors?: Signal<SvtaError[] | undefined>;
}

/**
 * Append `error` to the engine's error sequence. No-op when no owner is composed. Replaces the array rather than
 * mutating it, so signal consumers notify; duplicates are kept, since a repeated condition is a real observation.
 * Writes go through `update` so concurrent reporters can't lose each other's appends.
 *
 * Every emission is logged, deliberately _before_ the owner check. A condition emitted with no `collectErrors` composed
 * is dropped on the floor — that's the case where a log is the only evidence it happened at all, so gating the log on
 * the same check would hide exactly what's worth seeing. Emissions that _are_ collected still get logged, because
 * reaching `state.errors` is no guarantee of reaching a person: only _verdicts_ are promoted to the media surface, so
 * every cause (and any non-fatal notice) is otherwise invisible outside a debugger.
 *
 * Ungated rather than `__DEV__`-only, matching the other reporting paths in this package (`resolve-presentation`,
 * `track-switching`, the segment actors).
 */
export function emitError(state: ErrorEmitterState, error: SvtaError): void {
  console.error('[spf] reported condition', error);

  if (!state.errors) return;

  update(state.errors, (errors) => [...(errors ?? []), error]);
}

/**
 * A "constraint" that reports a type the source carries **no** renditions of, for a composition that can't play without
 * it.
 *
 * Strange on purpose, and the strangeness is the point: it never constrains anything, always returning its input
 * untouched. It is shaped as a rule so a composition opts in by adding it to `constraints` — nothing to thread through
 * config, and no cost at all to a composition that leaves it out.
 *
 * **Belongs last in the chain.** A constraint sees the list as it stands at its own position, so only at the tail does
 * an empty input mean "nothing playable here" — none of this type offered, or the constraints ahead pruned them all.
 *
 * These are the failures no per-rendition cause can report: causes come from `reportUnsupportedTrackConditions` as each
 * media playlist resolves, and a rendition pruned before selection never resolves. Container and encryption aren't
 * knowable until one does; CODECS is, so an undecodable ladder isn't.
 *
 * Idempotent because the constraint chain runs inside a `computed` that re-derives on every `presentation` write —
 * segment appends and live reloads included — and the sequence deliberately keeps duplicates. `peek` is what keeps that
 * computed from subscribing to the slot this writes.
 *
 * @example
 *   // features/background-video.ts — video-only, so a source with none can't play
 *   constraints: [excludeUnplayableTracks, reportAbsentTrackType(SVTA_NO_SUPPORTED_VIDEO_TRACK)];
 */
export function reportAbsentTrackType<T>(code: number): SelectionRule<T, ErrorEmitterState> {
  return (tracks, { state }) => {
    const reported = state.errors && peek(state.errors);

    if (!tracks.length && !reported?.some((error) => error.code === code)) {
      emitError(state, { code });
    }

    return tracks;
  };
}

/**
 * **Owns the engine's error sequence.** Reporters append through {@link emitError}; this behavior owns the slot and its
 * per-source lifecycle, clearing it on exit so a new source starts clean and the sequence can't grow unbounded across a
 * session.
 *
 * Same split as `setupFailoverMonitor` and `failedCdns`: writes come from wherever the condition is detected, one
 * behavior owns the slot. Deliberately has no `effects` — it holds no policy and derives nothing. Severity is decided
 * at the adapter, not here (see `internal/design/spf/features/errors.md`), which is why this is a lifecycle owner
 * rather than an error _handler_.
 *
 * Clearing binds to _exit_ of `presentation-resolved`, mirroring the sibling mixins' clear-on-teardown (`emptied` /
 * `MEDIA_DETACHED`). A live reload swaps the presentation object without leaving the resolved state, so it doesn't
 * clear — only an actual source change or destroy does. Known gap: a resolved→resolved source swap that never passes
 * through unresolved carries the prior source's errors forward; `resolve-track` guards the same transition with a
 * commit-time id check, and doing likewise here is a follow-up.
 *
 * The vocabulary itself ({@link SvtaError} and the codes) is DOM- and signal-free in `media/errors`; only the write
 * seam lives here, with the slot it writes.
 *
 * @example
 *   const reactor = collectErrors.setup({ state });
 */
export const collectErrors = defineBehavior({
  stateKeys: ['presentation', 'errors'],
  contextKeys: [],
  setup: ({
    state,
  }: {
    state: {
      presentation: ReadonlySignal<CollectErrorsState['presentation']>;
      errors: Signal<CollectErrorsState['errors']>;
    };
  }) => {
    const derivedStateSignal = computed(() =>
      isResolvedPresentation(state.presentation.get())
        ? ('presentation-resolved' as const)
        : ('presentation-unresolved' as const)
    );

    return createMachineReactor({
      initial: 'presentation-unresolved',
      monitor: () => derivedStateSignal.get(),
      states: {
        'presentation-unresolved': {},
        'presentation-resolved': {
          // Cleanup-binds-to-setup: reset for the next source on exit (src
          // unload + destroy).
          entry: () => () => state.errors.set(undefined),
        },
      },
    });
  },
});
