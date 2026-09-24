import { isNull, isUndefined } from '@videojs/utils/predicate';

import NativeEngineStore, { type Spec } from './NativeEngineStore';

declare const NATIVE_ENGINE_HANDLE: unique symbol;

/**
 * Opaque identifier for one native player.
 *
 * A `number` at runtime — the brand exists only in the type system and is erased on compile. The codegen spec still
 * speaks in terms of `Int32` because the native module is unaware of the brand, but in ts, we want to distinguish a
 * handle from some random `number` that happens to be the same value. The brand is a unique symbol so it cannot be
 * forged outside this package.
 *
 * The brand is one-directional by design: a handle is assignable _to_ `number`, so it passes into the TurboModule and
 * the Fabric view's `playerHandle` prop with no conversion. Going the other way requires a cast, which can be safely
 * done via `toEngineHandle`.
 */
export type NativeEngineHandle = number & { readonly [NATIVE_ENGINE_HANDLE]: true };

/**
 * Brand a number the engine store allocated as a player handle.
 *
 * Deliberately not exported - the only way to get a handle is through the store, which guarantees it is valid.
 *
 * @param value - Handle as the native module reported it.
 */
export function toEngineHandle(value: number): NativeEngineHandle {
  // SAFETY: the brand carries no runtime representation, and the engine store allocates this Int32 as a player handle
  // by construction — `createPlayer` is the only thing that mints one.
  return value as NativeEngineHandle;
}

/**
 * The spec module resolves via `TurboModuleRegistry.get`, which yields `null` rather than throwing when the native side
 * isn't registered. Every caller needs the same explanation, so it lives here instead of at each call site.
 *
 * Deliberately a sibling of `NativeEngineStore.ts` rather than part of it — codegen parses that file for the `Spec`
 * interface, so it stays spec-only.
 */
export function requireEngineStore(): Spec {
  if (isNull(NativeEngineStore) || isUndefined(NativeEngineStore)) {
    throw new Error(
      "@videojs/react-native: the 'VideoJSEngineStore' native module is not registered. Rebuild the native app after adding the package."
    );
  }

  return NativeEngineStore;
}
