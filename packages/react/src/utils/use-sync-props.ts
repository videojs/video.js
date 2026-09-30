'use client';

import { isUndefined } from '@videojs/utils/predicate';
import { useRef } from 'react';

export function useSyncProps<Props extends object, Rest extends Record<string, unknown>>(
  target: Props,
  props: Partial<Props> & Rest,
  defaults: Props
): Omit<Rest, keyof Props> {
  const rest: Record<string, unknown> = {};
  const synced = new Set<string>();
  const prevSyncedRef = useRef<Set<string> | null>(null);

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
    if (key in defaults) {
      if (isUndefined(props[key])) continue;

      synced.add(key);
      sync(key, props[key]);
    } else {
      rest[key] = props[key];
    }
  }

  prevSyncedRef.current = synced;

  return rest as Omit<Rest, keyof Props>;
}
