import type { Video } from '@videojs/media';

import type { SoundCloudSource } from './source';

/**
 * The `Video` members the SoundCloud host accepts, plus the source that names the track or set. The widget is the only
 * UI SoundCloud offers, so `controls` decides whether the host shows it at all. `preload="none"` holds the widget back
 * until playback is requested. `playsInline` and `poster` are kept for a uniform prop shape and stored without effect.
 */
export interface SoundCloudAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: SoundCloudSource | null;
}
