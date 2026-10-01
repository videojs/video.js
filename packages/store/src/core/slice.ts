import type { Simplify, UnionToIntersection } from '@videojs/utils/types';

import type { AbortControllerRegistry } from './abort-controller-registry';
import type { UnknownState } from './state';

// ----------------------------------------
// Attach
// ----------------------------------------

/** @internal */
export type Attach<Target, State> = (ctx: AttachContext<Target, State>) => void;

/** @internal */
export interface AttachStore {
  readonly state: UnknownState;
  subscribe: (callback: () => void) => () => void;
}

/** @internal */
export interface AttachContext<Target, State> {
  target: Target;
  signal: AbortSignal;
  store: AttachStore;
  get: () => Readonly<State>;
  set: (partial: Partial<State>) => void;
  reportError: (error: unknown) => void;
}

// ----------------------------------------
// State Context
// ----------------------------------------

/** @internal */
export interface StateContext<Target> {
  /** Returns the current target. Throws if not attached. */
  target: () => Target;
  /**
   * Cancellation signals for async operations.
   *
   * - `signals.base` — Aborts on detach or reattach. Use for cleanup.
   * - `signals.supersede(key)` — Returns a signal that aborts when the same key is superseded or when base aborts. Use
   *   for operations that should cancel previous in-flight work (e.g., seek superseding seek).
   * - `signals.clear()` — Aborts all keyed signals. Use when starting fresh (e.g., loading a new source cancels pending
   *   seeks).
   */
  signals: AbortControllerRegistry;
  /** Read slice state before derived values. Safe inside action closures, not during `state()` init. */
  get: () => Readonly<Record<PropertyKey, unknown>>;
  /** Patch slice state before derived values. Safe inside action closures, not during `state()` init. */
  set: (partial: Record<PropertyKey, unknown>) => void;
}

// ----------------------------------------
// Derived Context
// ----------------------------------------

/**
 * Read-only inputs available while an eager derived formula is evaluated.
 *
 * @internal
 */
export interface DerivedContext<State> {
  /** Returns the immutable slice state before derived values. */
  get: () => Readonly<State>;
}

/**
 * Formula map used to produce public derived state.
 *
 * @internal
 */
export type DerivedDefinition<State, Derived> = {
  [Key in keyof Derived]: (ctx: DerivedContext<State>) => Derived[Key];
};

// ----------------------------------------
// Slice
// ----------------------------------------

declare const SLICE_BRAND: unique symbol;

/**
 * A slice of store state: the source state, derived values, and attach behavior a store builds from it. Player features
 * are slices.
 *
 * Opaque outside the store: pass a slice to `createSelector`, not its members. Every member is internal, so how a slice
 * is written can change without breaking code that only selects from one.
 */
export interface Slice<Target, State, Derived = object> {
  /** @internal Type-only brand. Slices come from `defineSlice`, never from a literal. */
  readonly [SLICE_BRAND]: true;
  /**
   * Debug label. Used as `displayName` on selectors created from this slice.
   *
   * @internal
   */
  name?: string;
  /** @internal */
  state: (ctx: StateContext<Target>) => State;
  /**
   * Source-state keys whose current values survive detach.
   *
   * @internal
   */
  preserve?: readonly PropertyKey[];
  /**
   * Formulas evaluated from slice state before publication.
   *
   * @internal
   */
  derived?: DerivedDefinition<State, Derived>;
  /** @internal */
  attach?: (ctx: AttachContext<Target, State>) => void;
}

/**
 * What `defineSlice` turns into a {@link Slice}.
 *
 * @internal
 */
export type SliceConfig<Target, State, Derived = object> = Omit<Slice<Target, State, Derived>, typeof SLICE_BRAND>;

export type AnySlice<Target = any> = Slice<Target, any, object>;

// ----------------------------------------
// Factory
// ----------------------------------------

type DerivedFunctions<State> = Record<string, (ctx: DerivedContext<State>) => unknown>;

type DerivedValues<Definitions extends Record<string, (...args: any[]) => unknown>> = {
  [Key in keyof Definitions]: ReturnType<Definitions[Key]>;
};

/** @internal */
export interface SliceFactory<Target> {
  <State, const Definitions extends DerivedFunctions<State>>(
    config: Omit<SliceConfig<Target, State, DerivedValues<Definitions>>, 'derived'> & {
      derived: Definitions;
    }
  ): Slice<Target, State, DerivedValues<Definitions>>;
  <State>(config: Omit<SliceConfig<Target, State>, 'derived'> & { derived?: never }): Slice<Target, State>;
}

/** @internal */
export function defineSlice<Target>(): SliceFactory<Target> {
  // SAFETY: the brand is type-only, so a config is already a slice at runtime.
  return ((config: SliceConfig<Target, unknown, unknown>) =>
    config as Slice<Target, unknown, unknown>) as SliceFactory<Target>;
}

// ----------------------------------------
// Inference
// ----------------------------------------

/** @internal */
export type InferSliceTarget<S> = S extends Slice<infer Target, any, any> ? Target : never;

/** Infer from the state factory so intersections with feature metadata preserve exact source state. */
export type InferSliceSourceState<S> = S extends { state: (...args: any[]) => infer State } ? State : never;

/** @internal */
export type InferSliceDerivedState<S> = S extends Slice<any, any, infer Derived> ? Derived : never;

export type PublicSourceState<State> = Pick<State, Extract<keyof State, string>>;

export type InferSliceState<S> =
  S extends Slice<any, infer State, infer Derived> ? Simplify<PublicSourceState<State> & Derived> : never;

type IntersectSlices<Slices extends readonly AnySlice[], Value> = Slices extends readonly []
  ? object
  : Simplify<UnionToIntersection<Value>>;

/** @internal */
export type UnionSliceSourceState<Slices extends readonly AnySlice[]> = IntersectSlices<
  Slices,
  InferSliceSourceState<Slices[number]>
>;

/** @internal */
export type UnionSliceDerivedState<Slices extends readonly AnySlice[]> = IntersectSlices<
  Slices,
  InferSliceDerivedState<Slices[number]>
>;

export type UnionSliceState<Slices extends readonly AnySlice[]> = IntersectSlices<
  Slices,
  InferSliceState<Slices[number]>
>;
