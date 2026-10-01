import { type ReadonlySignal, type Signal, signal } from '../signals/primitives';

/**
 * Cleanup returned by a behavior. Behaviors may return: - `void` / `undefined` — no cleanup needed - A function —
 * called on destroy (may return a Promise) - An object with `destroy()` — called on destroy (may return a Promise)
 */
export type BehaviorCleanup = void | (() => void | Promise<void>) | { destroy(): void | Promise<void> };

/**
 * A signal map keyed by the fields of `S`. Each field is a writable signal.
 *
 * Optional fields on `S` map to required signal slots whose value type includes `undefined`, ensuring every key has a
 * signal even when the underlying value is absent.
 *
 * Used in two roles:
 *
 * - Engine-side **construction**: `Composition<S, C>` exposes its public surface as `StateSignals<S>` (everything
 *   writable) so external code can read or write any slot.
 * - Behavior **input convenience**: a behavior that writes to every slot can type its setup state param as
 *   `StateSignals<{ ... }>` rather than spelling out per-slot `Signal<T>` types.
 *
 * Behaviors that mix read-only and writable slots type the setup param directly as a slot map (`{ x: Signal<T>; y:
 * ReadonlySignal<U> }`) instead of going through `StateSignals<>`.
 */
export type StateSignals<S extends object> = { [K in keyof S]-?: Signal<S[K]> };

/**
 * A signal map keyed by the fields of `C`. Each field is a writable signal for a platform object or actor reference.
 * Same dual role as `StateSignals<S>` — see its docblock.
 */
export type ContextSignals<C extends object> = { [K in keyof C]-?: Signal<C[K]> };

/**
 * Slot-map shape — a record where each value is at least a `ReadonlySignal`. `Signal<T>` is structurally a subtype of
 * `ReadonlySignal<T>` (it adds `.set()`), so a writable slot satisfies this bound too.
 *
 * This is the bound used for behavior `state` / `context` slot maps. It lets a single behavior declare a
 * _heterogeneous_ slot map where some slots are `Signal<T>` (writable) and others are `ReadonlySignal<T>` (read-only) —
 * making read/write intent explicit at the call site and giving body-level enforcement (TS rejects `.set()` on a
 * read-only slot).
 */
export type AnySlotMap = Record<PropertyKey, ReadonlySignal<unknown>>;

/**
 * The deps object passed to each behavior by the composition.
 *
 * - `state` — slot map for state fields (reactive data). Per-slot read/ write intent expressed via `Signal<T>` vs
 *   `ReadonlySignal<T>`.
 * - `context` — slot map for platform objects and actor references.
 * - `config` — static configuration, passed once at composition creation.
 */
export interface BehaviorDeps<StateMap extends AnySlotMap, ContextMap extends AnySlotMap, Cfg extends object> {
  state: StateMap;
  context: ContextMap;
  config: Cfg;
}

/**
 * A behavior announces the state and context keys it needs alongside a `setup` function that receives deps (state,
 * context, config) and returns an optional cleanup handle.
 *
 * The `stateKeys` / `contextKeys` declarations are the runtime expression of the behavior's contract — the caller (e.g.
 * `createComposition`) uses them to know which signals to provide. The setup parameter type declares the _slot map_
 * (per-slot `Signal<T>` vs `ReadonlySignal<T>`); together they form a complete contract.
 *
 * Manual `Behavior<>` literals (e.g. engine wrappers that forward keys from a wrapped behavior, or pass-through
 * behaviors like `shareSignals`) opt out of exhaustiveness — the type alias is permissive (subset). Source behaviors
 * should use `defineBehavior` to get exhaustiveness enforcement at the call site.
 */
export interface Behavior<
  StateMap extends AnySlotMap = Empty,
  ContextMap extends AnySlotMap = Empty,
  Cfg extends object = Empty,
> {
  /** State keys this behavior reads/writes. Subset of `keyof StateMap`. */
  stateKeys: readonly (keyof StateMap)[];
  /** Context keys this behavior reads/writes. Subset of `keyof ContextMap`. */
  contextKeys: readonly (keyof ContextMap)[];
  setup: (deps: BehaviorDeps<StateMap, ContextMap, Cfg>) => BehaviorCleanup;
}

// =============================================================================
// Behavior type inference
// =============================================================================

/** A behavior with an unconstrained setup — used as a generic bound. */
export type AnyBehavior = {
  stateKeys: readonly PropertyKey[];
  contextKeys: readonly PropertyKey[];
  setup: (deps: any) => BehaviorCleanup;
};

/** Extract the deps type from a behavior's setup function. */
type DepsOf<B> = B extends { setup: (deps: infer D, ...args: any[]) => any } ? D : never;

