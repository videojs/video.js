import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays TikTok sources with `<tiktok-video>`.
 *
 * @internal
 */
export const tiktokVideo: LazyMediaDefinition = {
  match: matchAdapterType('tiktok'),
  tag: 'tiktok-video',
  load: () => import('../../define/media/tiktok-video'),
};
