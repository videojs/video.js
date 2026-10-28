import type { Video } from '@videojs/media';

import type { SpotifySource } from './source';

/**
 * The `Video` members the Spotify host accepts, plus the source that names the entity. Narrower than the other embed
 * hosts by one pair: the embed takes no volume or mute command and reports neither value, so `muted` and `defaultMuted`
 * are absent rather than inert — a prop that cannot reach the player reads as a capability the player has. `poster` has
 * no artwork of its own to replace and `playsInline` no inline-playback switch, so those two are kept for a uniform
 * prop shape but are stored and reported without effect. The embed is built whatever `preload` says: WebKit only plays
 * one that was up before play was pressed.
 */
export interface SpotifyAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: SpotifySource | null;
}
