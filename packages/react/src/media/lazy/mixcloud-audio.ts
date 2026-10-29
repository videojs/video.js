import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Mixcloud sources with `MixcloudAudio`.
 *
 * @internal
 */
export const mixcloudAudio: LazyMediaDefinition = {
  match: matchAdapterType('mixcloud'),
  load: () => import('../mixcloud-audio').then((m) => m.MixcloudAudio),
};
