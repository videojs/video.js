'use client';

import { DashAdapter, type DashAdapterProps } from '@videojs/dash-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface DashVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof DashAdapterProps>,
    Partial<DashAdapterProps>,
    MediaRefProps<HTMLVideoElement> {
  children?: ReactNode;
}

export const DashVideo = forwardRef<HTMLVideoElement, DashVideoProps>(function DashVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(DashAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, DashAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

export namespace DashVideo {
  export type Props = DashVideoProps;
}
