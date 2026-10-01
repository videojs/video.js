import { describe, expect, it } from 'vite-plus/test';

import { signal } from '../../signals/primitives';
import type { ContextSignals, StateSignals } from '../create-composition';
import { makeShareSignals } from '../share-signals';

interface State {
  count?: number;
  label?: string;
}
interface Context {
  element?: { id: string };
}

function makeDeps() {
  const state: StateSignals<State> = {
    count: signal<number | undefined>(undefined),
    label: signal<string | undefined>(undefined),
  };
  const context: ContextSignals<Context> = {
    element: signal<{ id: string } | undefined>(undefined),
  };

  return { state, context };
}

describe('makeShareSignals', () => {
  it('passes the writable signal refs to the onSignalsReady callback', () => {
    const shareSignals = makeShareSignals<State, Context>();
    const { state, context } = makeDeps();
    let captured: { state: StateSignals<State>; context: ContextSignals<Context> } | undefined;

    shareSignals.setup({
      state,
      context,
      config: {
        onSignalsReady: (signals) => {
          captured = signals;
        },
      },
    });

    expect(captured).toBeDefined();
    expect(captured?.state.count).toBe(state.count);
    expect(captured?.state.label).toBe(state.label);
    expect(captured?.context.element).toBe(context.element);
  });

  it('does not require an onSignalsReady callback', () => {
    const shareSignals = makeShareSignals<State, Context>();
    const { state, context } = makeDeps();

    expect(() => {
      shareSignals.setup({ state, context, config: {} });
    }).not.toThrow();
  });

  it('declares no stateKeys or contextKeys (passthrough behavior)', () => {
    const shareSignals = makeShareSignals<State, Context>();

    expect(shareSignals.stateKeys).toEqual([]);
    expect(shareSignals.contextKeys).toEqual([]);
  });
});
