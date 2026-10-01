import type {
  AnyBehavior,
  Behavior,
  ContextSignals,
  Empty,
  ExhaustiveKeys,
  ResolveBehaviorContext,
  ResolveBehaviorState,
  StateSignals,
} from './create-composition';

/**
 * Config consumed by the `shareSignals` behavior.
 *
 * The callback fires once during composition setup with the composition's state and context signal refs. Capture them
 * to drive the composition externally (writes) or observe its state (reads).
 *
 * The callback runs while other behaviors are still in their setup phase — for the typical "capture refs, use later"
 * pattern this is fine (signal refs are stable identities), but reading inside the callback may yield only initial-seed
 * values rather than what later behaviors write.
 */
export interface ShareSignalsConfig<S extends object, C extends object> {
  onSignalsReady?: (signals: { state: StateSignals<S>; context: ContextSignals<C> }) => void;
}

/**
 * Behavior factory that hands the composition's signal refs to a consumer-supplied callback (`config.onSignalsReady`)
 * at setup time.
 *
 * Generic over `S` and `C` — the caller instantiates with their own state/context types, and the callback's parameter
 * shape is fully type-driven from those. Suitable for both reads and writes (per-slot intent can be expressed by typing
 * captured refs as `Signal<T>` or `ReadonlySignal<T>` at the call site).
 *
 * By default declares no keys; the composition's state/context maps come from other behaviors. Pass `inputStateKeys` /
 * `inputContextKeys` to _materialize_ consumer-input slots that no other behavior produces — a slot the consumer writes
 * (e.g. `userAudioTrackSelection`) but only a rule reads. shareSignals is the consumer boundary, so it's the natural
 * place to bring those slots into existence; readers then treat them as optional.
 *
 * Uses a `Behavior<>` literal (not `defineBehavior`) so its (possibly empty, possibly partial) key arrays don't trip
 * the exhaustiveness check — the setup-param state/context shapes describe what the callback receives (the full `S` /
 * `C`), not the subset this behavior materializes.
 */
export function makeShareSignals<S extends object, C extends object>(
  inputStateKeys: readonly (keyof S)[] = [],
  inputContextKeys: readonly (keyof C)[] = []
): Behavior<StateSignals<S>, ContextSignals<C>, ShareSignalsConfig<S, C>> {
  return {
    stateKeys: inputStateKeys,
    contextKeys: inputContextKeys,
    setup: ({ state, context, config }) => {
      config.onSignalsReady?.({ state, context });
    },
  };
}

/**
 * `makeShareSignals` typed by the behaviors it is composed after, rather than by hand-written state and context types.
 *
 * Also declares the composition's **inputs**: state (and context) the consumer writes, typically through an adapter,
 * that no composed behavior declares, because the behaviors that consult it only read it, and read it optionally. The
 * behavior contributes exactly those keys to the composition, and its callback receives everything the behaviors
 * resolve to plus the inputs.
 *
 * Curried so the input types are named explicitly while the key lists are inferred and checked against them: leaving
 * out a key of `StateInputs` or `ContextInputs` is a compile error. Both default to none.
 *
 * @example
 *   ```ts
 *   const behaviors = [resolvePresentation, switchAudioTrack] as const;
 *   const shareSignals = makeShareSignalsFor<typeof behaviors, UserTrackSelectionInputs<'audio'>>()({
 *     state: ['userAudioTrackSelection'],
 *   });
 *   type State = ResolveBehaviorState<[...typeof behaviors, typeof shareSignals]>; // includes the input
 *   createComposition([...behaviors, shareSignals], { config });
 *   ```;
 */
export function makeShareSignalsFor<
  Behaviors extends readonly AnyBehavior[],
  StateInputs extends object = Empty,
  ContextInputs extends object = Empty,
>() {
  type S = ResolveBehaviorState<Behaviors> & StateInputs;
  type C = ResolveBehaviorContext<Behaviors> & ContextInputs;

  return <
    const SK extends readonly (keyof StateInputs)[] = readonly [],
    const CK extends readonly (keyof ContextInputs)[] = readonly [],
  >(
    inputKeys: { state?: SK; context?: CK } & ExhaustiveKeys<SK, StateInputs, 'stateInput'> &
      ExhaustiveKeys<CK, ContextInputs, 'contextInput'>
  ): Behavior<StateSignals<StateInputs>, ContextSignals<ContextInputs>, ShareSignalsConfig<S, C>> => ({
    stateKeys: inputKeys.state ?? [],
    contextKeys: inputKeys.context ?? [],
    setup: ({ state, context, config }) => {
      // SAFETY: a composition hands every behavior its full state and context maps (see `createComposition`); the
      // narrower types above declare only the inputs this behavior adds.
      config.onSignalsReady?.({
        state: state as StateSignals<S>,
        context: context as ContextSignals<C>,
      });
    },
  });
}
