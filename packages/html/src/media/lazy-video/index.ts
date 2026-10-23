import { LazyMediaElement } from '../lazy-media';
import { cloudflareVideo } from '../lazy/cloudflare-video';
import { dashVideo } from '../lazy/dash-video';
import { hlsjsVideo } from '../lazy/hlsjs-video';
import { muxVideo } from '../lazy/mux-video';
import { nativeHlsVideo } from '../lazy/native-hls-video';
import { playerJsVideo } from '../lazy/playerjs-video';
import { tiktokVideo } from '../lazy/tiktok-video';
import { twitchVideo } from '../lazy/twitch-video';
import { video } from '../lazy/video';
import { vimeoVideo } from '../lazy/vimeo-video';
import { wistiaVideo } from '../lazy/wistia-video';
import { youtubeVideo } from '../lazy/youtube-video';

/**
 * Plays a video from any supported source by rendering the media element for it, and loads only that element's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `<native-hls-video>` on Safari and `<hlsjs-video>` elsewhere, DASH to
 * `<dash-video>`, Mux to `<mux-video>`, YouTube, Vimeo, Wistia, Cloudflare Stream, TikTok, and Twitch sources to their
 * embed elements, and embeds marked with a `playerjs` query parameter to `<playerjs-video>`. Other attributes are
 * passed to the resolved element, so switching to it directly only changes the tag name. Use `createLazyVideoElement`
 * to add your own media or leave some out.
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
    playerJsVideo,
  ];
}
