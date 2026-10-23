import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Spotify sources with `<spotify-audio>`.
 *
 * @internal
 */
export const spotifyAudio: LazyMediaDefinition = {
  match: matchAdapterType('spotify'),
  tag: 'spotify-audio',
  load: () => import('../../define/media/spotify-audio'),
};
