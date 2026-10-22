'use client';

import { type LazyVideoMediaName, type Media, resolveLazyVideoMedia } from '@videojs/media';
import { type ComponentType, forwardRef, lazy, Suspense, type VideoHTMLAttributes } from 'react';

import type { MediaRefProps } from '../../utils/use-media-ref';
import type { MediaFallbackProps } from '../fallback';
import { type LazyMediaProps, useNativeHls, useUnresolvedSourceError } from '../lazy-media';
import { Video } from '../video';

// Module-level so each component keeps its identity across renders; deriving one during render would remount the media.
const MEDIA = {
  video: Video,
  'native-hls-video': /* @__PURE__ */ lazy(() =>
    import('../native-hls-video').then((m) => ({ default: m.NativeHlsVideo }))
  ),
  'hlsjs-video': /* @__PURE__ */ lazy(() => import('../hlsjs-video').then((m) => ({ default: m.HlsJsVideo }))),
  'dash-video': /* @__PURE__ */ lazy(() => import('../dash-video').then((m) => ({ default: m.DashVideo }))),
  'mux-video': /* @__PURE__ */ lazy(() => import('../mux-video').then((m) => ({ default: m.MuxVideo }))),
  'youtube-video': /* @__PURE__ */ lazy(() => import('../youtube-video').then((m) => ({ default: m.YouTubeVideo }))),
  'vimeo-video': /* @__PURE__ */ lazy(() => import('../vimeo-video').then((m) => ({ default: m.VimeoVideo }))),
} satisfies Record<LazyVideoMediaName, ComponentType<any>>;

// Embeds render an `<iframe>`, which has no fallback content.
const EMBEDS: ReadonlySet<LazyVideoMediaName> = new Set(['youtube-video', 'vimeo-video']);

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
 * Resolves files to a native `<video>`, HLS to `NativeHlsVideo` on Safari and `HlsJsVideo` elsewhere, and DASH, Mux,
 * YouTube, and Vimeo sources to `DashVideo`, `MuxVideo`, `YouTubeVideo`, and `VimeoVideo`. Renders nothing for a source
 * it can't resolve. Props are passed to the resolved media, so switching to that component directly only changes the
 * import.
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
  const fallbackProps = fallback !== undefined && !EMBEDS.has(name) ? { fallback } : null;

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
