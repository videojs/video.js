import { type LazyAudioMediaName, type ResolveLazyMediaOptions, resolveLazyAudioMedia } from '@videojs/media';

import { type LazyMediaDefinitions, LazyMediaElement } from '../lazy-media';

// Each media registers through its own definition module, which loads only once a source needs it.
const DEFINITIONS: LazyMediaDefinitions<LazyAudioMediaName> = {
  'hls-audio': () => import('../../define/media/hls-audio'),
  'mux-audio': () => import('../../define/media/mux-audio'),
  'spotify-audio': () => import('../../define/media/spotify-audio'),
};

/**
 * Plays audio from any supported source by rendering the media element for it, and loads only that element's code once
 * the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `<hls-audio>` elsewhere, Mux sources to
 * `<mux-audio>`, and Spotify sources to `<spotify-audio>`. Other attributes are passed to the resolved element, so
 * switching to it directly only changes the tag name.
 */
export class LazyAudio extends LazyMediaElement {
  /** @internal */
  protected readonly mediaDefinitions = DEFINITIONS;

  /** @internal */
  protected resolveMedia(src: string, options: ResolveLazyMediaOptions): LazyAudioMediaName | null | undefined {
    return resolveLazyAudioMedia(src, options);
  }
}
