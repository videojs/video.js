import { describe, expectTypeOf, it } from 'vite-plus/test';

import { type Signal, signal } from '../../signals/primitives';
import {
  type Behavior,
  type BehaviorDeps,
  type Composition,
  type ContextSignals,
  createComposition,
  defineBehavior,
  defineCompositionFactory,
  type InferBehaviorConfig,
  type InferBehaviorContext,
  type InferBehaviorState,
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
  type StateSignals,
} from '../create-composition';

// =============================================================================
// Stand-in types
// -----------------------------------------------------------------------------
// Core is DOM-free. The tests need a small, concrete type to stand in for the
// kind of thing a user would pass as a context value — something with a
// writable surface and clear subtype relationships for compatibility tests.
// =============================================================================

interface Surface {
  textContent?: string | null;
}
interface VideoSurface extends Surface {
  kind: 'video';
}
interface CanvasSurface extends Surface {
  kind: 'canvas';
}

// =============================================================================
// Test behaviors — concrete parameter types
// =============================================================================

const counter = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup({ state, config }: { state: StateSignals<{ count?: number }>; config: { interval?: number } }) {
    state.count.set((state.count.get() ?? 0) + 1);
    void config;
  },
};

const render = {
  stateKeys: ['count'] as const,
  contextKeys: ['renderElement'] as const,
  setup({
    state,
    context,
    config,
  }: {
    state: StateSignals<{ count?: number }>;
    context: ContextSignals<{ renderElement?: Surface }>;
    config: { defaultText?: string };
  }) {
    const el = context.renderElement.get();
    if (!el) return;

    el.textContent = String(state.count.get() ?? config.defaultText ?? 'N/A');
  },
};

const persist = {
  stateKeys: ['count'] as const,
  contextKeys: [],
  setup({ state, config }: { state: StateSignals<{ count?: number }>; config: { saveEvery?: number } }) {
    const c = state.count.get();

    if (c && c > 0 && c % (config.saveEvery ?? 5) === 0) {
      // save logic
    }
  },
};

// =============================================================================
// StateSignals / ContextSignals shape
// =============================================================================

describe('StateSignals', () => {
  it('produces one signal per state field', () => {
    type Map = StateSignals<{ count?: number; label?: string }>;
    expectTypeOf<Map['count']>().toEqualTypeOf<Signal<number | undefined>>();
    expectTypeOf<Map['label']>().toEqualTypeOf<Signal<string | undefined>>();
  });

  it('strips optionality on signal slots while preserving undefined in value type', () => {
    type Map = StateSignals<{ count?: number }>;
    expectTypeOf<Map>().toEqualTypeOf<{ count: Signal<number | undefined> }>();
  });

  it('preserves required fields without injecting undefined', () => {
    type Map = StateSignals<{ count: number }>;
    expectTypeOf<Map>().toEqualTypeOf<{ count: Signal<number> }>();
  });
});

describe('ContextSignals', () => {
  it('produces one signal per context field', () => {
    type Map = ContextSignals<{ el?: Surface; flag?: boolean }>;
    expectTypeOf<Map['el']>().toEqualTypeOf<Signal<Surface | undefined>>();
    expectTypeOf<Map['flag']>().toEqualTypeOf<Signal<boolean | undefined>>();
  });
});

describe('Composition<S, C>', () => {
  it('exposes state and context as signal maps plus an async destroy', () => {
    interface State {
      count?: number;
    }
    interface Context {
      el?: Surface;
    }
    type Comp = Composition<State, Context>;
    expectTypeOf<Comp['state']>().toEqualTypeOf<StateSignals<State>>();
    expectTypeOf<Comp['context']>().toEqualTypeOf<ContextSignals<Context>>();
    expectTypeOf<Comp['destroy']>().toEqualTypeOf<() => Promise<void>>();
  });
});

describe('BehaviorDeps<StateMap, ContextMap, Cfg>', () => {
  it('exposes state, context, and config to behaviors', () => {
    interface State {
      count?: number;
    }
    interface Context {
      el?: Surface;
    }
    interface Cfg {
      interval?: number;
    }
    type Deps = BehaviorDeps<StateSignals<State>, ContextSignals<Context>, Cfg>;
    expectTypeOf<Deps['state']>().toEqualTypeOf<StateSignals<State>>();
    expectTypeOf<Deps['context']>().toEqualTypeOf<ContextSignals<Context>>();
    expectTypeOf<Deps['config']>().toEqualTypeOf<Cfg>();
  });
});

