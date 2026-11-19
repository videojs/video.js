'use client';

import {
  HlsBackgroundVideoAdapter,
  type HlsBackgroundVideoAdapterProps,
} from '@videojs/spf/adapters/hls-background-video';
import { forwardRef, type VideoHTMLAttributes } from 'react';

import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';
import { renderBackgroundVideo, useBackgroundVideo } from './background-video';

// `src` is the only prop the Media owns, taken from the adapter rather than
// restated here so the two can't disagree about what the surface is.
export interface HlsBackgroundVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsBackgroundVideoAdapterProps>,
    Partial<HlsBackgroundVideoAdapterProps>,
    MediaRefProps<HlsBackgroundVideoAdapter>,
    MediaFallbackProps {}

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
 * `loop={false}` and `autoPlay={false}` opt out as `noloop` / `noautoplay` do on `<hls-background-video>`, so a page
 * can play the video once, or hold it until it has checked the motion preference. Muted is fixed: the engine drops
 * audio.
 *
 * `MuxBackgroundVideo` is this component over the MPEG-TS Media, which adds the transmux and nothing else.
 */
export const HlsBackgroundVideo = forwardRef<HTMLVideoElement, HlsBackgroundVideoProps>(function HlsBackgroundVideo(
  { children, fallback = videoFallback, mediaRef, loop = true, autoPlay = true, ...props },
  ref
) {
  const media = useMediaInstance(HlsBackgroundVideoAdapter);
  const videoRef = useBackgroundVideo(media, { mediaRef, loop, autoPlay }, ref);
  const htmlProps = useSyncProps(media, props, HlsBackgroundVideoAdapter.defaultProps);

  return renderBackgroundVideo({ htmlProps, videoRef, loop, autoPlay, children, fallback });
});

export namespace HlsBackgroundVideo {
  export type Props = HlsBackgroundVideoProps;
}
