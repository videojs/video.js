import type { Video } from '@videojs/media';

import type { HyperFramesSource } from './source';

/**
 * The `Video` members the HyperFrames host accepts, plus the composition it plays and where its runtime is loaded from.
 * `autoplay`, `defaultMuted`, `muted`, and `loop` reach the composition over the runtime bridge once it reports ready.
 * A composition has no native chrome, so `controls` is ignored; `playsInline`, `preload`, and `poster` are stored and
 * reported without effect.
 *
 * @internal
 */
export interface HyperFramesAdapterProps extends Pick<
  Video,
  'src' | 'autoplay' | 'defaultMuted' | 'muted' | 'loop' | 'controls' | 'playsInline' | 'preload' | 'poster'
> {
  source: HyperFramesSource | null;
  /** URL of the HyperFrames runtime build to inject. Defaults to a pinned jsDelivr copy of `@hyperframes/core`. */
  runtimeSrc: string;
}
