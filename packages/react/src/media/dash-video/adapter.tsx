'use client';

import { DashAdapter, type DashAdapterProps } from '@videojs/dash-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

/** @experimental */
export interface DashVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof DashAdapterProps>,
    Partial<DashAdapterProps>,
    MediaRefProps<DashAdapter> {
  children?: ReactNode;
}

/** @experimental */
export const DashVideo = forwardRef<HTMLVideoElement, DashVideoProps>(function DashVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(DashAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, DashAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

/** @experimental */
export namespace DashVideo {
  export type Props = DashVideoProps;
}
