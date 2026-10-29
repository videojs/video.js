import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Mixcloud sources with `<mixcloud-audio>`.
 *
 * @internal
 */
export const mixcloudAudio: LazyMediaDefinition = {
  match: matchAdapterType('mixcloud'),
  tag: 'mixcloud-audio',
  load: () => import('../../define/media/mixcloud-audio'),
};
