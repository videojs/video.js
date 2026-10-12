import type { Video } from '@videojs/media';

import type { PlayerJsSource } from './source';

/**
 * The `Video` members the player.js host accepts, plus the source that names the embed. `autoplay`, `defaultMuted`, and
 * `loop` reach every embed over the protocol once it reports `ready`. player.js standardizes no URL parameters, so only
 * for the services the host recognizes (Mux Player, Gumlet, FrameRate, Livid, Bunny Stream, Streamable) are they,
 * `controls`, and `preload` also written onto the embed URL in the service's own spelling. `controls` also decides
 * whether the frame takes pointer input. `playsInline` and `poster` are stored and reported without effect.
 */
export interface PlayerJsAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: PlayerJsSource | null;
}
