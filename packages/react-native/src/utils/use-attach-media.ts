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
 * The web counterpart is typed against `HTMLMediaElement`; the target type is the only thing that differs here.
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