// =============================================================================
// InferBehavior* — single behavior inference
// =============================================================================

describe('InferBehaviorState', () => {
  it('extracts state shape from a behavior that uses signal-map deps', () => {
    expectTypeOf<InferBehaviorState<typeof counter>>().toEqualTypeOf<{ count: number | undefined }>();
  });

  it('extracts state shape from a behavior that also uses context', () => {
    expectTypeOf<InferBehaviorState<typeof render>>().toEqualTypeOf<{ count: number | undefined }>();
  });

  it('returns an empty shape for a behavior with no state in params', () => {
    const noState = {
      stateKeys: [],
      contextKeys: [],
      setup: ({ config: _config }: { config: { x: number } }) => {},
    };

    // matches the Empty fallback in create-composition
    // oxlint-disable-next-line typescript/no-empty-object-type
    expectTypeOf<InferBehaviorState<typeof noState>>().toEqualTypeOf<{}>();
  });
});

describe('InferBehaviorContext', () => {
  it('extracts context shape from a behavior that uses context', () => {
    expectTypeOf<InferBehaviorContext<typeof render>>().toEqualTypeOf<{ renderElement: Surface | undefined }>();
  });

  it('returns an empty shape for a behavior with no context in params', () => {
    // matches the Empty fallback in create-composition
    // oxlint-disable-next-line typescript/no-empty-object-type
    expectTypeOf<InferBehaviorContext<typeof counter>>().toEqualTypeOf<{}>();
  });
});

describe('InferBehaviorConfig', () => {
  it('extracts config type from a behavior', () => {
    expectTypeOf<InferBehaviorConfig<typeof counter>>().toEqualTypeOf<{ interval?: number }>();
  });

  it('extracts different config types from different behaviors', () => {
    expectTypeOf<InferBehaviorConfig<typeof render>>().toEqualTypeOf<{ defaultText?: string }>();
    expectTypeOf<InferBehaviorConfig<typeof persist>>().toEqualTypeOf<{ saveEvery?: number }>();
  });

  // A setup's `config?:` once made `defineBehavior` drop the config type, so the
  // behavior contributed nothing to the composition's config.
  it('extracts the config of a defineBehavior whose setup takes an optional config', () => {
    const optionalConfig = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }>; config?: { interval?: number } }) => {},
    });

    expectTypeOf<InferBehaviorConfig<typeof optionalConfig>>().toEqualTypeOf<{ interval?: number }>();
  });

  it('is empty for a behavior that declares no config', () => {
    const noConfig = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    });

    expectTypeOf<keyof InferBehaviorConfig<typeof noConfig>>().toEqualTypeOf<never>();
  });
});

// =============================================================================
// ResolveBehavior* — multi-behavior composition inference
// =============================================================================

describe('ResolveBehaviorState', () => {
  it('intersects state from multiple behaviors with matching shapes', () => {
    type Behaviors = [typeof counter, typeof render, typeof persist];
    expectTypeOf<ResolveBehaviorState<Behaviors>>().toEqualTypeOf<{ count: number | undefined }>();
  });

  it('intersects different state shapes', () => {
    const a = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    };
    const b = {
      stateKeys: ['label'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ label?: string }> }) => {},
    };

    type Behaviors = [typeof a, typeof b];
    expectTypeOf<ResolveBehaviorState<Behaviors>>().toMatchTypeOf<{
      count: number | undefined;
      label: string | undefined;
    }>();
  });
});

