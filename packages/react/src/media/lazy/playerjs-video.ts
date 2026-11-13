import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays player.js embeds marked with a `playerjs` query parameter with `PlayerJsVideo`.
 *
 * @internal
 */
export const playerJsVideo: LazyMediaDefinition = {
  match: matchAdapterType('playerjs'),
  source: true,
  load: () => import('../playerjs-video').then((m) => m.PlayerJsVideo),
};
