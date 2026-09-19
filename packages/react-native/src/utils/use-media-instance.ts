import { useState } from 'react';

import { useDestroy } from './use-destroy';

/**
 * Create and manage a media instance for the lifetime of a component.
 *
 * Instantiated during render rather than in an effect, so handle-backed adapters expose a usable handle on the very
 * first render — no null pass before the surface can bind.
 *
 * Unlike the web counterpart this does not register the instance with a player provider. `usePlayerContext` carries no
 * media slot yet and there is no store to attach to.
 *
 * TODO: register with the player store once the shared features can run on a non-DOM `Media` — see
 * `.claude/plans/react-native/media-contract-feature-reuse.md`.
 *
 * @param MediaClass - Media class to instantiate once.
 * @param setup - Optional callback run once on mount, before first use.
 */
export function useMediaInstance<Instance extends { destroy(): void }>(
  MediaClass: new () => Instance,
  setup?: (media: Instance) => void
): Instance {
  const [instance] = useState(() => new MediaClass());

  useDestroy(instance, () => setup?.(instance));

  return instance;
}