/**
 * Empty-object fallback used when a behavior omits state, context, or config.
 *
 * Using `{}` rather than `object` is deliberate — `object & {x: T}` collapses to `{x: never}` under TS's
 * union-to-intersection conversion in some inference contexts (likely a TS quirk around the `object` upper bound),
 * whereas `{} & {x: T}` simplifies cleanly to `{x: T}`.
 */
// see comment above
// oxlint-disable-next-line typescript/no-empty-object-type
type Empty = {};

/**
 * Unwrap a signal map back to its state/context shape.
 *
 * Inferring through `{ get(): infer V }` rather than `Signal<infer V>` sidesteps `Signal`'s nominal/invariance
 * behaviour — the conditional matches structurally on the read side, and `V` is inferred covariantly.
 */
type UnwrapSignals<M> = M extends object ? { [K in keyof M]: M[K] extends { get(): infer V } ? V : never } : Empty;

/** Infer the state shape a behavior requires from its deps parameter. */
export type InferBehaviorState<F> = DepsOf<F> extends { state: infer M } ? UnwrapSignals<M> : Empty;

/** Infer the context shape a behavior requires from its deps parameter. */
export type InferBehaviorContext<F> = DepsOf<F> extends { context: infer M } ? UnwrapSignals<M> : Empty;

/** Infer the config shape a behavior requires from its deps parameter. */
export type InferBehaviorConfig<F> = DepsOf<F> extends { config: infer C extends object } ? C : Empty;

/**
 * Recursively intersect a per-behavior projection across the tuple.
 *
 * Iterating over the tuple directly avoids `UnionToIntersection`'s function-contravariance trick, which produces
 * unstable intersections (collapsing concrete fields to `never` or unrelated types) when one of the union members is
 * the empty `{}` fallback.
 */
type IntersectBehaviors<Behaviors extends readonly AnyBehavior[], Project extends object> = Behaviors extends readonly [
  infer First extends AnyBehavior,
  ...infer Rest extends readonly AnyBehavior[],
]
  ? Apply<Project, First> & IntersectBehaviors<Rest, Project>
  : Empty;

/**
 * Apply a projection (one of the marker types below) to a single behavior. Encoded as a discriminated dispatch so the
 * recursion above can stay generic and we don't have to write three near-identical recursive types.
 */
type Apply<Project extends object, F> = Project extends { kind: 'state' }
  ? InferBehaviorState<F>
  : Project extends { kind: 'context' }
    ? InferBehaviorContext<F>
    : Project extends { kind: 'config' }
      ? InferBehaviorConfig<F>
      : never;

type StateProjection = { kind: 'state' };
type ContextProjection = { kind: 'context' };
type ConfigProjection = { kind: 'config' };

/** Resolve the combined state shape from an array of behaviors (intersection of all requirements). */
export type ResolveBehaviorState<Behaviors extends readonly AnyBehavior[]> =
  IntersectBehaviors<Behaviors, StateProjection> extends infer R extends object ? R : Empty;

/** Resolve the combined context shape from an array of behaviors (intersection of all requirements). */
export type ResolveBehaviorContext<Behaviors extends readonly AnyBehavior[]> =
  IntersectBehaviors<Behaviors, ContextProjection> extends infer R extends object ? R : Empty;

/** Resolve the combined config shape from an array of behaviors (intersection of all requirements). */
export type ResolveBehaviorConfig<Behaviors extends readonly AnyBehavior[]> =
  IntersectBehaviors<Behaviors, ConfigProjection> extends infer R extends object ? R : Empty;

/**
 * True if any property in `T` collapsed to `undefined` or `never` — indicating a type conflict from intersecting
 * incompatible behavior requirements.
 *
 * - Required conflicts: `{ v: number } & { v: string }` → `{ v: never }` — caught via `[never] extends [undefined]`
 * - Optional conflicts: `{ v?: number } & { v?: string }` → `{ v?: undefined }` — caught directly
 */
type HasConflict<T extends object> = true extends {
  [K in keyof T]: [T[K]] extends [undefined] ? true : never;
}[keyof T]
  ? true
  : false;

// =============================================================================
// Composition validation
// =============================================================================

/**
 * Validate that a behavior composition has no type conflicts. Returns the behaviors tuple if valid, or an error message
 * type if conflicts are detected.
 *
 * State, context, and config are all checked the same way — by intersecting each behavior's requirement and looking for
 * collapsed fields. The intersection-based check applies the same rule to context as to state, so two behaviors that
 * disagree on a context field's type (e.g. `Surface` vs `VideoSurface`) surface a conflict at compose time. The prior
 * subtype-based approach for owners is gone — the unified rule is simpler and catches the cases where two behaviors
 * silently agreed on a wider supertype.
 */
