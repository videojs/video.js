import { describe, expect, it } from 'vite-plus/test';

import { createComposition, type StateSignals } from '../create-composition';
import { declareInputs } from '../declare-inputs';

interface Inputs {
  userChoice?: string;
  userLimit?: number;
}

// A reader that consults `userChoice` optionally and declares no keys for it,
// the shape that leaves an input undeclared without `declareInputs`.
const reader = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};

describe('declareInputs', () => {
  it('declares every input key as a state key', () => {
    const inputs = declareInputs<Inputs>()(['userChoice', 'userLimit']);

    expect(inputs.stateKeys).toEqual(['userChoice', 'userLimit']);
    expect(inputs.contextKeys).toEqual([]);
  });

  it('adds the inputs to the composition state, unset and writable', async () => {
    const inputs = declareInputs<Inputs>()(['userChoice', 'userLimit']);
    const composition = createComposition([reader, inputs]);

    expect(composition.state.userChoice.get()).toBeUndefined();

    composition.state.userChoice.set('en');

    expect(composition.state.userChoice.get()).toBe('en');

    await composition.destroy();
  });
});
