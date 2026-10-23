import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays `stream.mux.com` sources with `MuxVideo`.
 *
 * @internal
 */
export const muxVideo: LazyMediaDefinition = {
  match: matchAdapterType('mux'),
  fallback: true,
  load: () => import('../mux-video').then((m) => m.MuxVideo),
};
