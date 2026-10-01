import { describe, expect, it } from 'vite-plus/test';

import { signal } from '../../signals/primitives';
import { type ContextSignals, createComposition, type StateSignals } from '../create-composition';
import { makeShareSignals, makeShareSignalsFor } from '../share-signals';

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

describe('makeShareSignalsFor', () => {
  // Declares `count` and `element`; reads nothing it doesn't declare.
  const counter = {
    stateKeys: ['count'] as const,
    contextKeys: ['element'] as const,
    setup: (_deps: { state: StateSignals<State>; context: ContextSignals<Context> }) => {},
  };
  const behaviors = [counter] as const;

  interface StateInputs {
    userChoice?: string;
  }
  interface ContextInputs {
    host?: { id: string };
  }

  it('declares the input keys, and only those', () => {
    const shareSignals = makeShareSignalsFor<typeof behaviors, StateInputs, ContextInputs>()({
      state: ['userChoice'],
      context: ['host'],
    });

    expect(shareSignals.stateKeys).toEqual(['userChoice']);
    expect(shareSignals.contextKeys).toEqual(['host']);
  });

  it('declares no keys when there are no inputs', () => {
    const shareSignals = makeShareSignalsFor<typeof behaviors>()({});

    expect(shareSignals.stateKeys).toEqual([]);
    expect(shareSignals.contextKeys).toEqual([]);
  });

  it('passes the composition refs, inputs included, to onSignalsReady', async () => {
    const shareSignals = makeShareSignalsFor<typeof behaviors, StateInputs, ContextInputs>()({
      state: ['userChoice'],
      context: ['host'],
    });
    let captured:
      | Parameters<NonNullable<Parameters<typeof shareSignals.setup>[0]['config']['onSignalsReady']>>[0]
      | undefined;

    const composition = createComposition([...behaviors, shareSignals], {
      config: {
        onSignalsReady: (signals) => {
          captured = signals;
        },
      },
    });

    expect(captured?.state.count).toBe(composition.state.count);
    expect(captured?.state.userChoice).toBe(composition.state.userChoice);
    expect(captured?.context.host).toBe(composition.context.host);

    captured?.state.userChoice.set('en');

    expect(composition.state.userChoice.get()).toBe('en');

    await composition.destroy();
  });
});
