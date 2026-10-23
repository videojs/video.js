import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through hls.js with `HlsJsVideo`.
 *
 * @internal
 */
export const hlsjsVideo: LazyMediaDefinition = {
  match: matchHls('mse'),
  fallback: true,
  load: () => import('../hlsjs-video').then((m) => m.HlsJsVideo),
};
