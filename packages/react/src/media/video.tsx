'use client';

import type { VideoHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { useMediaAttach } from '../player/context';
import { useComposedRefs } from '../utils/use-composed-refs';
import type { MediaRefProps } from '../utils/use-media-ref';
import { type MediaFallbackProps, videoFallback } from './fallback';

/** Native `<video>` attributes and children forwarded to the rendered media element. */
export interface VideoProps
  extends VideoHTMLAttributes<HTMLVideoElement>, MediaRefProps<HTMLVideoElement>, MediaFallbackProps {}

/**
 * Renders a native `<video>` element and forwards its element ref.
 *
 * Inside a Player, the element is registered as the player's current media on mount and detached on unmount. It can
 * also render independently when no Player context is present.
 */
export const Video = forwardRef<HTMLVideoElement, VideoProps>(function Video(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const setMedia = useMediaAttach();
  const composedRef = useComposedRefs(ref, mediaRef, setMedia);

  return (
    <video ref={composedRef} {...props}>
      {children}
      {fallback}
    </video>
  );
});

export namespace Video {
  export type Props = VideoProps;
}
