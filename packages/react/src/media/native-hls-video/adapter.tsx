'use client';

import { NativeHlsAdapter, type NativeHlsAdapterProps } from '@videojs/native-hls-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface NativeHlsVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof NativeHlsAdapterProps>,
    Partial<NativeHlsAdapterProps>,
    MediaRefProps<HTMLVideoElement> {
  children?: ReactNode;
}

export const NativeHlsVideo = forwardRef<HTMLVideoElement, NativeHlsVideoProps>(function NativeHlsVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(NativeHlsAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, NativeHlsAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      {children}
    </video>
  );
});

export namespace NativeHlsVideo {
  export type Props = NativeHlsVideoProps;
}
