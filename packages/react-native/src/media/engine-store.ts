import { isNull, isUndefined } from '@videojs/utils/predicate';

import NativeEngineStore, { type Spec } from './NativeEngineStore';

/**
 * The spec module resolves via `TurboModuleRegistry.get`, which yields `null`
 * rather than throwing when the native side isn't registered. Every caller
 * needs the same explanation, so it lives here instead of at each call site.
 *
 * Deliberately a sibling of `NativeEngineStore.ts` rather than part of it —
 * codegen parses that file for the `Spec` interface, so it stays spec-only.
 */
export function requireEngineStore(): Spec {
  if (isNull(NativeEngineStore) || isUndefined(NativeEngineStore)) {
    throw new Error(
      "@videojs/react-native: the 'VideoJSEngineStore' native module is not registered. Rebuild the native app after adding the package."
    );
  }

  return NativeEngineStore;
}
