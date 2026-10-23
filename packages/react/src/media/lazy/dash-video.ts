import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays DASH with `DashVideo`.
 *
 * @internal
 */
export const dashVideo: LazyMediaDefinition = {
  match: matchAdapterType('dash'),
  fallback: true,
  load: () => import('../dash-video').then((m) => m.DashVideo),
};
