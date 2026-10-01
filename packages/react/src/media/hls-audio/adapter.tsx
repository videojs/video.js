'use client';

import { HlsAudioAdapter, type HlsAudioAdapterProps } from '@videojs/spf/hls-audio';
import { type AudioHTMLAttributes, forwardRef, type ReactNode } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface HlsAudioProps
  extends
    Omit<AudioHTMLAttributes<HTMLAudioElement>, keyof HlsAudioAdapterProps>,
    Partial<HlsAudioAdapterProps>,
    MediaRefProps<HTMLAudioElement> {
  children?: ReactNode;
}

export const HlsAudio = forwardRef<HTMLAudioElement, HlsAudioProps>(function HlsAudio(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(HlsAudioAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, HlsAudioAdapter.defaultProps);

  return (
    <audio ref={composedRef} {...htmlProps}>
      {children}
    </audio>
  );
});

export namespace HlsAudio {
  export type Props = HlsAudioProps;
}
