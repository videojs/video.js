import type { Video } from '@videojs/media';

import type { TikTokSource } from './source';

/**
 * The `Video` members the TikTok host accepts, plus the source that names the video. `playsInline`, `poster`, and
 * `preload` are stored and reported but never reach the embed: it always plays inline and draws the video's own cover
 * image, and it has no preload parameter.
 *
 * Whatever `preload` says, the host brings TikTok's dormant player up with an `autoplay` it then parks (see
 * `shouldBootstrapTikTokEmbed`), unless `autoplay` wants it playing or `controls` hands playback to TikTok's own
 * chrome. That buys commands the embed answers, not metadata — TikTok reports a duration of 0 until it plays.
 */
export interface TikTokAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: TikTokSource | null;
}
