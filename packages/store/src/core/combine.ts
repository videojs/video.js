import type { UnionToIntersection } from '@videojs/utils/types';

import type {
  AnySlice,
  AttachContext,
  InferSliceSourceState,
  InferSliceTarget,
  Slice,
  SliceConfig,
  StateContext,
  UnionSliceDerivedState,
  UnionSliceSourceState,
} from './slice';

type CombinedTarget<Slices extends readonly AnySlice[]> = Slices extends readonly []
  ? unknown
  : UnionToIntersection<InferSliceTarget<Slices[number]>>;

/**
 * Combines multiple slices into a single slice.
 *
 * @param slices - The slices to combine.
 * @returns A new slice that represents the combination of the input slices.
 * @internal
 */
export function combine<const Slices extends readonly AnySlice[]>(
  ...slices: Slices
): Slice<CombinedTarget<Slices>, UnionSliceSourceState<Slices>, UnionSliceDerivedState<Slices>> {
  type SourceState = UnionSliceSourceState<Slices>;
  type Target = CombinedTarget<Slices>;
  type Combined = Slice<Target, SourceState, UnionSliceDerivedState<Slices>>;

  const derivedDefinitions = slices.map((slice) => slice.derived ?? {});

  if (__DEV__) {
    warnDuplicates('derived', derivedDefinitions);
  }

  const combined: SliceConfig<Target, SourceState, UnionSliceDerivedState<Slices>> = {
    state: (ctx: StateContext<Target>) => {
      const states = slices.map((slice) => slice.state(ctx));

      if (__DEV__) {
        warnDuplicates('state', states);
        warnOverlaps(states, derivedDefinitions);
      }

      return Object.assign({}, ...states) as SourceState;
    },

    preserve: Array.from(new Set(slices.flatMap((slice) => slice.preserve ?? []))),

    derived: Object.assign({}, ...derivedDefinitions) as any,

    attach: (ctx: AttachContext<Target, SourceState>) => {
      for (const slice of slices) {
        try {
          slice.attach?.(ctx as AttachContext<Target, InferSliceSourceState<typeof slice>>);
        } catch (err) {
          ctx.reportError(err);
        }
      }
    },
  };

  // SAFETY: the brand is type-only, so a config is already a slice at runtime.
  return combined as Combined;
}

function warnDuplicates(namespace: string, objects: readonly object[]): void {
  const seen = new Set<PropertyKey>();

  for (const object of objects) {
    for (const key of Reflect.ownKeys(object)) {
      if (seen.has(key)) {
        console.warn(
          `[vjs-store] combine(): duplicate ${namespace} key "${String(key)}" — later slice overwrites earlier one`
        );
      }

      seen.add(key);
    }
  }
}

function warnOverlaps(states: readonly object[], derivedDefinitions: readonly object[]): void {
  const stateKeys = new Set(states.flatMap((state) => Reflect.ownKeys(state)));

  for (const key of new Set(derivedDefinitions.flatMap((derived) => Reflect.ownKeys(derived)))) {
    if (stateKeys.has(key)) {
      console.warn(
        `[vjs-store] combine(): state and derived key "${String(key)}" overlap — derived state overwrites source state`
      );
    }
  }
}
