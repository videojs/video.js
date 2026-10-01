import { MuxVideo } from '../../../media/mux-video/hls-js';
import { safeDefine } from '../../../registration/safe-define';

export type {
  MuxDrmParams,
  MuxPosterFitMode,
  MuxSource,
  MuxSourceBase,
  MuxVideoAdapter,
  MuxVideoAdapterProps,
} from '@videojs/mux-video';

export class MuxVideoElement extends MuxVideo {
  static readonly tagName = 'mux-video';
}

safeDefine(MuxVideoElement);

declare global {
  /** The Mux video flavors in the build — see `./spf` for why. */
  interface MuxVideoFlavors {
    'hls-js': MuxVideoElement;
  }

  interface HTMLElementTagNameMap {
    // Spelled out rather than `[MuxVideoElement.tagName]`: the sibling flavor
    // declares this same key, and the declaration bundler keeps only one key form
    // per property — a computed one next to a literal one is dropped from the
    // emitted types, taking the mapping with it.
    'mux-video': MuxVideoFlavors[keyof MuxVideoFlavors];
  }
}
