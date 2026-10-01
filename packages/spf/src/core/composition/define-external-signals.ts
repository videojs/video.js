import type { Behavior, ContextSignals, Empty, ExhaustiveKeys, StateSignals } from './create-composition';

/**
 * Behavior factory that defines a composition's **external signals**: state and context keys set and updated from
 * outside the composition (typically by an adapter) that no composed behavior declares, because the behaviors that
 * consult them only read them, and read them optionally.
 *
 * It creates no signals itself. The behavior it returns declares the keys, and `createComposition` creates their
 * signals as it does for every other behavior's keys, so they also reach the composition's inferred state and context
 * types. The setup does nothing.
 *
 * Curried so the two shapes are named explicitly while the key lists are inferred and checked against them: leaving out
 * a key of `ExternalState` or `ExternalContext` is a compile error. Both default to none.
 *
 * @example
 *   ```ts
 *   const externalSignals = defineExternalSignals<UserTrackSelectionState<'audio'>>()({ state: ['userAudioTrackSelection'] });
 *   const behaviors = [resolvePresentation, switchAudioTrack, externalSignals] as const;
 *   type State = ResolveBehaviorState<typeof behaviors>; // includes `userAudioTrackSelection`
 *   ```;
 */
export function defineExternalSignals<ExternalState extends object = Empty, ExternalContext extends object = Empty>() {
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
