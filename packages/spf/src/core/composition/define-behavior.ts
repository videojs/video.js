import type { ReadonlySignal, Signal } from '../signals/primitives';

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
 * Manual `Behavior<>` literals (e.g. engine wrappers that forward keys from a wrapped behavior, or
 * `defineExternalSignals`, which checks its key list itself) opt out of exhaustiveness — the type alias is permissive
 * (subset). Source behaviors should use `defineBehavior` to get exhaustiveness enforcement at the call site.
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
export type Empty = {};

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

/**
 * The config a deps parameter declares, without the `undefined` an optional `config?:` adds. `Empty` when it declares
 * none.
 */
type DeclaredConfig<CfgIn> = [Extract<CfgIn, object>] extends [never] ? Empty : Extract<CfgIn, object>;

/** Infer the config shape a behavior requires from its deps parameter, whether it declares `config` or `config?`. */
export type InferBehaviorConfig<F> = DepsOf<F> extends { config?: infer C } ? DeclaredConfig<C> : Empty;

// =============================================================================
// Behavior list resolution
// =============================================================================

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
 * Deps shape for a behavior whose deps slot is empty (no keys). When a slot is empty, the corresponding deps field is
 * optional — callers (typically tests) can omit it, and it defaults to `{}` at runtime via `createComposition`.
 *
 * When a slot has at least one key, the behavior reads `state.foo` / `context.bar` / `config.baz` and we need the field
 * to be required so the access is type-safe.
 */
type RequireIfNonEmpty<Key extends string, T extends object> = keyof T extends never
  ? { [K in Key]?: T }
  : { [K in Key]: T };

/**
 * The `config` deps field: optional when the setup declares `config?:` (callers may omit it) or the config has no keys,
 * required otherwise.
 */
type ConfigDeps<CfgIn> = undefined extends CfgIn
  ? { config?: DeclaredConfig<CfgIn> }
  : RequireIfNonEmpty<'config', DeclaredConfig<CfgIn>>;

type DepsForCfg<StateMap extends AnySlotMap, ContextMap extends AnySlotMap, CfgIn> = RequireIfNonEmpty<
  'state',
  StateMap
> &
  RequireIfNonEmpty<'context', ContextMap> &
  ConfigDeps<CfgIn>;

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
export function defineBehavior<
  StateMap extends AnySlotMap = Empty,
  ContextMap extends AnySlotMap = Empty,
  // Unconstrained so a setup's `config?: X` infers as `X | undefined` instead of failing an `object` bound and falling
  // back to it, which silently dropped `X` from the composition's config type.
  CfgIn = Empty,
  const SK extends readonly (keyof StateMap)[] = readonly [],
  const CK extends readonly (keyof ContextMap)[] = readonly [],
  R extends BehaviorCleanup = BehaviorCleanup,
>(
  behavior: {
    stateKeys: SK;
    contextKeys: CK;
    setup: (deps: { state: StateMap; context: ContextMap; config: CfgIn }) => R;
  } & ExhaustiveKeys<SK, StateMap, 'state'> &
    ExhaustiveKeys<CK, ContextMap, 'context'>
): {
  stateKeys: SK;
  contextKeys: CK;
  setup: (deps: DepsForCfg<StateMap, ContextMap, CfgIn>) => R;
} {
  // The runtime shape is identical; the cast bridges TS's view of the
  // parameter (config required) to the return view (config optional when
  // Cfg has no keys).
  return behavior as unknown as {
    stateKeys: SK;
    contextKeys: CK;
    setup: (deps: DepsForCfg<StateMap, ContextMap, CfgIn>) => R;
  };
}
