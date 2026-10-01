import { describe, expect, it } from 'vite-plus/test';

import { createComposition, type StateSignals } from '../create-composition';
import { makeExternalInputs } from '../make-external-inputs';

interface ExternalState {
  userChoice?: string;
  userLimit?: number;
}
interface ExternalContext {
  host?: { id: string };
}

// A reader that consults `userChoice` optionally and declares no keys for it,
// the shape that leaves an external input undeclared without `makeExternalInputs`.
const reader = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};

describe('makeExternalInputs', () => {
  it('declares every external state and context key', () => {
    const externalInputs = makeExternalInputs<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });

    expect(externalInputs.stateKeys).toEqual(['userChoice', 'userLimit']);
    expect(externalInputs.contextKeys).toEqual(['host']);
  });

  it('declares no keys when there are no external inputs', () => {
    const externalInputs = makeExternalInputs()({});

    expect(externalInputs.stateKeys).toEqual([]);
    expect(externalInputs.contextKeys).toEqual([]);
  });

  it('adds the external inputs to the composition, unset and writable', async () => {
    const externalInputs = makeExternalInputs<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });
    const composition = createComposition([reader, externalInputs]);

    expect(composition.state.userChoice.get()).toBeUndefined();
    expect(composition.context.host.get()).toBeUndefined();

    composition.state.userChoice.set('en');
    composition.context.host.set({ id: 'host-1' });

    expect(composition.state.userChoice.get()).toBe('en');
    expect(composition.context.host.get()).toEqual({ id: 'host-1' });

    await composition.destroy();
  });
});