describe('ResolveBehaviorContext', () => {
  it('resolves context from mixed behaviors (some without context)', () => {
    type Behaviors = [typeof counter, typeof render];
    expectTypeOf<ResolveBehaviorContext<Behaviors>>().toMatchTypeOf<{ renderElement: Surface | undefined }>();
  });

  it('probe: resolves conflicting context types to undefined-collapsed shape', () => {
    interface Surf {
      kind: 'canvas' | 'video';
    }
    interface CanvasS extends Surf {
      kind: 'canvas';
    }
    interface VideoS extends Surf {
      kind: 'video';
    }
    const a = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_d: { context: ContextSignals<{ el?: CanvasS }> }) => {},
    };
    const b = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_d: { context: ContextSignals<{ el?: VideoS }> }) => {},
    };

    type Resolved = ResolveBehaviorContext<[typeof a, typeof b]>;
    // The intersection should collapse `el` because CanvasS & VideoS = never
    // (sibling types), and `never | undefined` = `undefined` for an optional field.
    expectTypeOf<Resolved['el']>().toEqualTypeOf<undefined>();
  });
});

describe('ResolveBehaviorConfig', () => {
  it('intersects config from multiple behaviors', () => {
    type Behaviors = [typeof counter, typeof render, typeof persist];
    expectTypeOf<ResolveBehaviorConfig<Behaviors>>().toMatchTypeOf<{
      interval?: number;
      defaultText?: string;
      saveEvery?: number;
    }>();
  });
});

// =============================================================================
// createComposition signatures
// =============================================================================

describe('createComposition', () => {
  it('returns a Composition typed by the resolved behaviors', () => {
    interface State {
      count?: number;
    }
    interface Context {
      el?: Surface;
    }
    interface Cfg {
      interval?: number;
    }

    const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, Cfg> = {
      stateKeys: [],
      contextKeys: [],
      setup: () => {},
    };

    const composition = createComposition([behavior], { config: { interval: 250 } });

    expectTypeOf(composition).toEqualTypeOf<Composition<State, Context>>();
    expectTypeOf(composition.state.count).toEqualTypeOf<Signal<number | undefined>>();
    expectTypeOf(composition.context.el).toEqualTypeOf<Signal<Surface | undefined>>();
  });

  it('passes through behavior deps shape', () => {
    interface State {
      count?: number;
    }
    interface Context {
      el?: Surface;
    }
    interface Cfg {
      interval?: number;
    }

    const behavior: Behavior<StateSignals<State>, ContextSignals<Context>, Cfg> = {
      stateKeys: [],
      contextKeys: [],
      setup: ({ state, context, config }) => {
        expectTypeOf(state).toEqualTypeOf<StateSignals<State>>();
        expectTypeOf(context).toEqualTypeOf<ContextSignals<Context>>();
        expectTypeOf(config).toEqualTypeOf<Cfg>();
      },
    };

    createComposition([behavior], { config: { interval: 250 } });
  });
});

// =============================================================================
// defineBehavior — return-type inference
// =============================================================================

describe('defineBehavior', () => {
  it('preserves stateKeys as a literal tuple via const modifier', () => {
    const b = defineBehavior({
      stateKeys: ['a', 'b'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ a?: number; b?: string }> }) => {
        void state;
      },
    });

    expectTypeOf<typeof b.stateKeys>().toEqualTypeOf<readonly ['a', 'b']>();
  });

  it('preserves contextKeys as a literal tuple via const modifier', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: ['el'],
      setup: ({ context }: { context: ContextSignals<{ el?: Surface }> }) => {
        void context;
      },
    });

    expectTypeOf<typeof b.contextKeys>().toEqualTypeOf<readonly ['el']>();
  });

  it('captures the setup return type narrowly via the R generic', () => {
    const cleanup = () => {};
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => cleanup,
    });

    // R is captured narrowly — the result's setup returns `() => void`,
    // not the wider `BehaviorCleanup` union. So callers can invoke the
    // returned cleanup directly without narrowing.
    expectTypeOf<ReturnType<typeof b.setup>>().toEqualTypeOf<() => void>();
  });

  it('flows S into InferBehaviorState<typeof behavior>', () => {
    const b = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    expectTypeOf<InferBehaviorState<typeof b>>().toEqualTypeOf<{ count: number | undefined }>();
  });

  it('flows C into InferBehaviorContext<typeof behavior>', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: ['el'],
      setup: ({ context }: { context: ContextSignals<{ el?: Surface }> }) => {
        void context;
      },
    });

    expectTypeOf<InferBehaviorContext<typeof b>>().toEqualTypeOf<{ el: Surface | undefined }>();
  });

  it('flows Cfg into InferBehaviorConfig<typeof behavior>', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: ({ config }: { config: { interval: number } }) => {
        void config;
      },
    });

    expectTypeOf<InferBehaviorConfig<typeof b>>().toEqualTypeOf<{ interval: number }>();
  });

  it('makes state optional in the result setup signature when S has no keys', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => {},
    });

    // Calling .setup({}) — no state field — typechecks.
    b.setup({});
  });

  it('makes context optional in the result setup signature when C has no keys', () => {
    const b = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    b.setup({ state: { count: signal<number | undefined>(undefined) } });
  });

  it('makes config optional in the result setup signature when Cfg has no keys', () => {
    const b = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    // No config field needed at the call site — Cfg defaults to Empty.
    b.setup({ state: { count: signal<number | undefined>(undefined) } });
  });

  it('keeps state required in the result setup signature when S has at least one key', () => {
    const b = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    // `{}` is not assignable to the deps param when S has keys — state is required.
    // testing that `{}` (empty arg) doesn't satisfy deps
    // oxlint-disable-next-line typescript/no-empty-object-type
    expectTypeOf<{}>().not.toMatchTypeOf<Parameters<typeof b.setup>[0]>();
  });

  it('produces an InferBehaviorState of {} for a behavior with no state in setup', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => {},
    });

    // matches the Empty fallback in create-composition
    // oxlint-disable-next-line typescript/no-empty-object-type
    expectTypeOf<InferBehaviorState<typeof b>>().toEqualTypeOf<{}>();
  });
});

