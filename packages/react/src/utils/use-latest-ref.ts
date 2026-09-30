'use client';

import { useRef } from 'react';

/**
 * Keep a ref that always points to the latest value.
 *
 * Useful for capturing callbacks or derived values inside closures that are created once (e.g. factory callbacks)
 * without stale reads.
 *
 * @param value - Value the ref should expose after each render.
 */
export function useLatestRef<Value>(value: Value): Readonly<{ current: Value }> {
  const ref = useRef(value);

  ref.current = value;
  return ref;
}

export namespace useLatestRef {
  export type Result<Value> = Readonly<{ current: Value }>;
}
