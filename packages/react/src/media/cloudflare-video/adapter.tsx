'use client';

import { buildCloudflareIframeSrc, CloudflareAdapter, type CloudflareAdapterProps } from '@videojs/cloudflare-video';
import { forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface CloudflareVideoProps
  extends Partial<CloudflareAdapterProps>, MediaEventProps<CloudflareAdapter>, MediaRefProps<CloudflareAdapter> {
  children?: ReactNode;
}

export const CloudflareVideo = forwardRef<HTMLIFrameElement, CloudflareVideoProps>(function CloudflareVideo(
  { children, mediaRef, ...rawProps },
  ref
) {
  const media = useMediaInstance(CloudflareAdapter);
  const props: Partial<CloudflareAdapterProps> & Record<string, unknown> = { ...rawProps };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name a video, so honor it when `src` is absent.
    buildCloudflareIframeSrc(props.src || props.source?.src || '', {
      ...CloudflareAdapter.defaultProps,
      ...props,
      // The embed reads mute once, out of the URL it is rendered with, and either
      // prop says to start muted. Leaving `muted` out of the URL would leave a
      // muted autoplay blocked by the browser, since the embed comes up audible.
      defaultMuted: !!(props.defaultMuted || props.muted),
    })
  );
  const { ref: eventsRef, props: iframeProps } = useMediaEvents(
    useSyncProps<CloudflareAdapterProps, Record<string, unknown>>(media, props, CloudflareAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="Cloudflare Stream video player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.cloudflare?.referrerPolicy}
      {...iframeProps}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace CloudflareVideo {
  export type Props = CloudflareVideoProps;
}
