'use client';

import { isUndefined } from '@videojs/utils/predicate';
import { useLayoutEffect, useRef } from 'react';

/**
 * Writes the props a target understands (the keys of `defaults`) onto it and returns the rest.
 *
 * The first render writes immediately so a new target is fully configured before it is attached and starts loading.
 * After that, props are written in a layout effect, when React commits the render that holds them: a concurrent render
 * can pause (or be discarded) between components, and writing during render would let the target change to values React
 * never commits, or change before siblings that apply their own props on commit.
 */
export function useSyncProps<Props extends object, Rest extends Record<string, unknown>>(
  target: Props,
  props: Partial<Props> & Rest,
  defaults: Props
): Omit<Rest, keyof Props> {
  const rest: Record<string, unknown> = {};
  const prevSyncedRef = useRef<Set<string> | null>(null);
  const committedRef = useRef(false);

  for (const key in props) {
    if (!(key in defaults)) rest[key] = props[key];
  }

  const apply = () => {
    const synced = new Set<string>();

    const sync = (key: string, value: unknown) => {
      if (target[key as keyof Props] !== value) target[key as keyof Props] = value as Props[keyof Props];
    };

    // Reset props the consumer stopped passing (or passed as `undefined`) back to
    // their defaults before applying the current ones, so a reset can never wipe a
    // value another prop derives in the same render (e.g. `source` deriving `src`).
    // Mirrors react-dom removing absent attributes.
    for (const key of prevSyncedRef.current ?? []) {
      if (isUndefined((props as Record<string, unknown>)[key])) sync(key, (defaults as Record<string, unknown>)[key]);
    }

    for (const key in props) {
      if (!(key in defaults) || isUndefined(props[key])) continue;

      synced.add(key);
      sync(key, props[key]);
    }

    prevSyncedRef.current = synced;
  };

  // Until the first commit the target is owned by this render alone (a discarded mount discards it too), so configure
  // it now, before the ref callbacks attach it.
  if (!committedRef.current) apply();

  useLayoutEffect(() => {
    if (committedRef.current) apply();

    committedRef.current = true;
  });

  return rest as Omit<Rest, keyof Props>;
}
