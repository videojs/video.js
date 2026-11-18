'use client';

import type { Media } from '@videojs/media';

import { useMediaAttach } from '../player/context';
import { useInstance } from './use-instance';

/**
 * Create and manage a media instance lifecycle within a player context.
 *
 * Instantiates the media class, attaches it to the player on mount, and safely detaches on unmount using a functional
 * updater to avoid race conditions when swapping media components (e.g. DashVideo → HlsJsVideo). An instance destroyed
 * while hidden in a React `<Activity>` is replaced when it is shown again.
 *
 * An optional `setup` callback runs on mount to configure each instance before it is attached.
 *
 * @param MediaClass - Media class to instantiate and attach to the current player.
 * @param setup - Optional callback run before each instance is attached.
 * @internal
 */
export function useMediaInstance<Instance extends Media & { destroy(): void }>(
  MediaClass: new () => Instance,
  setup?: (media: Instance) => void
): Instance {
  const setMedia = useMediaAttach();

  return useInstance(() => new MediaClass(), {
    setup(instance) {
      setup?.(instance);
      setMedia?.(instance);
    },
    teardown(instance) {
      setMedia?.((prev) => (prev === instance ? null : prev));
    },
  });
}
