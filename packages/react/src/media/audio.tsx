'use client';

import type { AudioHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { useMediaAttach } from '../player/context';
import { useComposedRefs } from '../utils/use-composed-refs';
import type { MediaRefProps } from '../utils/use-media-ref';
import { type MediaFallbackProps, audioFallback } from './fallback';

export interface AudioProps
  extends AudioHTMLAttributes<HTMLAudioElement>, MediaRefProps<HTMLAudioElement>, MediaFallbackProps {}

export const Audio = forwardRef<HTMLAudioElement, AudioProps>(function Audio(
  { children, fallback = audioFallback, mediaRef, ...props },
  ref
) {
  const setMedia = useMediaAttach();
  const composedRef = useComposedRefs(ref, mediaRef, setMedia);

  return (
    <audio ref={composedRef} {...props}>
      {children}
      {fallback}
    </audio>
  );
});

export namespace Audio {
  export type Props = AudioProps;
}
