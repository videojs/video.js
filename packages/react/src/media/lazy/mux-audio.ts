import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays `stream.mux.com` sources with `MuxAudio`.
 *
 * @internal
 */
export const muxAudio: LazyMediaDefinition = {
  match: matchAdapterType('mux'),
  source: true,
  fallback: true,
  load: () => import('../mux-audio').then((m) => m.MuxAudio),
};
