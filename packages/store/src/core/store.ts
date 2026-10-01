import { isFunction, isNull, isObject, isPromise } from '@videojs/utils/predicate';

import { AbortControllerRegistry } from './abort-controller-registry';
import type { StoreCallbacks } from './config';
import { throwDestroyedError, throwNoTargetError } from './errors';
import type {
  AnySlice,
  AttachContext,
  InferSliceDerivedState,
  InferSliceSourceState,
  InferSliceState,
  SliceConfig,
  StateContext,
} from './slice';
import type { StateChange, State as StateContainer, SubscribeOptions, UnknownState, WritableState } from './state';
import { createState } from './state';

const STORE_SYMBOL = Symbol.for('@videojs/store');
const hasOwnProp = Object.prototype.hasOwnProperty;

/** @internal */
export interface StoreOptions<Target, State> extends StoreCallbacks<Target, State> {}

/** @internal */
export interface StoreFactory<Target> {
  <S extends AnySlice<Target>>(
    slice: S,
    options?: StoreOptions<Target, InferSliceState<S>>
  ): Store<Target, InferSliceState<S>>;
  <State>(slice: SliceConfig<Target, State>, options?: StoreOptions<Target, State>): Store<Target, State>;
}

/** @internal */
export function createStore<Target = unknown>(): StoreFactory<Target> {
  return (<S extends AnySlice<Target>>(
    slice: S,
    options: StoreOptions<Target, InferSliceState<S>> = {}
  ): Store<Target, InferSliceState<S>> => {
    type SourceState = InferSliceSourceState<S>;
    type DerivedState = InferSliceDerivedState<S>;
    type PublicState = InferSliceState<S>;
    type TargetStore = Store<Target, PublicState>;

    // Closure state
    let target: Target | null = null;
    let destroyed = false;

    const setupAbort = new AbortController();
    const signals = new AbortControllerRegistry();

    // Stable wrappers keep unchanged public snapshots from notifying subscribers.
    const actions = new WeakMap<(...args: any[]) => any, (...args: any[]) => any>();
    // An action error is reported where it is thrown; enclosing actions and lifecycle callbacks rethrow it unreported.
    const reportedErrors = new WeakSet<object>();

    let sourceState: Readonly<SourceState>;

    // Reactive public state - initialized after building slice source state.
    let state: WritableState<PublicState>;

    function validate() {
      if (destroyed) throwDestroyedError();

      if (!target) throwNoTargetError();
    }

    const initialSourceState = freezeCopy(
      slice.state({
        target: () => {
          validate();
          return target!;
        },
        signals,
        get: () => sourceState as Readonly<Record<PropertyKey, unknown>>,
        set: (partial) => setSource(partial as Partial<SourceState>),
      } satisfies StateContext<Target>)
    );

    sourceState = initialSourceState;
    const initialDerivedState = derive(sourceState);

    state = createState(publish(sourceState, initialDerivedState));

    const store = {
      [STORE_SYMBOL]: true,
      get $state() {
        return state;
      },
      get target() {
        return target;
      },
      get destroyed() {
        return destroyed;
      },
      get state() {
        return state.current;
      },
      attach,
      destroy,
      subscribe,
    } as unknown as TargetStore;

    for (const key of Object.keys(state.current as object)) {
      Object.defineProperty(store, key, {
        get: () => state.current[key as keyof PublicState],
        enumerable: true,
      });
    }

    // Private symbol-backed source actions remain available to feature-owned
    // configuration adapters without becoming part of the public state snapshot.
    for (const key of Object.getOwnPropertySymbols(sourceState as object)) {
      if (typeof sourceState[key as keyof SourceState] !== 'function') continue;

      Object.defineProperty(store, key, {
        get: () => sourceState[key as keyof SourceState],
      });
    }

    try {
      options.onSetup?.({ store, signal: setupAbort.signal });
    } catch (error) {
      reportError(error);
    }

    return store;

    function derive(source: Readonly<SourceState>): DerivedState {
      const result: Record<string, unknown> = {};
      const definitions = slice.derived as
        | Record<string, (ctx: { get: () => Readonly<SourceState> }) => unknown>
        | undefined;
      if (!definitions) return result as DerivedState;

      const ctx = { get: () => source };

      for (const key of Object.keys(definitions)) {
        result[key] = definitions[key]!(ctx);
      }

      return result as DerivedState;
    }

    function publish(source: Readonly<SourceState>, derived: DerivedState): PublicState {
      const result: Record<string, unknown> = {};

      // Object.keys intentionally excludes symbol-backed internal source state.
      for (const key of Object.keys(source as object)) {
        result[key] = source[key as keyof SourceState];
      }

      Object.assign(result, derived);

      for (const key of Object.keys(result)) {
        const value = result[key];

        if (isFunction(value)) result[key] = wrapAction(value);
      }

      return result as PublicState;
    }

    function wrapAction(action: (...args: any[]) => any) {
      const cached = actions.get(action);
      if (cached) return cached;

      // Callers receive action failures directly; a configured `onError` also observes them, sync or async.
      const wrapped = function (this: unknown, ...args: unknown[]) {
        try {
          const result = action.apply(this, args);

          if (options.onError && isPromise(result)) result.catch(reportError);

          return result;
        } catch (error) {
          if (options.onError) reportError(error);

          throw error;
        }
      };

      actions.set(action, wrapped);
      return wrapped;
    }

    function setSource(partial: Partial<SourceState>): void {
      const patched = patchSource(sourceState, partial);
      if (!patched) return;

      // Derive before committing so a thrown formula leaves every snapshot unchanged.
      const nextDerived = derive(patched.next);

      sourceState = patched.next;
      state.replace(publish(sourceState, nextDerived));
    }

    function attach(newTarget: Target): () => void {
      if (destroyed) throwDestroyedError();

      // Reset signals for new attachment (also cleans up previous if reattaching)
      signals.reset();
      target = newTarget;

      const attachContext: AttachContext<Target, SourceState> = {
        target: newTarget,
        signal: signals.base,
        get: () => sourceState,
        // Attach itself has an error boundary, but event listeners keep this
        // context after attach returns and must report update errors too.
        set: (partial) => {
          try {
            setSource(partial);
          } catch (error) {
            reportError(error);
          }
        },
        reportError,
        store: {
          get state() {
            return state.current as UnknownState;
          },
          subscribe,
        },
      };

      try {
        slice.attach?.(attachContext);
      } catch (error) {
        reportError(error);
      }

      try {
        options.onAttach?.({
          store,
          target: newTarget,
          signal: signals.base,
        });
      } catch (error) {
        reportError(error);
      }

      return detach;
    }

    function detach(): void {
      if (isNull(target)) return;

      signals.reset();
      target = null;

      const resetState = { ...initialSourceState } as SourceState;

      for (const key of slice.preserve ?? []) {
        (resetState as Record<PropertyKey, unknown>)[key] = (sourceState as Record<PropertyKey, unknown>)[key];
      }

      setSource(resetState);
    }

    function destroy(): void {
      if (destroyed) return;

      destroyed = true;
      detach();
      setupAbort.abort();
    }

    function subscribe(callback: StateChange, options?: SubscribeOptions): () => void {
      return state.subscribe(callback, options);
    }

    function reportError(error: unknown): void {
      if (isObject(error)) {
        if (reportedErrors.has(error)) return;

        reportedErrors.add(error);
      }

      if (options.onError) {
        options.onError({ store, error });
      } else {
        console.error('[vjs-store]', error);
      }
    }
  }) as StoreFactory<Target>;
}

