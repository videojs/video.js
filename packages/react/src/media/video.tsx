'use client';

import type { VideoHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { useMediaAttach } from '../player/context';
import { useComposedRefs } from '../utils/use-composed-refs';

/** Native `<video>` attributes and children forwarded to the rendered media element. */
export interface VideoProps extends VideoHTMLAttributes<HTMLVideoElement> {}

/**
 * Renders a native `<video>` element and forwards its element ref.
 *
 * Inside a Player, the element is registered as the player's current media on mount and detached on unmount. It can
 * also render independently when no Player context is present.
 */
export const Video = forwardRef<HTMLVideoElement, VideoProps>(function Video({ children, ...props }, ref) {
  const setMedia = useMediaAttach();
  const composedRef = useComposedRefs(ref, setMedia);

  return (
    <video ref={composedRef} {...props}>
      {children}
    </video>
  );
});

export namespace Video {
  export type Props = VideoProps;
}
