import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { ContextSignals, ResolveBehaviorContext, ResolveBehaviorState, StateSignals } from '../create-composition';
import { makeShareSignalsFor } from '../share-signals';

const counter = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};
const behaviors = [counter] as const;

interface StateInputs {
  userChoice?: string;
  userLimit?: number;
}
interface ContextInputs {
  host?: { id: string };
}

describe('makeShareSignalsFor', () => {
  it('contributes only its inputs to the resolved state and context', () => {
    const shareSignals = makeShareSignalsFor<typeof behaviors, StateInputs, ContextInputs>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });

    type All = [...typeof behaviors, typeof shareSignals];

    expectTypeOf<keyof ResolveBehaviorState<All>>().toEqualTypeOf<'count' | 'userChoice' | 'userLimit'>();
    expectTypeOf<keyof ResolveBehaviorContext<All>>().toEqualTypeOf<'host'>();
  });

  it('hands onSignalsReady the behaviors’ state plus the inputs', () => {
    const shareSignals = makeShareSignalsFor<typeof behaviors, StateInputs>()({ state: ['userChoice', 'userLimit'] });

    type Callback = NonNullable<Parameters<typeof shareSignals.setup>[0]['config']['onSignalsReady']>;
    type Signals = Parameters<Callback>[0];

    expectTypeOf<keyof Signals['state']>().toEqualTypeOf<'count' | 'userChoice' | 'userLimit'>();
    expectTypeOf<Signals['context']>().toEqualTypeOf<ContextSignals<ResolveBehaviorContext<typeof behaviors>>>();
  });

  it('rejects a state key list that omits an input', () => {
    // @ts-expect-error — `userLimit` is missing
    makeShareSignalsFor<typeof behaviors, StateInputs>()({ state: ['userChoice'] });
  });

  it('rejects omitting the state key list when there are state inputs', () => {
    // @ts-expect-error — `state` is required to list `userChoice` and `userLimit`
    makeShareSignalsFor<typeof behaviors, StateInputs>()({});
  });

  it('rejects a context key list that omits an input', () => {
    // @ts-expect-error — `host` is missing
    makeShareSignalsFor<typeof behaviors, {}, ContextInputs>()({ context: [] });
  });

  it('rejects a key that is not an input', () => {
    // @ts-expect-error — `userOther` is not a key of `StateInputs`
    makeShareSignalsFor<typeof behaviors, StateInputs>()({ state: ['userChoice', 'userLimit', 'userOther'] });
  });
});
