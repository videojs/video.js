import { type LazyVideoMediaName, type ResolveLazyMediaOptions, resolveLazyVideoMedia } from '@videojs/media';

import { type LazyMediaDefinitions, LazyMediaElement } from '../lazy-media';

// Each media registers through its own definition module, which loads only once a source needs it.
const DEFINITIONS: LazyMediaDefinitions<LazyVideoMediaName> = {
  'native-hls-video': () => import('../../define/media/native-hls-video'),
  'hlsjs-video': () => import('../../define/media/hlsjs-video'),
  'dash-video': () => import('../../define/media/dash-video'),
  'mux-video': () => import('../../define/media/mux-video'),
  'youtube-video': () => import('../../define/media/youtube-video'),
  'vimeo-video': () => import('../../define/media/vimeo-video'),
  'wistia-video': () => import('../../define/media/wistia-video'),
  'cloudflare-video': () => import('../../define/media/cloudflare-video'),
  'tiktok-video': () => import('../../define/media/tiktok-video'),
  'twitch-video': () => import('../../define/media/twitch-video'),
};

/**
 * Plays a video from any supported source by rendering the media element for it, and loads only that element's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `<native-hls-video>` on Safari and `<hlsjs-video>` elsewhere, DASH to
 * `<dash-video>`, Mux to `<mux-video>`, and YouTube, Vimeo, Wistia, Cloudflare Stream, TikTok, and Twitch sources to
 * their embed elements. Other attributes are passed to the resolved element, so switching to it directly only changes
 * the tag name.
 */
export class LazyVideo extends LazyMediaElement {
  /** @internal */
  protected readonly mediaDefinitions = DEFINITIONS;

  /** @internal */
  protected resolveMedia(src: string, options: ResolveLazyMediaOptions): LazyVideoMediaName | null | undefined {
    return resolveLazyVideoMedia(src, options);
  }
}
