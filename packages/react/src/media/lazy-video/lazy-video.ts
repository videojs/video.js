'use client';

import { cloudflareVideo } from './cloudflare-video';
import { createLazyVideo, type LazyVideoProps } from './create';
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

export type { LazyMediaProps, LazyVideoProps } from './create';

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
