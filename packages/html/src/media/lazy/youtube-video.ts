import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays YouTube sources with `<youtube-video>`.
 *
 * @internal
 */
export const youtubeVideo: LazyMediaDefinition = {
  match: matchAdapterType('youtube'),
  tag: 'youtube-video',
  load: () => import('../../define/media/youtube-video'),
};