function freezeCopy<T>(value: T): Readonly<T> {
  return Object.freeze({ ...value });
}

function patchSource<State>(current: Readonly<State>, partial: Partial<State>): { next: Readonly<State> } | null {
  const next = { ...current } as State;
  let changed = false;

  for (const key of Reflect.ownKeys(partial as object) as (keyof State)[]) {
    if (!hasOwnProp.call(partial, key)) continue;

    const value = partial[key];
    if (Object.is(current[key], value)) continue;

    (next as { -readonly [Key in keyof State]: State[Key] })[key] = value!;
    changed = true;
  }

  return changed ? { next: Object.freeze(next) } : null;
}

/** @internal */
export function isStore(value: unknown): value is AnyStore {
  return isObject(value) && STORE_SYMBOL in value;
}

// ----------------------------------------
// Types
// ----------------------------------------

export interface BaseStore<Target = unknown, State = UnknownState> {
  [key: string]: unknown;
  readonly $state: StateContainer<State>;
  readonly target: Target | null;
  readonly destroyed: boolean;
  readonly state: State;
  attach(target: Target): () => void;
  destroy(): void;
  subscribe(callback: StateChange, options?: SubscribeOptions): () => void;
}

export type Store<Target = unknown, State = UnknownState> = BaseStore<Target, State> & State;

export type AnyStore<Target = any> = BaseStore<Target, object>;

export type UnknownStore<Target = unknown> = Store<Target, UnknownState>;

/** @internal */
export type InferStoreTarget<S extends AnyStore> = S extends { readonly target: (infer Target) | null }
  ? Target
  : never;

/** @displayType {S}['state'] */
export type InferStoreState<S extends AnyStore> = S extends { readonly state: infer State } ? State : never;
