'use client';

import { cloudflareVideo } from '../lazy/cloudflare-video';
import { createLazyVideo, type LazyVideoProps } from '../lazy/create';
import { dashVideo } from '../lazy/dash-video';
import { hlsjsVideo } from '../lazy/hlsjs-video';
import { muxVideo } from '../lazy/mux-video';
import { nativeHlsVideo } from '../lazy/native-hls-video';
import { tiktokVideo } from '../lazy/tiktok-video';
import { twitchVideo } from '../lazy/twitch-video';
import { video } from '../lazy/video';
import { vimeoVideo } from '../lazy/vimeo-video';
import { wistiaVideo } from '../lazy/wistia-video';
import { youtubeVideo } from '../lazy/youtube-video';

export type { LazyMediaProps, LazyVideoProps } from '../lazy/create';

/**
 * Plays a video from any supported source by rendering the media component for it, and loads only that component's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `NativeHlsVideo` on Safari and `HlsJsVideo` elsewhere, DASH to
 * `DashVideo`, Mux to `MuxVideo`, and YouTube, Vimeo, Wistia, Cloudflare Stream, TikTok, and Twitch sources to their
 * embed media. Renders nothing for a source it can't resolve. Props are passed to the resolved media, so switching to
 * that component directly only changes the import. Use `createLazyVideo` to add your own media or leave some out.
 *
 * @experimental
 */
export const LazyVideo = createLazyVideo([
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
]);

/** @experimental */
export namespace LazyVideo {
  export type Props = LazyVideoProps;
}
