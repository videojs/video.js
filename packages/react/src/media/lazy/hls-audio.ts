import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through an engine with `HlsAudio`.
 *
 * @internal
 */
export const hlsAudio: LazyMediaDefinition = {
  match: matchHls('mse'),
  fallback: true,
  load: () => import('../hls-audio').then((m) => m.HlsAudio),
};
