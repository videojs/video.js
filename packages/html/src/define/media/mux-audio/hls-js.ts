import { MuxAudio } from '../../../media/mux-audio/hls-js';
import { safeDefine } from '../../../registration/safe-define';

export type { MuxAudioAdapter, MuxAudioAdapterProps, MuxSource } from '@videojs/mux-audio';

export class MuxAudioElement extends MuxAudio {
  static readonly tagName = 'mux-audio';
}

safeDefine(MuxAudioElement);

declare global {
  /** The Mux audio flavors in the build — see `../mux-video/spf` for why. */
  interface MuxAudioFlavors {
    'hls-js': MuxAudioElement;
  }

  interface HTMLElementTagNameMap {
    // Spelled out rather than `[MuxAudioElement.tagName]` — see `../mux-video/hls-js`.
    'mux-audio': MuxAudioFlavors[keyof MuxAudioFlavors];
  }
}
