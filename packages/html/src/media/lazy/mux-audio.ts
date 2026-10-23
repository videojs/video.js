import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays `stream.mux.com` sources with `<mux-audio>`.
 *
 * @internal
 */
export const muxAudio: LazyMediaDefinition = {
  match: matchAdapterType('mux'),
  tag: 'mux-audio',
  load: () => import('../../define/media/mux-audio'),
};
