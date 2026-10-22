import { type LazyAudioMediaName, type ResolveLazyMediaOptions, resolveLazyAudioMedia } from '@videojs/media';

import { type LazyMediaEntry, LazyMediaElement } from '../lazy-media';

// Each media registers through its own definition module, which loads only once a source needs it.
const MEDIA = {
  audio: { tag: 'audio' },
  'hls-audio': { tag: 'hls-audio', define: () => import('../../define/media/hls-audio') },
  'mux-audio': { tag: 'mux-audio', define: () => import('../../define/media/mux-audio') },
} satisfies Record<LazyAudioMediaName, LazyMediaEntry>;

/**
 * Plays audio from any supported source by rendering the media element for it, and loads only that element's code once
 * the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `<hls-audio>` elsewhere, and Mux
 * sources to `<mux-audio>`. Other attributes are passed to the resolved element, so switching to it directly only
 * changes the tag name.
 */
export class LazyAudio extends LazyMediaElement {
  /** @internal */
  protected readonly mediaEntries = MEDIA;

  /** @internal */
  protected resolveMedia(src: string, options: ResolveLazyMediaOptions): LazyAudioMediaName | null | undefined {
    return resolveLazyAudioMedia(src, options);
  }
}