type ValidateComposition<Behaviors extends readonly AnyBehavior[]> =
  HasConflict<ResolveBehaviorState<Behaviors>> extends true
    ? 'Error: behaviors have conflicting state types'
    : HasConflict<ResolveBehaviorContext<Behaviors>> extends true
      ? 'Error: behaviors have conflicting context types'
      : HasConflict<ResolveBehaviorConfig<Behaviors>> extends true
        ? 'Error: behaviors have conflicting config types'
        : [...Behaviors];

// =============================================================================
// Composition
// =============================================================================

/** A composition of behaviors with shared state and context signal maps. */
export interface Composition<S extends object, C extends object> {
  state: StateSignals<S>;
  context: ContextSignals<C>;
  destroy(): Promise<void>;
}

/**
 * Options for `createComposition`.
 *
 * Composition derives the state and context signal maps from each behavior's declared `stateKeys` / `contextKeys`;
 * `initialState` and `initialContext` seed those signals at creation time. Any unseeded signal starts as `undefined`.
 */
export interface CompositionOptions<S extends object, C extends object, Cfg extends object> {
  /** Static configuration passed to every behavior. */
  config?: Cfg;
  /** Initial values for state signals — any subset of `keyof S`. */
  initialState?: Partial<S>;
  /** Initial values for context signals — any subset of `keyof C`. */
  initialContext?: Partial<C>;
}

/**
 * Create a composition from a set of behaviors.
 *
 * Composition unions the behaviors' declared `stateKeys` / `contextKeys` to know which signals to create. Each signal
 * is seeded from `initialState` / `initialContext` when supplied, defaulting to `undefined`. Behaviors are responsible
 * for writing their own slots once their preconditions are met.
 *
 * Cross-behavior type conflicts (e.g. two behaviors disagreeing on a field's type) surface as a compose-time type error
 * via `ValidateComposition`.
 *
 * @example
 *   ```ts
 *   const composition = createComposition([resolvePresentation, switchVideoTrack], {
 *   config: { parsePresentation: parseMultivariantPlaylist, initialBandwidth: 2_000_000 },
 *   initialState: { bandwidthState: { fastEstimate: 0, ... } },
 *   });
 *   ```;
 */
/**
 * Create a typed signal map for a given set of keys, seeded from an optional partial initial value.
 *
 * Pipeline: `Set` dedupes the iterable (insertion order preserved, so first occurrence wins) → `Object.fromEntries`
 * materializes one `signal()` per unique key, seeded from `initial[key]` or `undefined`.
 *
 * Per-key value types live in TypeScript only — at runtime every signal is `Signal<unknown>`. The boundary cast at the
 * return narrows the wide `Record<PropertyKey, Signal<unknown>>` shape to the caller's expected per-key types from
 * `S`.
 *
 * Used by `createComposition` to derive engine state/context maps from the union of behaviors' declared `stateKeys` /
 * `contextKeys`.
 *
 * @example
 *   ```ts
 *   interface State {
 *     count?: number;
 *     label?: string;
 *   }
 *   const state = buildSignalMap<State>(['count', 'label'], { count: 5 });
 *   state.count.get(); // 5
 *   state.label.get(); // undefined
 *   ```;
 */
function buildSignalMap<S extends object>(
  keys: Iterable<PropertyKey>,
  initial: Partial<S>
): { [K in keyof S]-?: Signal<S[K]> } {
  const init = initial as Record<PropertyKey, unknown>;
  const uniqueKeys = new Set(keys);

  return Object.fromEntries([...uniqueKeys].map((key) => [key, signal(init[key])])) as {
    [K in keyof S]-?: Signal<S[K]>;
  };
}

export function createComposition<const Behaviors extends readonly AnyBehavior[]>(
  behaviors: ValidateComposition<Behaviors>,
  options?: CompositionOptions<
    ResolveBehaviorState<Behaviors>,
    ResolveBehaviorContext<Behaviors>,
    ResolveBehaviorConfig<Behaviors>
  >
): Composition<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>> {
  type S = ResolveBehaviorState<Behaviors>;
  type C = ResolveBehaviorContext<Behaviors>;
  type Cfg = ResolveBehaviorConfig<Behaviors>;

  // ValidateComposition<Behaviors> is `[...Behaviors]` on success, an error
  // string on conflict. The function body only runs when the call typechecks
  // (i.e. the success case), so iterating as the behavior tuple is sound.
  const validBehaviors = behaviors as unknown as readonly AnyBehavior[];

  const state = buildSignalMap<S>(
    validBehaviors.flatMap((b) => b.stateKeys),
    options?.initialState ?? {}
  );
  const context = buildSignalMap<C>(
    validBehaviors.flatMap((b) => b.contextKeys),
    options?.initialContext ?? {}
  );

  const deps: BehaviorDeps<StateSignals<S>, ContextSignals<C>, Cfg> = {
    state,
    context,
    config: (options?.config ?? {}) as Cfg,
  };
  const cleanups = validBehaviors.map((behavior) => behavior.setup(deps));

  return {
    state,
    context,
    async destroy() {
      const results: (void | Promise<void>)[] = [];

      for (const cleanup of cleanups) {
        if (cleanup == null) continue;

        if (typeof cleanup === 'function') {
          results.push(cleanup());
        } else if ('destroy' in cleanup) {
          results.push(cleanup.destroy());
        }
      }

      await Promise.all(results);

      // Reset every signal to undefined as a final cleanup, matching the
      // prior post-destroy `owners.set({})` semantics. A later stage will
      // move per-signal cleanup into the behaviors that own the writes.
      for (const sig of Object.values(state) as Signal<unknown>[]) sig.set(undefined);

      for (const sig of Object.values(context) as Signal<unknown>[]) sig.set(undefined);
    },
  };
}

