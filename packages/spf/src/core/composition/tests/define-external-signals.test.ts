import { describe, expect, it } from 'vite-plus/test';

import { createComposition } from '../create-composition';
import { type StateSignals } from '../define-behavior';
import { defineExternalSignals } from '../define-external-signals';

interface ExternalState {
  userChoice?: string;
  userLimit?: number;
}
interface ExternalContext {
  host?: { id: string };
}

// A reader that consults `userChoice` optionally and declares no keys for it,
// the shape that leaves an external signal undeclared without `defineExternalSignals`.
const reader = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
};

describe('defineExternalSignals', () => {
  it('declares every external state and context key', () => {
    const externalSignals = defineExternalSignals<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });

    expect(externalSignals.stateKeys).toEqual(['userChoice', 'userLimit']);
    expect(externalSignals.contextKeys).toEqual(['host']);
  });

  it('declares no keys when there are no external signals', () => {
    const externalSignals = defineExternalSignals()({});

    expect(externalSignals.stateKeys).toEqual([]);
    expect(externalSignals.contextKeys).toEqual([]);
  });

  it('adds the external signals to the composition, unset and writable', async () => {
    const externalSignals = defineExternalSignals<ExternalState, ExternalContext>()({
      state: ['userChoice', 'userLimit'],
      context: ['host'],
    });
    const composition = createComposition([reader, externalSignals]);

    expect(composition.state.userChoice.get()).toBeUndefined();
    expect(composition.context.host.get()).toBeUndefined();

    composition.state.userChoice.set('en');
    composition.context.host.set({ id: 'host-1' });

    expect(composition.state.userChoice.get()).toBe('en');
    expect(composition.context.host.get()).toEqual({ id: 'host-1' });

    await composition.destroy();
  });
});
