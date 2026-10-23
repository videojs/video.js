import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays YouTube sources with `YouTubeVideo`.
 *
 * @internal
 */
export const youtubeVideo: LazyMediaDefinition = {
  match: matchAdapterType('youtube'),
  load: () => import('../youtube-video').then((m) => m.YouTubeVideo),
};
