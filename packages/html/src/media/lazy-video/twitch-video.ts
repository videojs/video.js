import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Twitch sources with `<twitch-video>`.
 *
 * @internal
 */
export const twitchVideo: LazyMediaDefinition = {
  match: matchAdapterType('twitch'),
  tag: 'twitch-video',
  load: () => import('../../define/media/twitch-video'),
};
