import { type LazyVideoMediaName, type ResolveLazyMediaOptions, resolveLazyVideoMedia } from '@videojs/media';

import { type LazyMediaEntry, LazyMediaElement } from '../lazy-media';

// Each media registers through its own definition module, which loads only once a source needs it.
const MEDIA = {
  video: { tag: 'video' },
  'native-hls-video': { tag: 'native-hls-video', define: () => import('../../define/media/native-hls-video') },
  'hlsjs-video': { tag: 'hlsjs-video', define: () => import('../../define/media/hlsjs-video') },
  'dash-video': { tag: 'dash-video', define: () => import('../../define/media/dash-video') },
  'mux-video': { tag: 'mux-video', define: () => import('../../define/media/mux-video') },
  'youtube-video': { tag: 'youtube-video', define: () => import('../../define/media/youtube-video') },
  'vimeo-video': { tag: 'vimeo-video', define: () => import('../../define/media/vimeo-video') },
} satisfies Record<LazyVideoMediaName, LazyMediaEntry>;

/**
 * Plays a video from any supported source by rendering the media element for it, and loads only that element's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `<native-hls-video>` on Safari and `<hlsjs-video>` elsewhere, and DASH,
 * Mux, YouTube, and Vimeo sources to `<dash-video>`, `<mux-video>`, `<youtube-video>`, and `<vimeo-video>`. Other
 * attributes are passed to the resolved element, so switching to it directly only changes the tag name.
 */
export class LazyVideo extends LazyMediaElement {
  /** @internal */
  protected readonly mediaEntries = MEDIA;

  /** @internal */
  protected resolveMedia(src: string, options: ResolveLazyMediaOptions): LazyVideoMediaName | null | undefined {
    return resolveLazyVideoMedia(src, options);
  }
}
