import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through an engine with `<hls-audio>`.
 *
 * @internal
 */
export const hlsAudio: LazyMediaDefinition = {
  match: matchHls('mse'),
  tag: 'hls-audio',
  load: () => import('../../define/media/hls-audio'),
};
