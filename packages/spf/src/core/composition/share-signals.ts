import type {
  AnyBehavior,
  Behavior,
  ContextSignals,
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
 * The callback receives the state and context those behaviors resolve to. Declares no keys of its own; declare consumer
 * inputs with `declareInputs` and include that behavior in `Behaviors`.
 *
 * @example
 *   ```ts
 *   const behaviors = [resolvePresentation, switchAudioTrack, inputs] as const;
 *   createComposition([...behaviors, makeShareSignalsFor<typeof behaviors>()], { config });
 *   ```;
 */
export function makeShareSignalsFor<Behaviors extends readonly AnyBehavior[]>(): Behavior<
  StateSignals<ResolveBehaviorState<Behaviors>>,
  ContextSignals<ResolveBehaviorContext<Behaviors>>,
  ShareSignalsConfig<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>>
> {
  return makeShareSignals<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>>();
}
