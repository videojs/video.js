import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Vimeo sources with `<vimeo-video>`.
 *
 * @internal
 */
export const vimeoVideo: LazyMediaDefinition = {
  match: matchAdapterType('vimeo'),
  tag: 'vimeo-video',
  load: () => import('../../define/media/vimeo-video'),
};
