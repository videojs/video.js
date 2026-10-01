import type { Behavior, ExhaustiveKeys, StateSignals } from './create-composition';

/**
 * Behavior factory that declares a composition's **inputs**: state the consumer writes (typically through an adapter)
 * that no composed behavior declares, because the behaviors that consult it only read it, and read it optionally.
 *
 * Composed like any other behavior, so the inputs reach the composition's inferred state type the same way every other
 * key does, and the composition's state map includes them at runtime. The setup does nothing.
 *
 * Curried so `Inputs` is named explicitly while the key list is inferred and checked against it: omitting a key of
 * `Inputs` is a compile error.
 *
 * @example
 *   ```ts
 *   const inputs = declareInputs<UserTrackSelectionInputs<'audio'>>()(['userAudioTrackSelection']);
 *   const behaviors = [resolvePresentation, switchAudioTrack, inputs] as const;
 *   type State = ResolveBehaviorState<typeof behaviors>; // includes `userAudioTrackSelection`
 *   ```;
 */
export function declareInputs<Inputs extends object>() {
  return <const Keys extends readonly (keyof Inputs)[]>(
    keys: Keys & ExhaustiveKeys<Keys, Inputs, 'input'>
  ): Behavior<StateSignals<Inputs>> => ({
    stateKeys: keys,
    contextKeys: [],
    setup: () => {},
  });
}
