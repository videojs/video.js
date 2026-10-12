'use client';

import type { VideoHTMLAttributes } from 'react';
import { forwardRef, useCallback } from 'react';

import { useMediaAttach } from '../../player/context';
import { useComposedRefs } from '../../utils/use-composed-refs';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { type MediaFallbackProps, videoFallback } from '../fallback';

export interface BackgroundVideoProps
  extends VideoHTMLAttributes<HTMLVideoElement>, MediaRefProps<HTMLVideoElement>, MediaFallbackProps {}

export const BackgroundVideo = forwardRef<HTMLVideoElement, BackgroundVideoProps>(function BackgroundVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const setMedia = useMediaAttach();

  const attachRef = useCallback(
    (el: HTMLVideoElement | null) => {
      setMedia?.(el);
    },
    [setMedia]
  );

  const composedRef = useComposedRefs(ref, mediaRef, attachRef);

  return (
    <video ref={composedRef} muted autoPlay loop playsInline disableRemotePlayback disablePictureInPicture {...props}>
      {children}
      {fallback}
    </video>
  );
});

export namespace BackgroundVideo {
  export type Props = BackgroundVideoProps;
}
