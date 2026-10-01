import { MuxAudio } from '../../../media/mux-audio/spf';
import { safeDefine } from '../../../registration/safe-define';

export type {
  MuxAdapterAPI,
  MuxAdapterProps,
  MuxAudioAdapter,
  MuxContentData,
  MuxSourceBase,
} from '@videojs/mux-audio/spf';

export class MuxAudioElement extends MuxAudio {
  static readonly tagName = 'mux-audio';
}

safeDefine(MuxAudioElement);

declare global {
  /** The Mux audio flavors in the build — see `../mux-video/spf` for why. */
  interface MuxAudioFlavors {
    spf: MuxAudioElement;
  }

  interface HTMLElementTagNameMap {
    'mux-audio': MuxAudioFlavors[keyof MuxAudioFlavors];
    // Only reachable once another flavor holds the primary tag, and only via the
    // override — so it types as `never` in a build where this is the lone flavor.
    'mux-audio-spf': Exclude<keyof MuxAudioFlavors, 'spf'> extends never ? never : MuxAudioElement;
  }
}
