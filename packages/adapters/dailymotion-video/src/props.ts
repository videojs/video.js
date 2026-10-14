import type { Video } from '@videojs/media';

import type { DailymotionSource } from './source';

/**
 * The `Video` members the Dailymotion host accepts, plus the source that names the video and the player configuration
 * to embed it with. Several never reach the player as such: `autoplay` and `defaultMuted`, which the player
 * configuration decides and the host applies by command once the player is ready; `controls`, which only the player
 * configuration can turn off; and `playsInline`, `preload`, and `poster`, which the player decides for itself.
 */
export interface DailymotionAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: DailymotionSource | null;
}
