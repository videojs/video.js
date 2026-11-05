import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through the browser's own support with `NativeHlsVideo`.
 *
 * @internal
 */
export const nativeHlsVideo: LazyMediaDefinition = {
  match: matchHls('native'),
  fallback: true,
  load: () => import('../native-hls-video').then((m) => m.NativeHlsVideo),
};
