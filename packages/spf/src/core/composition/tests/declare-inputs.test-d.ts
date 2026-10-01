import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { ResolveBehaviorState, StateSignals } from '../create-composition';
import { declareInputs } from '../declare-inputs';

interface Inputs {
  userChoice?: string;
  userLimit?: number;
}

const reader = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};

describe('declareInputs', () => {
  it('contributes its inputs to the resolved composition state', () => {
    const inputs = declareInputs<Inputs>()(['userChoice', 'userLimit']);

    expectTypeOf<ResolveBehaviorState<[typeof reader, typeof inputs]>>().toEqualTypeOf<
      { count: number | undefined } & { userChoice: string | undefined; userLimit: number | undefined }
    >();
  });

  it('rejects a key list that omits an input', () => {
    // @ts-expect-error — `userLimit` is missing
    declareInputs<Inputs>()(['userChoice']);
  });

  it('rejects a key that is not an input', () => {
    // @ts-expect-error — `userOther` is not a key of `Inputs`
    declareInputs<Inputs>()(['userChoice', 'userLimit', 'userOther']);
  });
});
