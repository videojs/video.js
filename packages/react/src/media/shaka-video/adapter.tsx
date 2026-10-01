'use client';

import { ShakaAdapter, type ShakaAdapterProps } from '@videojs/shaka-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface ShakaVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof ShakaAdapterProps>,
    Partial<ShakaAdapterProps>,
    MediaRefProps<HTMLVideoElement> {
  children?: ReactNode;
}

export const ShakaVideo = forwardRef<HTMLVideoElement, ShakaVideoProps>(function ShakaVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(ShakaAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, ShakaAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

export namespace ShakaVideo {
  export type Props = ShakaVideoProps;
}
