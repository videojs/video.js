import type { Video } from '@videojs/media';

import type { MixcloudSource } from './source';

/**
 * The `Video` members the Mixcloud host accepts, plus the source that names the show. The widget is the only UI
 * Mixcloud offers, so `controls` decides whether the host shows it at all. `preload="none"` holds the widget back until
 * playback is requested. `playsInline` and `poster` are kept for a uniform prop shape and stored without effect.
 */
export interface MixcloudAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: MixcloudSource | null;
}
