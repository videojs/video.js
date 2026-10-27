import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays SoundCloud sources with `SoundCloudAudio`.
 *
 * @internal
 */
export const soundcloudAudio: LazyMediaDefinition = {
  match: matchAdapterType('soundcloud'),
  load: () => import('../soundcloud-audio').then((m) => m.SoundCloudAudio),
};
