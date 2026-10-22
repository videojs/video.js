import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Vimeo sources with `VimeoVideo`.
 *
 * @internal
 */
export const vimeoVideo: LazyMediaDefinition = {
  match: matchAdapterType('vimeo'),
  load: () => import('../vimeo-video').then((m) => m.VimeoVideo),
};
