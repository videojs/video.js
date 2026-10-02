'use client';

import { HlsVideoAdapter, type HlsVideoAdapterProps } from '@videojs/spf/hls-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface HlsVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsVideoAdapterProps>,
    Partial<HlsVideoAdapterProps>,
    MediaRefProps<HlsVideoAdapter> {
  children?: ReactNode;
}

export const HlsVideo = forwardRef<HTMLVideoElement, HlsVideoProps>(function HlsVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(HlsVideoAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, HlsVideoAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

export namespace HlsVideo {
  export type Props = HlsVideoProps;
}
