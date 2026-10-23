import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays player.js embeds marked with a `playerjs` query parameter with `<playerjs-video>`.
 *
 * @internal
 */
export const playerJsVideo: LazyMediaDefinition = {
  match: matchAdapterType('playerjs'),
  tag: 'playerjs-video',
  load: () => import('../../define/media/playerjs-video'),
};
