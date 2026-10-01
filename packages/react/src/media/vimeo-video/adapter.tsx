'use client';

import { buildVimeoIframeSrc, VimeoAdapter, type VimeoAdapterProps } from '@videojs/vimeo-video';
import { forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface VimeoVideoProps
  extends Partial<VimeoAdapterProps>, MediaEventProps<VimeoAdapter>, MediaRefProps<VimeoAdapter> {
  children?: ReactNode;
}

export const VimeoVideo = forwardRef<HTMLIFrameElement, VimeoVideoProps>(function VimeoVideo(
  { children, mediaRef, ...rawProps },
  ref
) {
  const media = useMediaInstance(VimeoAdapter);
  const props: Partial<VimeoAdapterProps> & Record<string, unknown> = { ...rawProps };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name a video, so honor it when `src` is absent.
    buildVimeoIframeSrc(props.src || props.source?.src || '', { ...VimeoAdapter.defaultProps, ...props })
  );
  const { ref: eventsRef, props: iframeProps } = useMediaEvents(
    useSyncProps<VimeoAdapterProps, Record<string, unknown>>(media, props, VimeoAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="Vimeo video player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.vimeo?.referrerPolicy}
      {...iframeProps}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace VimeoVideo {
  export type Props = VimeoVideoProps;
}
