import { isNull, isUndefined } from '@videojs/utils/predicate';

import NativeEngineStore, { type Spec } from './NativeEngineStore';

declare const NATIVE_ENGINE_HANDLE: unique symbol;

/**
 * Opaque identifier for one native player.
 *
 * A `number` at runtime — the brand exists only in the type system and is erased on compile. It is declared here rather
 * than on the codegen spec because codegen resolves aliases only within the spec file itself and lowers `Int32` to a
 * Kotlin `Double` / ObjC `NSInteger` regardless, so the name could never reach the native side.
 *
 * The brand is one-directional by design: a handle is assignable _to_ `number`, so it passes into the TurboModule and
 * the Fabric view's `playerHandle` prop with no conversion. Only the reverse needs {@link toEngineHandle}, which is why
 * every command site stays cast-free while a stray number still cannot be mistaken for a handle.
 */
export type NativeEngineHandle = number & { readonly [NATIVE_ENGINE_HANDLE]: true };

/**
 * Brand a number the engine store allocated as a player handle.
 *
 * The single conversion point in the package, so the assertion lives here instead of at call sites. Deliberately not
 * re-exported from the package entry: minting a handle is only correct immediately after `createPlayer` returns one,
 * and a public cast would let any number pass as a handle. Consumers that need to adopt an existing player read one off
 * `ReactNativeMedia.handle` instead.
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
