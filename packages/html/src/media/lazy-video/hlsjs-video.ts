import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through hls.js with `<hlsjs-video>`.
 *
 * @internal
 */
export const hlsjsVideo: LazyMediaDefinition = {
  match: matchHls('mse'),
  tag: 'hlsjs-video',
  load: () => import('../../define/media/hlsjs-video'),
};
