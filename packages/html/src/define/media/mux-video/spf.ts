import { MuxVideo } from '../../../media/mux-video/spf';
import { safeDefine } from '../../../registration/safe-define';

export type {
  MuxAdapterAPI,
  MuxAdapterProps,
  MuxContentData,
  MuxSourceBase,
  MuxVideoAdapter,
} from '@videojs/mux-video/spf';

export class MuxVideoElement extends MuxVideo {
  static readonly tagName = 'mux-video';
}

safeDefine(MuxVideoElement);

declare global {
  /**
   * The Mux video flavors in the build, keyed by engine.
   *
   * Both flavors are the same element over a different engine, so both claim `<mux-video>` and the import path is what
   * chooses. Each flavor's define entry adds its own key here, so the tag types as the flavor that was imported — or as
   * the union of both when both were, which is the load-order coin flip that a single type per key cannot describe any
   * better.
   *
   * Importing both is not a supported configuration: one registration wins and the other is dropped. `safeDefine`'s
   * tag-name override is the escape hatch for putting the loser somewhere reachable, `<mux-video-spf>` by convention.
   */
  interface MuxVideoFlavors {
    spf: MuxVideoElement;
  }

  interface HTMLElementTagNameMap {
    'mux-video': MuxVideoFlavors[keyof MuxVideoFlavors];
    // Only reachable once another flavor holds the primary tag, and only via the
    // override — so it types as `never` in a build where this is the lone flavor.
    'mux-video-spf': Exclude<keyof MuxVideoFlavors, 'spf'> extends never ? never : MuxVideoElement;
  }
}
