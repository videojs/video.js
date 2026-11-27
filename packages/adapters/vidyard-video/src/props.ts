import type { Video } from '@videojs/media';

import type { VidyardSource } from './source';

/**
 * The `Video` members the Vidyard host accepts, plus the source that names the player. `controls` shows Vidyard's own
 * controls and is read when the player is built. `playsInline`, `preload`, and `poster` are left to the player.
 */
export interface VidyardAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: VidyardSource | null;
}
