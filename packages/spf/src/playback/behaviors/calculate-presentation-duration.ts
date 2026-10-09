import type { Behavior, Empty } from '../../core/composition/define-behavior';
import { effect } from '../../core/signals/effect';
import { type ReadonlySignal, type Signal, untrack, update } from '../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../media/types';

/**
 * Input shape passed to the duration resolver. Represents the union of track-selection slots the default
 * `getResolvedSelectedTrackDuration` resolver inspects to pick a representative resolved track. Variants that compose
 * neither audio nor video selection still satisfy this shape — the missing fields read as `undefined` and the resolver
 * falls through.
 */
export interface PresentationDurationState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}

/**
 * Resolver supplied via `config.resolveDuration`. Returns the duration to write to `presentation.duration`, or
 * `undefined` when it isn't yet derivable. Positive `Infinity` is the canonical live value.
 */
export type PresentationDurationResolver = (state: PresentationDurationState) => number | undefined;

export interface PresentationDurationConfig {
  resolveDuration: PresentationDurationResolver;
}

function calculatePresentationDurationSetup({
  state,
  config,
}: {
  state: {
    presentation: Signal<PresentationDurationState['presentation']>;
    // selectedVideoTrackId / selectedAudioTrackId are read defensively —
    // they are *not* declared in this behavior's stateKeys. The slots are
    // contributed by other behaviors (`switchVideoTrack` writes the
    // video slot in the default engine; `selectAudioTrack` writes the
    // audio slot) which compose conditionally per engine variant. Treating
    // each signal as optional lets calculatePresentationDuration stay
    // variant-agnostic — it feeds whatever's present to the resolver and
    // lets the resolver decide.
    selectedVideoTrackId?: ReadonlySignal<PresentationDurationState['selectedVideoTrackId']>;
    selectedAudioTrackId?: ReadonlySignal<PresentationDurationState['selectedAudioTrackId']>;
  };
  config: PresentationDurationConfig;
}): () => void {
  return effect(() => {
    const presentation = state.presentation.get();
    if (!presentation || presentation.duration !== undefined) return;

    // presentation drives the effect; selection-only changes can't yield a
    // writable duration on their own (resolver returns undefined until a
    // track resolves, at which point resolve-track writes back through
    // state.presentation anyway), so we read the rest untracked.
    const resolverInput: PresentationDurationState = untrack(() => ({
      presentation,
      selectedVideoTrackId: state.selectedVideoTrackId?.get(),
      selectedAudioTrackId: state.selectedAudioTrackId?.get(),
    }));
    const duration = config.resolveDuration(resolverInput);
    if (duration === undefined || Number.isNaN(duration) || duration <= 0) return;

    // Patch-object form requires `T extends object`; `state.presentation`'s
    // T is `MaybeResolvedPresentation | undefined`, which doesn't satisfy
    // the constraint. The guard at the top of the effect already
    // established that the slot holds a defined value, so cast to narrow
    // the signal type and use the cleaner merge form.
    update(state.presentation as Signal<MaybeResolvedPresentation>, { duration });
  });
}

/**
 * **Populate presentation duration via a config-supplied resolver.**
 *
 * Once a presentation is in place and its `duration` is still undefined, calls `config.resolveDuration(state)` whenever
 * a tracked slot changes. The resolver decides what counts as "duration is now derivable" for the variant in play; the
 * behavior itself stays variant-agnostic:
 *
 * - **VoD** — derive from the first resolved selected track's `duration` (video preferred, audio fallback). The HLS
 *   engine wires `getResolvedSelectedTrackDuration` from `media/utils/track-selection.ts` as the default. Audio-only
 *   falls out of the same resolver naturally (no video selected → audio is the first resolved track).
 * - **Live** — return `Number.POSITIVE_INFINITY` once the presentation is established as live. This is the MSE-spec value
 *   for `mediaSource.duration` under live playback; downstream `updateMediaSourceDuration` propagates it through.
 *
 * Validation: writes whatever the resolver returns as long as it's a positive number, including `Infinity`. `undefined`
 * / `NaN` / `<= 0` are skipped.
 *
 * Fires at most once per presentation — an already-set `duration` is never overwritten, and the next reset arrives
 * structurally when a new (unresolved) presentation replaces the current one. The resolver may return `undefined` while
 * duration is still indeterminate; subsequent tracked-slot changes re-run the effect until the resolver commits a
 * value.
 *
 * Downstream of `resolveVideoTrack` / `resolveAudioTrack`; upstream of `updateMediaSourceDuration` (which writes the
 * value through to `mediaSource.duration`).
 *
 * `calculatePresentationDuration` uses a manual `Behavior<>` literal (rather than `defineBehavior`) so it can declare
 * just `presentation` in its stateKeys while the typed setup-param shape includes the optional `selectedVideoTrackId` /
 * `selectedAudioTrackId` reads used at runtime. Mirrors the pattern in `endOfStream` for the same reason: the behavior
 * is uniform-across-tracks and reads slots contributed by other behaviors, so it shouldn't leak those slot declarations
 * into variants that don't compose the contributors.
 */
export const calculatePresentationDuration: Behavior<
  { presentation: Signal<PresentationDurationState['presentation']> },
  Empty,
  PresentationDurationConfig
> = {
  stateKeys: ['presentation'],
  contextKeys: [],
  setup: calculatePresentationDurationSetup,
};
