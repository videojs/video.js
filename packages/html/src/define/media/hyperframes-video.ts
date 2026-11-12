import { HyperFramesVideo } from '../../media/hyperframes-video';
import { safeDefine } from '../../registration/safe-define';

export type {
  HyperFramesAdapter,
  HyperFramesAdapterProps,
  HyperFramesContent,
  HyperFramesMount,
  HyperFramesSource,
  HyperFramesTimeline,
  HyperFramesTimelineFactory,
} from '@videojs/hyperframes-video';

/** @internal */
export class HyperFramesVideoElement extends HyperFramesVideo {
  static readonly tagName = 'hyperframes-video';
}

safeDefine(HyperFramesVideoElement);

declare global {
  interface HTMLElementTagNameMap {
    [HyperFramesVideoElement.tagName]: HyperFramesVideoElement;
  }
}
