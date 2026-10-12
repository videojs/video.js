'use client';

import type { HlsJsAdapterProps } from '@videojs/hlsjs-video';
import { MuxAudioAdapter, type MuxAudioAdapterProps } from '@videojs/mux-audio';
import { type AudioHTMLAttributes, forwardRef, type ReactNode } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, audioFallback } from '../fallback';

export type { MuxAudioAdapter, MuxAudioAdapterProps, MuxSource } from '@videojs/mux-audio';

// `source` comes from `MuxAudioAdapterProps` only: `MuxSource` extends `HlsSource` with
// Mux identity fields, so the narrower type has to win.
export interface MuxAudioProps
  extends
    Omit<AudioHTMLAttributes<HTMLAudioElement>, keyof HlsJsAdapterProps | keyof MuxAudioAdapterProps>,
    Partial<Omit<HlsJsAdapterProps, 'source'>>,
    Partial<MuxAudioAdapterProps>,
    MediaRefProps<MuxAudioAdapter>,
    MediaFallbackProps {
  children?: ReactNode;
}

export const MuxAudio = forwardRef<HTMLAudioElement, MuxAudioProps>(function MuxAudio(
  { children, fallback = audioFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(MuxAudioAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, MuxAudioAdapter.defaultProps);

  return (
    <audio ref={composedRef} {...htmlProps}>
      {children}
      {fallback}
    </audio>
  );
});

export namespace MuxAudio {
  export type Props = MuxAudioProps;
}
