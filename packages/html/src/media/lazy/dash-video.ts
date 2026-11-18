import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays DASH with `<dash-video>`.
 *
 * @internal
 */
export const dashVideo: LazyMediaDefinition = {
  match: matchAdapterType('dash'),
  tag: 'dash-video',
  load: () => import('../../define/media/dash-video'),
};
