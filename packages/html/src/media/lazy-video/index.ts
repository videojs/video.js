import { LazyMediaElement } from '../lazy-media';
import { cloudflareVideo } from './cloudflare-video';
import { dashVideo } from './dash-video';
import { hlsjsVideo } from './hlsjs-video';
import { muxVideo } from './mux-video';
import { nativeHlsVideo } from './native-hls-video';
import { tiktokVideo } from './tiktok-video';
import { twitchVideo } from './twitch-video';
import { video } from './video';
import { vimeoVideo } from './vimeo-video';
import { wistiaVideo } from './wistia-video';
import { youtubeVideo } from './youtube-video';

/**
 * Plays a video from any supported source by rendering the media element for it, and loads only that element's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `<native-hls-video>` on Safari and `<hlsjs-video>` elsewhere, DASH to
 * `<dash-video>`, Mux to `<mux-video>`, and YouTube, Vimeo, Wistia, Cloudflare Stream, TikTok, and Twitch sources to
 * their embed elements. Other attributes are passed to the resolved element, so switching to it directly only changes
 * the tag name. Use `createLazyVideoElement` to add your own media or leave some out.
 *
 * @experimental
 */
export class LazyVideo extends LazyMediaElement {
  /** @internal */
  protected override readonly medias = [
    video,
    nativeHlsVideo,
    hlsjsVideo,
    dashVideo,
    muxVideo,
    youtubeVideo,
    vimeoVideo,
    wistiaVideo,
    cloudflareVideo,
    tiktokVideo,
    twitchVideo,
  ];
}
