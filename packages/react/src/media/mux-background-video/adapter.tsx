'use client';

import type { HlsBackgroundVideoAdapterProps } from '@videojs/spf/adapters/hls-background-video';
import { HlsBackgroundVideoMpegTsAdapter as MuxBackgroundVideoAdapter } from '@videojs/spf/adapters/hls-background-video-mpeg-ts';
import { forwardRef, type VideoHTMLAttributes } from 'react';

import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';
import { renderBackgroundVideo, useBackgroundVideo } from '../hls-background-video/background-video';

// `src` is the only prop the Media owns, taken from the adapter rather than
// restated here so the two can't disagree about what the surface is.
export interface MuxBackgroundVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsBackgroundVideoAdapterProps>,
    Partial<HlsBackgroundVideoAdapterProps>,
    MediaRefProps<MuxBackgroundVideoAdapter>,
    MediaFallbackProps {}

/**
 * `HlsBackgroundVideo` over the MPEG-TS Media, under the name the standalone `mux-background-video` package's component
 * used.
 *
 * The surface is the same: `src` is an HLS URL and the whole input, capping the rendition is a param on it, `onError`
 * fires for a source that won't play, and `loop={false}` / `autoPlay={false}` opt out of looping and autoplay. What the
 * MPEG-TS Media adds is the transmux, so a plus-tier Mux playback ID plays here where the HLS-named component refuses
 * it.
 */
export const MuxBackgroundVideo = forwardRef<HTMLVideoElement, MuxBackgroundVideoProps>(function MuxBackgroundVideo(
  { children, fallback = videoFallback, mediaRef, loop = true, autoPlay = true, ...props },
  ref
) {
  const media = useMediaInstance(MuxBackgroundVideoAdapter);
  const videoRef = useBackgroundVideo(media, { mediaRef, loop, autoPlay }, ref);
  const htmlProps = useSyncProps(media, props, MuxBackgroundVideoAdapter.defaultProps);

  return renderBackgroundVideo({ htmlProps, videoRef, loop, autoPlay, children, fallback });
});

export namespace MuxBackgroundVideo {
  export type Props = MuxBackgroundVideoProps;
}
