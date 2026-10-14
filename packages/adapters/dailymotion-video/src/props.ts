import type { Video } from '@videojs/media';

import type { DailymotionSource } from './source';

/**
 * The `Video` members the Dailymotion host accepts, plus the source that names the video and player configuration.
 * `controls` only decides whether the player takes input, since only the configuration can hide its controls, and
 * `playsInline`, `preload`, and `poster` are left to the player.
 */
export interface DailymotionAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: DailymotionSource | null;
}
