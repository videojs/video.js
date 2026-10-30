import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays SoundCloud sources with `<soundcloud-audio>`.
 *
 * @internal
 */
export const soundcloudAudio: LazyMediaDefinition = {
  match: matchAdapterType('soundcloud'),
  tag: 'soundcloud-audio',
  load: () => import('../../define/media/soundcloud-audio'),
};
