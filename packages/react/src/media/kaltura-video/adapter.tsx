'use client';

import type { HlsJsAdapterProps } from '@videojs/hlsjs-video';
import { KalturaVideoAdapter, type KalturaVideoAdapterProps } from '@videojs/kaltura-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';

// `source` comes from `KalturaVideoAdapterProps` only: `KalturaSource` extends `HlsSource` with
// Kaltura identity fields, so the narrower type has to win.
export interface KalturaVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsJsAdapterProps | keyof KalturaVideoAdapterProps>,
    Partial<Omit<HlsJsAdapterProps, 'source'>>,
    Partial<KalturaVideoAdapterProps>,
    MediaRefProps<KalturaVideoAdapter>,
    MediaFallbackProps {
  children?: ReactNode;
}

export const KalturaVideo = forwardRef<HTMLVideoElement, KalturaVideoProps>(function KalturaVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(KalturaVideoAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, KalturaVideoAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
      {fallback}
    </video>
  );
});

export namespace KalturaVideo {
  export type Props = KalturaVideoProps;
}
