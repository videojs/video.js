import { matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays HLS through the browser's own support with `<native-hls-video>`.
 *
 * @internal
 */
export const nativeHlsVideo: LazyMediaDefinition = {
  match: matchHls('native'),
  tag: 'native-hls-video',
  load: () => import('../../define/media/native-hls-video'),
};
