import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { ResolveBehaviorContext, ResolveBehaviorState } from '../create-composition';
import type { StateSignals } from '../define-behavior';
import { defineExternalSignals } from '../define-external-signals';

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

describe('defineExternalSignals', () => {
  it('contributes its external signals to the resolved composition state and context', () => {
    const externalSignals = defineExternalSignals<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });

    type Behaviors = [typeof reader, typeof externalSignals];

    expectTypeOf<ResolveBehaviorState<Behaviors>>().toEqualTypeOf<
      { count: number | undefined } & { userChoice: string | undefined; userLimit: number | undefined }
    >();
    expectTypeOf<ResolveBehaviorContext<Behaviors>>().toEqualTypeOf<{ host: { id: string } | undefined }>();
  });

  it('rejects a state key list that omits an external signal', () => {
    // @ts-expect-error — `userLimit` is missing
    defineExternalSignals<ExternalState>()({ state: ['userChoice'] });
  });

  it('rejects omitting the state key list when there is external state', () => {
    // @ts-expect-error — `state` must list `userChoice` and `userLimit`
    defineExternalSignals<ExternalState>()({});
  });

  it('rejects a context key list that omits an external signal', () => {
    // @ts-expect-error — `host` is missing
    defineExternalSignals<{}, ExternalContext>()({ context: [] });
  });

  it('rejects a key that is not an external signal', () => {
    // @ts-expect-error — `userOther` is not a key of `ExternalState`
    defineExternalSignals<ExternalState>()({ state: ['userChoice', 'userLimit', 'userOther'] });
  });

  it('rejects a shape with an index signature', () => {
    // @ts-expect-error — an index signature would open the composition's state to any key
    defineExternalSignals<Record<string, string>>()({ state: ['userChoice'] });
  });

  it('rejects a shape with a required key', () => {
    // @ts-expect-error — `userChoice` must be optional: it is unset until something outside writes it
    defineExternalSignals<{ userChoice: string }>()({ state: ['userChoice'] });
  });

  it('rejects a context shape with a required key', () => {
    // @ts-expect-error — `host` must be optional
    defineExternalSignals<{}, { host: { id: string } }>()({ context: ['host'] });
  });
});
