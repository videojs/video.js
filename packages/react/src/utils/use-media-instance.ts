'use client';

import type { Media } from '@videojs/media';
import { useEffect, useRef, useState } from 'react';

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
 * @internal
 */
export function useMediaInstance<Instance extends Media & { destroy(): void }>(
  MediaClass: new () => Instance,
  setup?: (media: Instance) => void
): Instance {
  const [instance, setInstance] = useState(() => new MediaClass());
  const destroyedRef = useRef(false);
  const setMedia = useMediaAttach();

  useDestroy(
    instance,
    () => {
      setup?.(instance);
      setMedia?.(instance);
    },
    () => {
      destroyedRef.current = true;
      setMedia?.((prev) => (prev === instance ? null : prev));
    }
  );

  // The instance may have been destroyed during an asynchronous gap between React effect cleanup and re-setup (e.g.,
  // React <Activity> hide → reveal). The useState initializer does not re-run in this case.
  useEffect(() => {
    if (!destroyedRef.current) return;

    const replacement = new MediaClass();

    destroyedRef.current = false;
    setup?.(replacement);
    setMedia?.(replacement);
    setInstance(replacement);
  }, [MediaClass, setup, setMedia]);

  return instance;
}
