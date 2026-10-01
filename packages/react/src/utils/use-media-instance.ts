'use client';

import type { Media } from '@videojs/media';
import { useState } from 'react';

import { useMediaAttach } from '../player/context';
import { useDestroy } from './use-destroy';

/**
 * Create and manage a media instance lifecycle within a player context.
 *
 * Instantiates the media class once, attaches it to the player on mount, and safely detaches on unmount using a
 * functional updater to avoid race conditions when swapping media components (e.g. DashVideo → HlsJsVideo).
 *
 * An optional `setup` callback runs once on mount to configure the instance before it is attached.
 *
 * @param MediaClass - Media class to instantiate and attach to the current player.
 * @param setup - Optional callback run once before the instance is attached.
 */
export function useMediaInstance<Instance extends Media & { destroy(): void }>(
  MediaClass: new () => Instance,
  setup?: (media: Instance) => void
): Instance {
  const [instance] = useState(() => new MediaClass());
  const setMedia = useMediaAttach();

  useDestroy(
    instance,
    () => {
      setup?.(instance);
      setMedia?.(instance);
    },
    () => setMedia?.((prev) => (prev === instance ? null : prev))
  );

  return instance;
}
