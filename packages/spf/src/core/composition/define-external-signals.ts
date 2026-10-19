import type { Behavior, ContextSignals, Empty, ExhaustiveKeys, StateSignals } from './create-composition';

/** The keys of `Values` that are not optional. */
type RequiredKeys<Values extends object> = {
  [K in keyof Values]-?: Empty extends Pick<Values, K> ? never : K;
}[keyof Values];

/**
 * Call-site check that an external-signals type has only named, optional keys. An index signature would open the
 * composition's inferred state or context to any key, and a required key would claim a value before anything has set
 * one: every external signal starts `undefined`. Adds a phantom error tag to the argument when the type fails, the same
 * way `ExhaustiveKeys` reports a missing key.
 */
type ExternalSignalsCheck<Values extends object, Name extends string> = string extends keyof Values
  ? { [K in `Error: ${Name} must name its keys, not use an index signature`]: Name }
  : number extends keyof Values
    ? { [K in `Error: ${Name} must name its keys, not use an index signature`]: Name }
    : Empty extends Values
      ? Empty
      : { [K in `Error: ${Name} keys must all be optional`]: RequiredKeys<Values> };

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
 * a key of `ExternalState` or `ExternalContext` is a compile error. Both shapes must name their keys and make every key
 * optional, and both default to none.
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
      ExhaustiveKeys<ContextKeys, ExternalContext, 'externalContext'> &
      ExternalSignalsCheck<ExternalState, 'externalState'> &
      ExternalSignalsCheck<ExternalContext, 'externalContext'>
  ): Behavior<StateSignals<ExternalState>, ContextSignals<ExternalContext>> => ({
    stateKeys: keys.state ?? [],
    contextKeys: keys.context ?? [],
    // Present only because `Behavior` requires a setup: declaring the keys is this behavior's whole job, and
    // `createComposition` creates their signals without it.
    setup: () => {},
  });
}
