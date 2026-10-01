'use client';

import { HlsBackgroundVideoAdapter, type HlsBackgroundVideoAdapterProps } from '@videojs/spf/hls-background-video';
import { forwardRef, useEffect, useRef, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

// `src` is the only prop the Media owns, taken from the adapter rather than
// restated here so the two can't disagree about what the surface is.
export interface HlsBackgroundVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsBackgroundVideoAdapterProps>,
    Partial<HlsBackgroundVideoAdapterProps>,
    MediaRefProps<HTMLVideoElement> {}

/**
 * A muted, looping, chrome-less video over the SPF background-video engine — the React counterpart to
 * `<hls-background-video>`, and the replacement for the standalone `mux-background-video` package's component.
 *
 * `src` is an HLS URL and the whole surface. Capping which rendition is fetched is a param on that URL
 * (`?max_resolution=720p` on a Mux stream, for one) rather than a prop, which keeps the renditions it excludes out of
 * the manifest instead of merely unpicked.
 *
 * There is no structured Mux `source`: playback-ID identity, poster, and storyboard belong to `MuxVideo`, since none of
 * them mean anything without controls to hang them on.
 *
 * `onError` fires for an unplayable source, which it could not do on its own: nothing about one reaches the media
 * element, so the `<video>`'s own `error` stays null at `readyState 0`. The engine reports the condition, the Media
 * promotes the fatal one, and this component re-fires it on the `<video>` — where a handler already listening for a
 * failed source receives it. Which condition it was is on the console and `engine.state.errors`; the handler gets "this
 * source won't play", which is the decision a background video actually has to make.
 *
 * `MuxBackgroundVideo` is this same component under the name the package it replaces used — an alias, not a variant.
 */
export const HlsBackgroundVideo = forwardRef<HTMLVideoElement, HlsBackgroundVideoProps>(function HlsBackgroundVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(HlsBackgroundVideoAdapter);
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, videoRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, HlsBackgroundVideoAdapter.defaultProps);

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
    </video>
  );
});

export namespace HlsBackgroundVideo {
  export type Props = HlsBackgroundVideoProps;
}