// =============================================================================
// defineBehavior — typed factory with key/param consistency enforcement
// =============================================================================

/**
 * Compose-time exhaustiveness check.
 *
 * Adds a phantom error tag to the parameter shape when `Keys` does not cover every key in `Slot`. The user's value
 * won't satisfy the phantom field requirement, so TS surfaces the failure at the call site with a descriptive message.
 * When exhaustive, the tag is `Empty` and adds no constraint.
 */
export type ExhaustiveKeys<Keys extends readonly PropertyKey[], Slot extends object, Name extends string> = [
  keyof Slot,
] extends [Keys[number]]
  ? Empty
  : { [K in `Error: ${Name}Keys must list every key in the typed slice`]: Exclude<keyof Slot, Keys[number]> };

/**
 * Typed factory for behaviors that enforces single-behavior key/param consistency: declared `stateKeys` must equal
 * `keyof S` (where `S` is inferred from the setup's `state` parameter type), and same for `contextKeys` / `C`.
 *
 * The `const` modifier on `SK` / `CK` captures literal tuples so e.g. `stateKeys: ['preload']` infers as `readonly
 * ['preload']`, no `as const` needed at the call site.
 *
 * Cross-behavior consistency at `createComposition` is unchanged — the existing `IntersectBehaviors` machinery still
 * runs over each behavior's setup param type.
 *
 * @example
 *   ```ts
 *   export const syncPreload = defineBehavior({
 *   stateKeys: ['preload'],
 *   contextKeys: ['mediaElement'],
 *   setup: ({ state, context }: {
 *   state: StateSignals<{ preload?: 'auto' | 'metadata' | 'none' }>;
 *   context: ContextSignals<{ mediaElement?: HTMLMediaElement | undefined }>;
 *   }) => { ... },
 *   });
 *   ```;
 */
/**
 * Deps shape for a behavior whose deps slot is empty (no keys). When a slot is empty, the corresponding deps field is
 * optional — callers (typically tests) can omit it, and it defaults to `{}` at runtime via `createComposition`.
 *
 * When a slot has at least one key, the behavior reads `state.foo` / `context.bar` / `config.baz` and we need the field
 * to be required so the access is type-safe.
 */
type RequireIfNonEmpty<Key extends string, T extends object> = keyof T extends never
  ? { [K in Key]?: T }
  : { [K in Key]: T };

type DepsForCfg<StateMap extends AnySlotMap, ContextMap extends AnySlotMap, Cfg extends object> = RequireIfNonEmpty<
  'state',
  StateMap
> &
  RequireIfNonEmpty<'context', ContextMap> &
  RequireIfNonEmpty<'config', Cfg>;

export function defineBehavior<
  StateMap extends AnySlotMap = Empty,
  ContextMap extends AnySlotMap = Empty,
  Cfg extends object = Empty,
  const SK extends readonly (keyof StateMap)[] = readonly [],
  const CK extends readonly (keyof ContextMap)[] = readonly [],
  R extends BehaviorCleanup = BehaviorCleanup,
>(
  behavior: {
    stateKeys: SK;
    contextKeys: CK;
    setup: (deps: { state: StateMap; context: ContextMap; config: Cfg }) => R;
  } & ExhaustiveKeys<SK, StateMap, 'state'> &
    ExhaustiveKeys<CK, ContextMap, 'context'>
): {
  stateKeys: SK;
  contextKeys: CK;
  setup: (deps: DepsForCfg<StateMap, ContextMap, Cfg>) => R;
} {
  // The runtime shape is identical; the cast bridges TS's view of the
  // parameter (config required) to the return view (config optional when
  // Cfg has no keys).
  return behavior as unknown as {
    stateKeys: SK;
    contextKeys: CK;
    setup: (deps: DepsForCfg<StateMap, ContextMap, Cfg>) => R;
  };
}
