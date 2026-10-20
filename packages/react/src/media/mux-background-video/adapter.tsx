'use client';

import { MuxBackgroundVideoAdapter } from '@videojs/mux-video/spf/background-video';
import type { HlsBackgroundVideoAdapterProps } from '@videojs/spf/adapters/hls-background-video';
import { forwardRef, useEffect, useRef, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';

// `src` is the only prop the Media owns, taken from the adapter rather than
// restated here so the two can't disagree about what the surface is.
export interface MuxBackgroundVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsBackgroundVideoAdapterProps>,
    Partial<HlsBackgroundVideoAdapterProps>,
    MediaRefProps<MuxBackgroundVideoAdapter>,
    MediaFallbackProps {}

/**
 * `HlsBackgroundVideo` over the Mux Media, under the name the standalone `mux-background-video` package's component
 * used.
 *
 * The surface is the same: `src` is an HLS URL and the whole input, capping the rendition is a param on it, and
 * `onError` fires for a source that won't play. What the Mux Media adds is the MPEG-TS transmux, so a plus- or
 * basic-tier Mux playback ID plays here where the HLS-named component refuses it.
 */
export const MuxBackgroundVideo = forwardRef<HTMLVideoElement, MuxBackgroundVideoProps>(function MuxBackgroundVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(MuxBackgroundVideoAdapter);
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, videoRef, ref);
  const htmlProps = useSyncProps(media, props, MuxBackgroundVideoAdapter.defaultProps);

  // Re-fired on the element rather than handed to `onError` directly, so React's
  // own event plumbing delivers it: the handler gets the synthetic event it is
  // typed for, and anything else listening on the node — the consumer's own
  // `addEventListener`, a testing-library assertion — sees the same failure.
  useEffect(() => {
    const forward = () => videoRef.current?.dispatchEvent(new Event('error'));

    media.addEventListener('error', forward);
    return () => media.removeEventListener('error', forward);
  }, [media]);

  return (
    // The same set `<hls-background-video>` forces onto its inner video, so the
    // two platforms present the same surface: silent looping playback with no
    // affordance a UA could hang chrome on — AirPlay, Cast, and picture-in-picture
    // all being things a background video has nowhere to put.
    //
    // Applied after the spread rather than before it, unlike the generic
    // `BackgroundVideo`: they're what the component is for, and attaching the
    // Media re-applies its own anyway, so honoring `muted={false}` would only
    // look like it worked.
    <video
      {...htmlProps}
      ref={composedRef}
      muted
      autoPlay
      loop
      playsInline
      disableRemotePlayback
      disablePictureInPicture
    >
      {children}
      {fallback}
    </video>
  );
});

export namespace MuxBackgroundVideo {
  export type Props = MuxBackgroundVideoProps;
}
