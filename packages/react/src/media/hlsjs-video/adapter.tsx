'use client';

import { HlsJsAdapter, type HlsJsAdapterProps } from '@videojs/hlsjs-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface HlsJsVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsJsAdapterProps>,
    Partial<HlsJsAdapterProps>,
    MediaRefProps<HTMLVideoElement> {
  children?: ReactNode;
}

export const HlsJsVideo = forwardRef<HTMLVideoElement, HlsJsVideoProps>(function HlsJsVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(HlsJsAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, HlsJsAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

export namespace HlsJsVideo {
  export type Props = HlsJsVideoProps;
}
