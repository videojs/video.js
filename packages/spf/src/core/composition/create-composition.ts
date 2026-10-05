import { defaults } from '@videojs/utils/object';

import { type Signal, signal } from '../signals/primitives';
import type {
  AnyBehavior,
  BehaviorDeps,
  ContextSignals,
  Empty,
  InferBehaviorConfig,
  InferBehaviorContext,
  InferBehaviorState,
  StateSignals,
} from './define-behavior';
import type { CheckKeyedFields } from './keyed-by';

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
/**
 * `unknown` when config `C` names only keys of the composition's config `Cfg`; otherwise an error tag listing the
 * others. Restores the excess-property check TypeScript skips when it infers `C` from a literal (as the `const` config
 * parameters here do), so a misspelled key is an error even beside valid ones.
 */
export type CheckConfigKeys<Cfg, C> = [Exclude<keyof C, keyof Cfg>] extends [never]
  ? unknown
  : { 'Error: config names keys no composed behavior reads': Exclude<keyof C, keyof Cfg> };

/** Every check a composition applies to the config of one call: known keys, and {@link KeyedBy} fields. */
type CheckConfig<Cfg, C, Defaults> = CheckConfigKeys<Cfg, C> & CheckKeyedFields<Cfg, C, Defaults>;

/**
 * `Cfg` with every key `Defaults` covers made optional: a default fills it when the caller leaves it out or passes
 * `undefined`. Keys `Defaults` doesn't cover keep the behaviors' own requirements.
 */
export type ConfigWithDefaults<Cfg extends object, Defaults extends object> = Omit<Cfg, keyof Defaults> &
  Partial<Pick<Cfg, Extract<keyof Defaults, keyof Cfg>>>;

export interface CompositionOptions<
  S extends object,
  C extends object,
  Cfg extends object,
  Defaults extends Partial<Cfg> = Empty,
  Config extends ConfigWithDefaults<Cfg, Defaults> = ConfigWithDefaults<Cfg, Defaults>,
> {
  /**
   * Default configuration. Each key fills the same key of `config` when `config` leaves it out or sets it to
   * `undefined`. The merge is shallow: a nested sub-config in `config` replaces the default's whole.
   */
  defaultConfig?: Defaults;
  /**
   * Static configuration passed to every behavior, over `defaultConfig`. Its {@link KeyedBy} fields must be keyed by ids
   * their source lists, from `config` or else `defaultConfig`.
   */
  config?: Config & CheckConfig<Cfg, Config, Defaults>;
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

/**
 * `config` over `defaultConfig`: every key of `config`, plus each default whose key `config` leaves out or sets to
 * `undefined`. Without defaults, `config` passes through as the same object.
 */
function mergeDefaultConfig<Config extends object, Defaults extends object>(
  config: Config,
  defaultConfig: Defaults | undefined
): Config | (Config & Defaults) {
  if (!defaultConfig) return config;

  // `defaults` resolves each defaulted key to `config`'s value when defined, else the default, so spreading it last
  // can't override an explicit value; spreading `config` first keeps the keys `defaults` drops (those with no default).
  // SAFETY: `defaults` reads only `defaultConfig`'s keys off `config`; a key `config` lacks reads as `undefined`.
  return { ...config, ...defaults(config as Partial<Defaults>, defaultConfig) };
}

export function createComposition<
  const Behaviors extends readonly AnyBehavior[],
  Defaults extends Partial<ResolveBehaviorConfig<Behaviors>> = Empty,
  // `const` so a keyed field's check sees this call's literal keys and source list.
  const Config extends ConfigWithDefaults<ResolveBehaviorConfig<Behaviors>, Defaults> = ConfigWithDefaults<
    ResolveBehaviorConfig<Behaviors>,
    Defaults
  >,
>(
  behaviors: ValidateComposition<Behaviors>,
  options?: CompositionOptions<
    ResolveBehaviorState<Behaviors>,
    ResolveBehaviorContext<Behaviors>,
    ResolveBehaviorConfig<Behaviors>,
    Defaults,
    Config
  >
): Composition<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>> {
  return compose<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>, ResolveBehaviorConfig<Behaviors>>(
    validBehaviorList(behaviors),
    options
  );
}

/**
 * A create function for one fixed list of behaviors with its defaults: what an engine module exports as its
 * `createEngine`. The returned function checks each call's config the way {@link createComposition} does, at its own
 * call site, so a module needs no type plumbing of its own.
 *
 * @example
 *   ```ts
 *   export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
 *   ```;
 */
export function defineCompositionFactory<
  const Behaviors extends readonly AnyBehavior[],
  Defaults extends Partial<ResolveBehaviorConfig<Behaviors>> = Empty,
>(
  behaviors: ValidateComposition<Behaviors>,
  options: Omit<
    CompositionOptions<
      ResolveBehaviorState<Behaviors>,
      ResolveBehaviorContext<Behaviors>,
      ResolveBehaviorConfig<Behaviors>,
      Defaults
    >,
    'config'
  > = {}
) {
  const validBehaviors = validBehaviorList(behaviors);

  return <
    const Config extends ConfigWithDefaults<ResolveBehaviorConfig<Behaviors>, Defaults> = ConfigWithDefaults<
      ResolveBehaviorConfig<Behaviors>,
      Defaults
    >,
  >(
    config?: Config & CheckConfig<ResolveBehaviorConfig<Behaviors>, Config, Defaults>
  ): Composition<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>> =>
    compose<ResolveBehaviorState<Behaviors>, ResolveBehaviorContext<Behaviors>, ResolveBehaviorConfig<Behaviors>>(
      validBehaviors,
      { ...options, config }
    );
}

/**
 * `ValidateComposition<Behaviors>` is `[...Behaviors]` on success and an error string on conflict. A caller only runs
 * when its call typechecks (the success case), so treating the value as the behavior list is sound.
 */
function validBehaviorList<Behaviors extends readonly AnyBehavior[]>(
  behaviors: ValidateComposition<Behaviors>
): readonly AnyBehavior[] {
  // SAFETY: see above; on success `ValidateComposition<Behaviors>` is the behavior tuple itself.
  return behaviors as unknown as readonly AnyBehavior[];
}

/** The runtime half of {@link createComposition} and {@link defineCompositionFactory}, typed by its caller. */
function compose<S extends object, C extends object, Cfg extends object>(
  behaviors: readonly AnyBehavior[],
  options:
    | {
        // Typed by the caller: the merge of these two is `Cfg` (see the cast below).
        defaultConfig?: object | undefined;
        config?: object | undefined;
        initialState?: Partial<S>;
        initialContext?: Partial<C>;
      }
    | undefined
): Composition<S, C> {
  const state = buildSignalMap<S>(
    behaviors.flatMap((b) => b.stateKeys),
    options?.initialState ?? {}
  );
  const context = buildSignalMap<C>(
    behaviors.flatMap((b) => b.contextKeys),
    options?.initialContext ?? {}
  );

  const deps: BehaviorDeps<StateSignals<S>, ContextSignals<C>, Cfg> = {
    state,
    context,
    // SAFETY: `ConfigWithDefaults` types `config` as `Cfg` minus the keys `defaultConfig` fills, so the merge is `Cfg`.
    config: mergeDefaultConfig(options?.config ?? {}, options?.defaultConfig) as Cfg,
  };
  const cleanups = behaviors.map((behavior) => behavior.setup(deps));

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
