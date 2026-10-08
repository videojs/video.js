'use client';

import { HlsJsAdapter, type HlsJsAdapterProps } from '@videojs/hlsjs-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';

export interface HlsJsVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsJsAdapterProps>,
    Partial<HlsJsAdapterProps>,
    MediaRefProps<HlsJsAdapter>,
    MediaFallbackProps {
  children?: ReactNode;
}

export const HlsJsVideo = forwardRef<HTMLVideoElement, HlsJsVideoProps>(function HlsJsVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(HlsJsAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, HlsJsAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
      {fallback}
    </video>
  );
});

export namespace HlsJsVideo {
  export type Props = HlsJsVideoProps;
}
