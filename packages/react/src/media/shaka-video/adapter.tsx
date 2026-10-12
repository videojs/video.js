'use client';

import { ShakaAdapter, type ShakaAdapterProps } from '@videojs/shaka-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';

/** @experimental */
export interface ShakaVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof ShakaAdapterProps>,
    Partial<ShakaAdapterProps>,
    MediaRefProps<ShakaAdapter>,
    MediaFallbackProps {
  children?: ReactNode;
}

/** @experimental */
export const ShakaVideo = forwardRef<HTMLVideoElement, ShakaVideoProps>(function ShakaVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(ShakaAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, ShakaAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
      {fallback}
    </video>
  );
});

/** @experimental */
export namespace ShakaVideo {
  export type Props = ShakaVideoProps;
}
