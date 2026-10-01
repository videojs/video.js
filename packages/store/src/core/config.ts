import type { Store } from './store';

/** @internal */
export interface StoreCallbacks<Target, State> {
  onSetup?: (ctx: StoreSetupContext<Target, State>) => void;
  onAttach?: (ctx: StoreAttachContext<Target, State>) => void;
  onError?: (ctx: StoreErrorContext<Target, State>) => void;
}

/** @internal */
export interface StoreSetupContext<Target, State> {
  store: Store<Target, State>;
  signal: AbortSignal;
}

/** @internal */
export interface StoreAttachContext<Target, State> {
  store: Store<Target, State>;
  target: Target;
  signal: AbortSignal;
}

/** @internal */
export interface StoreErrorContext<Target, State> {
  store: Store<Target, State>;
  error: unknown;
}
