import type { Video } from '@videojs/media';

import type { RemotionSource } from './source';

/**
 * The `Video` members the Remotion host accepts, plus the source that names the composition. `controls`, `playsInline`,
 * and `poster` are stored and reported but never reach Remotion: `<Player>` renders with its own chrome switched off, a
 * composition is a `<div>` that always plays inline, and there is no still to show before the first frame renders.
 */
export interface RemotionAdapterProps extends Pick<
  Video,
  'autoplay' | 'defaultMuted' | 'muted' | 'volume' | 'loop' | 'playbackRate' | 'controls' | 'playsInline' | 'poster'
> {
  source: RemotionSource | null;
}

/**
 * The values Remotion exposes as `<Player>` props rather than as `PlayerRef` methods, so the React façade has to render
 * them. It reads this snapshot through `subscribePlayerProps`/`getPlayerProps`.
 */
export interface RemotionPlayerProps {
  source: RemotionSource | null;
  loop: boolean;
  playbackRate: number;
  initiallyMuted: boolean;
  initialVolume: number;
}
