import { describe, expect, it } from 'vite-plus/test';

import {
  type Behavior,
  type ContextSignals,
  createComposition,
  defineBehavior,
  type StateSignals,
} from '../create-composition';

interface Resource {
  id: string;
}

interface State {
  count?: number;
}

interface Context {
  resource?: Resource;
}

describe('createComposition', () => {
  it('creates empty signal maps for an empty composition', async () => {
    const composition = createComposition([]);

    expect(composition.state).toEqual({});
    expect(composition.context).toEqual({});
    await composition.destroy();
  });

  describe('signal map derivation', () => {
    it('creates one signal per declared state key', () => {
      const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: () => {},
      };
      const composition = createComposition([behavior]);

      expect(typeof composition.state.count.get).toBe('function');
      expect(composition.state.count.get()).toBeUndefined();
    });

    it('creates one signal per declared context key', () => {
      const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: [],
        contextKeys: ['resource'],
        setup: () => {},
      };
      const composition = createComposition([behavior]);

      expect(typeof composition.context.resource.get).toBe('function');
      expect(composition.context.resource.get()).toBeUndefined();
    });

    it('deduplicates keys across behaviors that share them', () => {
      const a: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count', 'count'],
        contextKeys: [],
        setup: ({ state }) => {
          state.count.set(1);
        },
      };
      const b: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: ({ state }) => {
          // Both behaviors see the same signal — b reads what a wrote.
          expect(state.count.get()).toBe(1);
          state.count.set((state.count.get() ?? 0) + 1);
        },
      };
      const composition = createComposition([a, b]);

      expect(Object.keys(composition.state)).toEqual(['count']);
      expect(composition.state.count.get()).toBe(2);
    });

    it('passes the same signal map references to every behavior', () => {
      let stateA: StateSignals<State> | undefined;
      let stateB: StateSignals<State> | undefined;

      const captureA: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: ({ state }) => {
          stateA = state;
        },
      };
      const captureB: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: ({ state }) => {
          stateB = state;
        },
      };

      createComposition([captureA, captureB]);

      expect(stateA).toBeDefined();
      expect(stateA).toBe(stateB);
    });
  });

  describe('destroy()', () => {
    it('clears context signals populated by a behavior during setup', async () => {
      const setBehavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: [],
        contextKeys: ['resource'],
        setup: ({ context }) => {
          context.resource.set({ id: 'r1' });
        },
      };

      const composition = createComposition([setBehavior]);

      expect(composition.context.resource.get()).toEqual({ id: 'r1' });

      await composition.destroy();

      expect(composition.context.resource.get()).toBeUndefined();
    });

    it('runs behavior cleanups with context still populated, then clears', async () => {
      const resource: Resource = { id: 'r1' };
      let resourceSeenByCleanup: Resource | undefined;

      const cleanupBehavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: [],
        contextKeys: ['resource'],
        setup: ({ context }) => {
          return () => {
            resourceSeenByCleanup = context.resource.get();
          };
        },
      };

      const composition = createComposition([cleanupBehavior], {
        initialContext: { resource },
      });

      await composition.destroy();

      expect(resourceSeenByCleanup).toEqual(resource);
      expect(composition.context.resource.get()).toBeUndefined();
    });

    it('awaits async cleanups before clearing', async () => {
      let release!: () => void;
      const barrier = new Promise<void>((resolve) => {
        release = resolve;
      });
      let cleanupCompleted = false;
      const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup:
          ({ state }) =>
          async () => {
            await barrier;
            expect(state.count.get()).toBe(42);
            cleanupCompleted = true;
          },
      };
      const composition = createComposition([behavior], { initialState: { count: 42 } });
      const destroying = composition.destroy();

      try {
        await Promise.resolve();
        expect(cleanupCompleted).toBe(false);
        expect(composition.state.count.get()).toBe(42);
      } finally {
        release();
        await destroying;
      }

      expect(cleanupCompleted).toBe(true);
      expect(composition.state.count.get()).toBeUndefined();
    });

    it('clears across multiple keys from multiple behaviors', async () => {
      interface MultiContext {
        a?: Resource;
        b?: Resource;
      }
      const setA: Behavior<StateSignals<State>, ContextSignals<MultiContext>, object> = {
        stateKeys: [],
        contextKeys: ['a'],
        setup: ({ context }) => {
          context.a.set({ id: 'a1' });
        },
      };
      const setB: Behavior<StateSignals<State>, ContextSignals<MultiContext>, object> = {
        stateKeys: [],
        contextKeys: ['b'],
        setup: ({ context }) => {
          context.b.set({ id: 'b1' });
        },
      };

      const composition = createComposition([setA, setB]);

      expect(composition.context.a.get()).toEqual({ id: 'a1' });
      expect(composition.context.b.get()).toEqual({ id: 'b1' });

      await composition.destroy();

      expect(composition.context.a.get()).toBeUndefined();
      expect(composition.context.b.get()).toBeUndefined();
    });

    it('also clears state signals on destroy', async () => {
      const incrementCount: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: ({ state }) => {
          state.count.set(5);
        },
      };

      const composition = createComposition([incrementCount]);

      expect(composition.state.count.get()).toBe(5);

      await composition.destroy();

      expect(composition.state.count.get()).toBeUndefined();
    });
  });

  describe('initial values', () => {
    it('seeds state signals from initialState', () => {
      const behavior = defineBehavior({
        stateKeys: ['count', 'label'],
        contextKeys: [],
        setup: (_deps: { state: StateSignals<{ count?: number; label?: string }> }) => {},
      });
      const composition = createComposition([behavior], {
        initialState: { count: 42, label: 'hello' },
      });

      expect(composition.state.count.get()).toBe(42);
      expect(composition.state.label.get()).toBe('hello');
    });

    it('seeds context signals from initialContext', () => {
      const resource: Resource = { id: 'seeded' };
      const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: [],
        contextKeys: ['resource'],
        setup: () => {},
      };
      const composition = createComposition([behavior], {
        initialContext: { resource },
      });

      expect(composition.context.resource.get()).toBe(resource);
    });

    it('leaves unseeded keys as undefined', () => {
      interface MultiState {
        a?: number;
        b?: number;
      }
      const behavior: Behavior<StateSignals<MultiState>, ContextSignals<Context>, object> = {
        stateKeys: ['a', 'b'],
        contextKeys: [],
        setup: () => {},
      };
      const composition = createComposition([behavior], {
        initialState: { a: 1 },
      });

      expect(composition.state.a.get()).toBe(1);
      expect(composition.state.b.get()).toBeUndefined();
    });

    it('makes seeded values visible to behaviors during setup', () => {
      let seen: number | undefined;
      const captureBehavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: ['count'],
        contextKeys: [],
        setup: ({ state }) => {
          seen = state.count.get();
        },
      };

      createComposition([captureBehavior], { initialState: { count: 7 } });

      expect(seen).toBe(7);
    });
  });

  describe('config', () => {
    it('passes config to behaviors verbatim', () => {
      let received: { interval: number } | undefined;
      const config = { interval: 250 };

      const captureConfig: Behavior<StateSignals<State>, ContextSignals<Context>, { interval: number }> = {
        stateKeys: [],
        contextKeys: [],
        setup: ({ config }) => {
          received = config;
        },
      };

      createComposition([captureConfig], { config });

      expect(received).toBe(config);
    });

    it('defaults config to empty object when not supplied', () => {
      let received: object | undefined;

      const captureConfig: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
        stateKeys: [],
        contextKeys: [],
        setup: ({ config }) => {
          received = config;
        },
      };

      createComposition([captureConfig]);

      expect(received).toEqual({});
    });
  });
});

describe('defineBehavior', () => {
  it('produces a behavior that composes correctly with createComposition', () => {
    const incrementCount = defineBehavior({
      stateKeys: ['count'],
      contextKeys: ['resource'],
      setup: ({ state, context }: { state: StateSignals<State>; context: ContextSignals<Context> }) => {
        state.count.set(7);
        context.resource.set({ id: 'behavior-resource' });
      },
    });

    const composition = createComposition([incrementCount]);

    expect(composition.state.count.get()).toBe(7);
    expect(composition.context.resource.get()).toEqual({ id: 'behavior-resource' });
  });

  it('produces a behavior whose returned cleanup runs on destroy', async () => {
    let cleanupRan = false;
    const withCleanup = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => () => {
        cleanupRan = true;
      },
    });

    const composition = createComposition([withCleanup]);

    expect(cleanupRan).toBe(false);
    await composition.destroy();
    expect(cleanupRan).toBe(true);
  });
});
