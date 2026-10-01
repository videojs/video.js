'use client';

import { buildYouTubeIframeSrc, YouTubeAdapter, type YouTubeAdapterProps } from '@videojs/youtube-video';
import { forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface YouTubeVideoProps
  extends Partial<YouTubeAdapterProps>, MediaEventProps<YouTubeAdapter>, MediaRefProps<YouTubeAdapter> {
  children?: ReactNode;
}

export const YouTubeVideo = forwardRef<HTMLIFrameElement, YouTubeVideoProps>(function YouTubeVideo(
  { children, mediaRef, ...rawProps },
  ref
) {
  const media = useMediaInstance(YouTubeAdapter);
  const props: Partial<YouTubeAdapterProps> & Record<string, unknown> = { ...rawProps };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name a video, so honor it when `src` is absent.
    buildYouTubeIframeSrc(props.src || props.source?.src || '', { ...YouTubeAdapter.defaultProps, ...props })
  );
  const { ref: eventsRef, props: iframeProps } = useMediaEvents(
    useSyncProps<YouTubeAdapterProps, Record<string, unknown>>(media, props, YouTubeAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="YouTube video player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.youtube?.referrerPolicy}
      {...iframeProps}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace YouTubeVideo {
  export type Props = YouTubeVideoProps;
}
