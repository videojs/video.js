import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Spotify sources with `SpotifyAudio`.
 *
 * @internal
 */
export const spotifyAudio: LazyMediaDefinition = {
  match: matchAdapterType('spotify'),
  load: () => import('../spotify-audio').then((m) => m.SpotifyAudio),
};
