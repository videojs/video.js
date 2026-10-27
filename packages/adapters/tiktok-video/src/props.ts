import type { Video } from '@videojs/media';

import type { TikTokSource } from './source';

/**
 * The `Video` members the TikTok host accepts, plus the source that names the video. `playsInline` and `poster` are
 * stored and reported but never reach the embed: it always plays inline and draws the video's own cover image.
 *
 * `preload` reaches no TikTok parameter either, but it is not inert: `'none'` leaves the embed unbuilt until playback
 * is requested (see `shouldDeferTikTokEmbed`). Whatever embed is built, the host brings TikTok's dormant player up with
 * an `autoplay` it then parks (see `shouldBootstrapTikTokEmbed`), unless `autoplay` or a waiting play wants it playing,
 * or `controls` hands playback to TikTok's own chrome. That buys commands the embed answers, not metadata — TikTok
 * reports a duration of 0 until it plays.
 */
export interface TikTokAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: TikTokSource | null;
}
