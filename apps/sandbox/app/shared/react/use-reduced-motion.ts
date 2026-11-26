import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (!('matchMedia' in globalThis)) return () => undefined;

  const query = matchMedia(QUERY);

  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

function read(): boolean {
  return 'matchMedia' in globalThis && matchMedia(QUERY).matches;
}

/** Whether the viewer asked for reduced motion, kept live. A viewer fact, so it lives beside the page, not in a store. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
