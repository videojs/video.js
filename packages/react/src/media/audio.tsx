'use client';

import type { AudioHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { useMediaAttach } from '../player/context';
import { useComposedRefs } from '../utils/use-composed-refs';
import type { MediaRefProps } from '../utils/use-media-ref';

export interface AudioProps extends AudioHTMLAttributes<HTMLAudioElement>, MediaRefProps<HTMLAudioElement> {}

export const Audio = forwardRef<HTMLAudioElement, AudioProps>(function Audio({ children, mediaRef, ...props }, ref) {
  const setMedia = useMediaAttach();
  const composedRef = useComposedRefs(ref, mediaRef, setMedia);

  return (
    <audio ref={composedRef} {...props}>
      {children}
    </audio>
  );
});

export namespace Audio {
  export type Props = AudioProps;
}
