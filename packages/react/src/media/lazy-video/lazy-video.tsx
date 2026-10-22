'use client';

import { type LazyVideoMediaName, type Media, resolveLazyVideoMedia } from '@videojs/media';
import { type ComponentType, forwardRef, Suspense, type VideoHTMLAttributes } from 'react';

import type { MediaRefProps } from '../../utils/use-media-ref';
import type { MediaFallbackProps } from '../fallback';
import { type LazyMediaProps, lazyMedia, useNativeHls, useUnresolvedSourceError } from '../lazy-media';
import { Video } from '../video';

const MEDIA = {
  video: Video,
  'native-hls-video': /* @__PURE__ */ lazyMedia(() => import('../native-hls-video'), 'NativeHlsVideo'),
  'hlsjs-video': /* @__PURE__ */ lazyMedia(() => import('../hlsjs-video'), 'HlsJsVideo'),
  'dash-video': /* @__PURE__ */ lazyMedia(() => import('../dash-video'), 'DashVideo'),
  'mux-video': /* @__PURE__ */ lazyMedia(() => import('../mux-video'), 'MuxVideo'),
  'youtube-video': /* @__PURE__ */ lazyMedia(() => import('../youtube-video'), 'YouTubeVideo'),
  'vimeo-video': /* @__PURE__ */ lazyMedia(() => import('../vimeo-video'), 'VimeoVideo'),
  'wistia-video': /* @__PURE__ */ lazyMedia(() => import('../wistia-video'), 'WistiaVideo'),
  'cloudflare-video': /* @__PURE__ */ lazyMedia(() => import('../cloudflare-video'), 'CloudflareVideo'),
  'tiktok-video': /* @__PURE__ */ lazyMedia(() => import('../tiktok-video'), 'TikTokVideo'),
  'twitch-video': /* @__PURE__ */ lazyMedia(() => import('../twitch-video'), 'TwitchVideo'),
} satisfies Record<LazyVideoMediaName, ComponentType<any>>;

// The media that render a `<video>`; embeds render an `<iframe>` or a provider element, which has no fallback content.
const FALLBACK_MEDIA: ReadonlySet<LazyVideoMediaName> = new Set([
  'video',
  'native-hls-video',
  'hlsjs-video',
  'dash-video',
  'mux-video',
]);

/** @experimental */
export interface LazyVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof LazyMediaProps>,
    LazyMediaProps,
    MediaRefProps<Media>,
    MediaFallbackProps {}

/**
 * Plays a video from any supported source by rendering the media component for it, and loads only that component's code
 * once the source is known.
 *
 * Resolves files to a native `<video>`, HLS to `NativeHlsVideo` on Safari and `HlsJsVideo` elsewhere, DASH to
 * `DashVideo`, Mux to `MuxVideo`, and YouTube, Vimeo, Wistia, Cloudflare Stream, TikTok, and Twitch sources to their
 * embed media. Renders nothing for a source it can't resolve. Props are passed to the resolved media, so switching to
 * that component directly only changes the import.
 *
 * @experimental
 */
export const LazyVideo = forwardRef<HTMLVideoElement | HTMLIFrameElement, LazyVideoProps>(function LazyVideo(
  { src = '', type, preferPlayback, preload = 'none', fallback, ...props },
  ref
) {
  // Resolving a source is cheaper than memoizing it, and the compiler's cache is most of this component's size.
  'use no memo';

  const nativeHls = useNativeHls();
  const name = resolveLazyVideoMedia(src, { type, nativeHls, preferPlayback });

  useUnresolvedSourceError('LazyVideo', src, name);

  if (!name) return null;

  // Each media takes the props it understands; the union of their prop types has no common shape to check against.
  const ResolvedMedia: ComponentType<any> = MEDIA[name];
  const fallbackProps = fallback !== undefined && FALLBACK_MEDIA.has(name) ? { fallback } : null;

  return (
    <Suspense fallback={null}>
      <ResolvedMedia ref={ref} {...props} {...fallbackProps} src={src} preload={preload} />
    </Suspense>
  );
});

/** @experimental */
export namespace LazyVideo {
  export type Props = LazyVideoProps;
}
