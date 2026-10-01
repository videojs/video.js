import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { ResolveBehaviorContext, ResolveBehaviorState, StateSignals } from '../create-composition';
import { makeExternalInputs } from '../make-external-inputs';

interface ExternalState {
  userChoice?: string;
  userLimit?: number;
}
interface ExternalContext {
  host?: { id: string };
}

const reader = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};

describe('makeExternalInputs', () => {
  it('contributes its external inputs to the resolved composition state and context', () => {
    const externalInputs = makeExternalInputs<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });

    type Behaviors = [typeof reader, typeof externalInputs];

    expectTypeOf<ResolveBehaviorState<Behaviors>>().toEqualTypeOf<
      { count: number | undefined } & { userChoice: string | undefined; userLimit: number | undefined }
    >();
    expectTypeOf<ResolveBehaviorContext<Behaviors>>().toEqualTypeOf<{ host: { id: string } | undefined }>();
  });

  it('rejects a state key list that omits an external input', () => {
    // @ts-expect-error — `userLimit` is missing
    makeExternalInputs<ExternalState>()({ state: ['userChoice'] });
  });

  it('rejects omitting the state key list when there is external state', () => {
    // @ts-expect-error — `state` must list `userChoice` and `userLimit`
    makeExternalInputs<ExternalState>()({});
  });

  it('rejects a context key list that omits an external input', () => {
    // @ts-expect-error — `host` is missing
    makeExternalInputs<{}, ExternalContext>()({ context: [] });
  });

  it('rejects a key that is not an external input', () => {
    // @ts-expect-error — `userOther` is not a key of `ExternalState`
    makeExternalInputs<ExternalState>()({ state: ['userChoice', 'userLimit', 'userOther'] });
  });
});