// =============================================================================
// createComposition — per-signal type errors
// =============================================================================

describe('createComposition type errors', () => {
  interface State {
    count?: number;
  }
  interface Context {
    el?: Surface;
  }

  // A typed behavior that pins the inferred composition shape so the error
  // tests below can target the expected shape without explicit type args.
  const noopState: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
    stateKeys: ['count'],
    contextKeys: ['el'],
    setup: () => {},
  };

  it('errors when set() is called on a state signal with the wrong value type', () => {
    const composition = createComposition([noopState]);

    // @ts-expect-error — count is Signal<number | undefined>, not a string slot
    composition.state.count.set('not a number');
  });

  it('errors when get() is treated as the wrong type', () => {
    const composition = createComposition([noopState]);
    // @ts-expect-error — count.get() returns number | undefined, not string
    const _: string = composition.state.count.get();

    void _;
  });

  it('errors when a behavior writes a wrong-type value to a state signal', () => {
    const badBehavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }) => {
        // @ts-expect-error — count is number | undefined
        state.count.set('wrong');
      },
    };

    void badBehavior;
  });

  it('errors when a behavior reads a state signal as the wrong type', () => {
    const badBehavior: Behavior<StateSignals<State>, ContextSignals<Context>, object> = {
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }) => {
        // @ts-expect-error — count.get() returns number | undefined, not string
        const _: string = state.count.get();

        void _;
      },
    };

    void badBehavior;
  });

  // ==========================================================================
  // Composition-time conflict detection
  //
  // `ValidateComposition` resolves the parameter type to one of:
  //   'Error: behaviors have conflicting state types'
  //   'Error: behaviors have conflicting context types'
  //   'Error: behaviors have conflicting config types'
  //
  // when any pair of behaviors disagrees on a field type. The resolved
  // string then becomes the inferred parameter type, so passing the actual
  // behaviors array fails the assignability check.
  //
  // Context conflicts are checked the same way as state — by intersecting
  // each behavior's context requirement and looking for collapsed fields.
  // The prior subtype-based owner check is gone; a behavior pair where the
  // types are subtype-related (e.g. `Surface` and `VideoSurface`) is no
  // longer treated as compatible — both behaviors must agree on the same
  // type.
  // ==========================================================================

  it('errors when composing behaviors with conflicting required state types', () => {
    const expectsNumber = {
      stateKeys: ['value'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ value: number }> }) => {},
    };
    const expectsString = {
      stateKeys: ['value'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ value: string }> }) => {},
    };

    // @ts-expect-error — behaviors have incompatible state: { value: number } vs { value: string }
    createComposition([expectsNumber, expectsString]);
  });

  it('errors when composing behaviors with conflicting optional state types', () => {
    const expectsNumber = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    };
    const expectsString = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: string }> }) => {},
    };

    // @ts-expect-error — behaviors have incompatible state: { count?: number } vs { count?: string }
    createComposition([expectsNumber, expectsString]);
  });

  it('errors when composing behaviors with conflicting context types', () => {
    const expectsCanvas = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_deps: { context: ContextSignals<{ el?: CanvasSurface }> }) => {},
    };
    const expectsVideo = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_deps: { context: ContextSignals<{ el?: VideoSurface }> }) => {},
    };

    // @ts-expect-error — context conflict: CanvasSurface vs VideoSurface
    createComposition([expectsCanvas, expectsVideo]);
  });

  it('allows context types in a subtype relationship to compose', () => {
    // Under the intersection-based rule, subtype-related types compose
    // without conflict — `Surface & VideoSurface = VideoSurface`. The prior
    // subtype-based owner check accepted this too; the difference vs. that
    // approach is sibling-type behavior (see the previous test).
    const expectsSurface = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_deps: { context: ContextSignals<{ el?: Surface }> }) => {},
    };
    const expectsVideo = {
      stateKeys: [],
      contextKeys: ['el'] as const,
      setup: (_deps: { context: ContextSignals<{ el?: VideoSurface }> }) => {},
    };

    // No error — Surface and VideoSurface intersect to VideoSurface.
    createComposition([expectsSurface, expectsVideo]);
  });

  it('errors when composing behaviors with conflicting config types', () => {
    const expectsNumber = {
      stateKeys: [],
      contextKeys: [],
      setup: (_deps: { config: { interval?: number } }) => {},
    };
    const expectsString = {
      stateKeys: [],
      contextKeys: [],
      setup: (_deps: { config: { interval?: string } }) => {},
    };

    // @ts-expect-error — config conflict: { interval?: number } vs { interval?: string }
    createComposition([expectsNumber, expectsString], { config: {} });
  });

  // ==========================================================================
  // Non-conflicts — disjoint or matching shapes compose freely
  // ==========================================================================

  it('allows composing behaviors that omit context', () => {
    const stateOnly = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    };
    const withContext = {
      stateKeys: ['count'] as const,
      contextKeys: ['el'] as const,
      setup: (_deps: { state: StateSignals<{ count?: number }>; context: ContextSignals<{ el?: Surface }> }) => {},
    };

    // No error — omitting context is not a conflict
    createComposition([stateOnly, withContext]);
  });

  it('allows composing behaviors that omit state', () => {
    const configOnly = {
      stateKeys: [],
      contextKeys: [],
      setup: (_deps: { config: { interval?: number } }) => {},
    };
    const withState = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }>; config: { interval?: number } }) => {},
    };

    // No error — omitting state is not a conflict
    createComposition([configOnly, withState], { config: { interval: 250 } });
  });

  it('allows composing behaviors that omit config', () => {
    const stateOnly = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    };
    const withConfig = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }>; config: { interval?: number } }) => {},
    };

    // No error — omitting config is not a conflict
    createComposition([stateOnly, withConfig], { config: { interval: 250 } });
  });

  it('allows composing behaviors where each declares disjoint state keys', () => {
    const a = {
      stateKeys: ['count'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }> }) => {},
    };
    const b = {
      stateKeys: ['label'] as const,
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ label?: string }> }) => {},
    };

    // No error — disjoint keys merge cleanly
    createComposition([a, b]);
  });
});

