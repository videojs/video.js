import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays `stream.mux.com` sources with `<mux-video>`.
 *
 * @internal
 */
export const muxVideo: LazyMediaDefinition = {
  match: matchAdapterType('mux'),
  tag: 'mux-video',
  load: () => import('../../define/media/mux-video'),
  preferPlayback: true,
};
