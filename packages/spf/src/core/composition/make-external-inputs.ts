import type { Behavior, ContextSignals, Empty, ExhaustiveKeys, StateSignals } from './create-composition';

/**
 * Behavior factory that declares a composition's **external inputs**: state and context written from outside the
 * composition (typically by an adapter) that no composed behavior declares, because the behaviors that consult them
 * only read them, and read them optionally.
 *
 * Composed like any other behavior, so the external inputs reach the composition's inferred state and context types the
 * same way every other key does, and the composition's signal maps include them at runtime. The setup does nothing.
 *
 * Curried so the input shapes are named explicitly while the key lists are inferred and checked against them: leaving
 * out a key of `ExternalState` or `ExternalContext` is a compile error. Both default to none.
 *
 * @example
 *   ```ts
 *   const externalInputs = makeExternalInputs<UserTrackSelectionState<'audio'>>()({ state: ['userAudioTrackSelection'] });
 *   const behaviors = [resolvePresentation, switchAudioTrack, externalInputs] as const;
 *   type State = ResolveBehaviorState<typeof behaviors>; // includes `userAudioTrackSelection`
 *   ```;
 */
export function makeExternalInputs<ExternalState extends object = Empty, ExternalContext extends object = Empty>() {
  return <
    const StateKeys extends readonly (keyof ExternalState)[] = readonly [],
    const ContextKeys extends readonly (keyof ExternalContext)[] = readonly [],
  >(
    keys: { state?: StateKeys; context?: ContextKeys } & ExhaustiveKeys<StateKeys, ExternalState, 'externalState'> &
      ExhaustiveKeys<ContextKeys, ExternalContext, 'externalContext'>
  ): Behavior<StateSignals<ExternalState>, ContextSignals<ExternalContext>> => ({
    stateKeys: keys.state ?? [],
    contextKeys: keys.context ?? [],
    setup: () => {},
  });
}