// =============================================================================
// defineBehavior — single-behavior key/param consistency
//
// Exhaustiveness check: declared `stateKeys` must equal `keyof S` (where S
// is inferred from the setup's state parameter type), and same for
// `contextKeys` / C. Missing keys surface as a phantom-tag failure;
// keys-not-in-S are caught by `const SK extends readonly (keyof S)[]`.
// =============================================================================

describe('defineBehavior type errors', () => {
  it('errors when stateKeys is missing a key declared in the typed state slice', () => {
    // @ts-expect-error — stateKeys missing 'b' (in keyof S = {a, b})
    defineBehavior({
      stateKeys: ['a'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ a?: number; b?: string }> }) => {
        void state.a.get();
        void state.b.get();
      },
    });
  });

  it('errors when stateKeys lists a key not in the typed state slice', () => {
    defineBehavior({
      // @ts-expect-error — 'nope' is not assignable to keyof S = 'a'
      stateKeys: ['a', 'nope'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ a?: number }> }) => {
        void state.a.get();
      },
    });
  });

  it('errors when contextKeys is missing a key declared in the typed context slice', () => {
    // @ts-expect-error — contextKeys missing 'b'
    defineBehavior({
      stateKeys: [],
      contextKeys: ['a'],
      setup: ({ context }: { context: ContextSignals<{ a?: number; b?: string }> }) => {
        void context.a.get();
        void context.b.get();
      },
    });
  });

  it('errors when contextKeys lists a key not in the typed context slice', () => {
    defineBehavior({
      stateKeys: [],
      // @ts-expect-error — 'nope' is not assignable to keyof C = 'a'
      contextKeys: ['nope'],
      setup: ({ context }: { context: ContextSignals<{ a?: number }> }) => {
        void context.a.get();
      },
    });
  });

  it('errors when stateKeys is empty but the typed state slice has keys', () => {
    // @ts-expect-error — keyof S = 'a' is not in stateKeys = []
    defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ a?: number }> }) => {
        void state.a.get();
      },
    });
  });

  it('allows a behavior with no state at all and stateKeys: []', () => {
    // No error — keyof S is `never`, stateKeys: [] is exhaustive
    defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => {},
    });
  });

  it('errors when calling .setup() without a required config (Cfg has keys)', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: ({ config }: { config: { x: number } }) => {
        void config.x;
      },
    });

    // @ts-expect-error — config required because Cfg = { x: number } has keys
    b.setup({});
  });

  it('allows omitting config from .setup() when Cfg has no keys', () => {
    const b = defineBehavior({
      stateKeys: [],
      contextKeys: [],
      setup: () => {},
    });

    // No error — config is optional via DepsForCfg when Cfg = Empty
    b.setup({});
  });

  it('errors when defineBehavior is called with a stateKey whose type conflicts with another behavior', () => {
    const numberBehavior = defineBehavior({
      stateKeys: ['v'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ v: number }> }) => {
        void state.v.get();
      },
    });
    const stringBehavior = defineBehavior({
      stateKeys: ['v'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ v: string }> }) => {
        void state.v.get();
      },
    });

    // @ts-expect-error — cross-behavior conflict still flows through ValidateComposition
    createComposition([numberBehavior, stringBehavior]);
  });
});

