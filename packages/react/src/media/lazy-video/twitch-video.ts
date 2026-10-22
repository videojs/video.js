import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Twitch sources with `TwitchVideo`.
 *
 * @internal
 */
export const twitchVideo: LazyMediaDefinition = {
  match: matchAdapterType('twitch'),
  load: () => import('../twitch-video').then((m) => m.TwitchVideo),
};
