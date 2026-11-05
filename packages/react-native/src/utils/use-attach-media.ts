import { isNull } from '@videojs/utils/predicate';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

import type { PlayerSurface } from '../media/player-surface-host';

interface SurfaceHost {
  attach?(surface: PlayerSurface): void;
  detach?(): void;
}

/**
 * Bind the rendered surface to a media instance as it mounts and unmounts.
 *
 * The web counterpart reconciles attach/detach in layout effects. This one is a plain callback ref: React 19 runs the
 * returned cleanup on unmount, and React 18 ignores it and calls the ref with `null` instead, which takes the same
 * `detach` branch.
 */
export function useAttachMedia<T extends PlayerSurface>(media: SurfaceHost): RefCallback<T> {
  return useCallback(
    (surface: T | null) => {
      if (isNull(surface)) media.detach?.();
      else media.attach?.(surface);

      return () => media.detach?.();
    },
    [media]
  );
}
