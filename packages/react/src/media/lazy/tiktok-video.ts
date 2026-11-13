import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays TikTok sources with `TikTokVideo`.
 *
 * @internal
 */
export const tiktokVideo: LazyMediaDefinition = {
  match: matchAdapterType('tiktok'),
  source: true,
  load: () => import('../tiktok-video').then((m) => m.TikTokVideo),
};