// =============================================================================
// initialState / initialContext — type errors
// =============================================================================

describe('createComposition initial-value type errors', () => {
  it('errors when initialState contains a key not in S', () => {
    const behavior = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    createComposition([behavior], {
      // @ts-expect-error — 'unknownKey' is not in S = { count?: number }
      initialState: { unknownKey: 1 },
    });
  });

  it('errors when initialState seeds a key with the wrong type', () => {
    const behavior = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ count?: number }> }) => {
        void state;
      },
    });

    createComposition([behavior], {
      // @ts-expect-error — count must be number | undefined, not string
      initialState: { count: 'wrong' },
    });
  });

  it('errors when initialContext contains a key not in C', () => {
    const behavior = defineBehavior({
      stateKeys: [],
      contextKeys: ['el'],
      setup: ({ context }: { context: ContextSignals<{ el?: Surface }> }) => {
        void context;
      },
    });

    createComposition([behavior], {
      // @ts-expect-error — 'unknownKey' is not in C = { el?: Surface }
      initialContext: { unknownKey: {} },
    });
  });

  it('allows partial initial values (omitted keys default to undefined)', () => {
    const behavior = defineBehavior({
      stateKeys: ['a', 'b'],
      contextKeys: [],
      setup: ({ state }: { state: StateSignals<{ a?: number; b?: string }> }) => {
        void state;
      },
    });

    // No error — Partial<S> allows omitting any subset of keys
    createComposition([behavior], { initialState: { a: 1 } });
  });
});

// =============================================================================
// createComposition — signal-map inference
// =============================================================================

function behavior<S extends object>(stateKeys: readonly (keyof S)[]): Behavior<StateSignals<S>> {
  return { stateKeys, contextKeys: [], setup: () => {} };
}

describe('createComposition', () => {
  it('returns one Signal slot per key in S', () => {
    interface S {
      a?: number;
      b?: string;
    }
    const { state: map } = createComposition([behavior<S>(['a', 'b'])]);

    expectTypeOf<typeof map>().toEqualTypeOf<{ a: Signal<number | undefined>; b: Signal<string | undefined> }>();
  });

  it('strips optionality on signal slots while preserving undefined in value type', () => {
    interface S {
      a?: number;
    }
    const { state: map } = createComposition([behavior<S>(['a'])]);

    // The slot is required (`-?`) but the value type retains | undefined.
    expectTypeOf<typeof map>().toEqualTypeOf<{ a: Signal<number | undefined> }>();
  });

  it('preserves required fields without injecting undefined', () => {
    interface S {
      a: number;
    }
    const { state: map } = createComposition([behavior<S>(['a'])], { initialState: { a: 5 } });

    expectTypeOf<typeof map>().toEqualTypeOf<{ a: Signal<number> }>();
  });

  it('accepts Partial<S> as the initial seed (any subset of keys)', () => {
    interface S {
      a?: number;
      b?: string;
    }
    // No errors — partial seeds welcome.
    createComposition([behavior<S>(['a', 'b'])], { initialState: {} });
    createComposition([behavior<S>(['a', 'b'])], { initialState: { a: 1 } });
    createComposition([behavior<S>(['a', 'b'])], { initialState: { a: 1, b: 'x' } });
  });

  it('errors when initial seeds a key not in S', () => {
    interface S {
      a?: number;
    }
    // @ts-expect-error — 'unknown' is not a key of S
    createComposition([behavior<S>(['a'])], { initialState: { unknown: 1 } });
  });

  it('errors when initial seeds a key with the wrong type', () => {
    interface S {
      a?: number;
    }
    // @ts-expect-error — 'a' must be number | undefined, not string
    createComposition([behavior<S>(['a'])], { initialState: { a: 'wrong' } });
  });

  it('produces an empty map for an empty Partial<{}>', () => {
    const { state: map } = createComposition([]);

    // matches the Empty fallback
    // oxlint-disable-next-line typescript/no-empty-object-type
    expectTypeOf<typeof map>().toEqualTypeOf<{}>();
  });
});

describe('ConfigWithDefaults', () => {
  const needsInterval = {
    stateKeys: [],
    contextKeys: [],
    setup: (_deps: { config: { interval: number; label?: string } }) => {},
  };

  it('makes a required key optional when defaultConfig covers it', () => {
    createComposition([needsInterval], { defaultConfig: { interval: 250 }, config: {} });
    createComposition([needsInterval], { defaultConfig: { interval: 250 }, config: { label: 'a' } });
  });

  it('keeps a required key required when defaultConfig does not cover it', () => {
    // @ts-expect-error — `interval` is required and has no default
    createComposition([needsInterval], { defaultConfig: { label: 'a' }, config: {} });
  });

  it('checks defaults for a behavior whose setup takes an optional config', () => {
    const optionalConfig = defineBehavior({
      stateKeys: ['count'],
      contextKeys: [],
      setup: (_deps: { state: StateSignals<{ count?: number }>; config?: { interval?: number } }) => {},
    });

    createComposition([optionalConfig], { defaultConfig: { interval: 250 } });
    // @ts-expect-error — `interval` is a number
    createComposition([optionalConfig], { defaultConfig: { interval: '250' } });
  });

  // Inferring `config` as a `const` type parameter skips TypeScript's own
  // excess-property check, so the composition restores it.
  it('rejects a misspelled config key, even beside a valid one', () => {
    createComposition([needsInterval], { config: { interval: 1, label: 'a' } });
    // @ts-expect-error — `intervl` is not a config key
    createComposition([needsInterval], { config: { interval: 1, intervl: 2 } });
    // @ts-expect-error — the same, through a factory's create function
    defineCompositionFactory([needsInterval])({ interval: 1, intervl: 2 });
  });

  it('rejects a default of the wrong type', () => {
    // @ts-expect-error — `interval` is a number
    createComposition([needsInterval], { defaultConfig: { interval: '250' }, config: {} });
  });
});
