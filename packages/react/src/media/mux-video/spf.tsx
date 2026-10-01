'use client';

import { type MuxAdapterProps, MuxVideoAdapter } from '@videojs/mux-video/spf';
import type { HlsVideoAdapterProps } from '@videojs/spf/hls-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import type { MediaRefProps } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { MuxStoryboard } from './storyboard';

// `src` and `source` come from `MuxAdapterProps`: the Mux Adapter owns both, and its
// `source` is the structured Mux one rather than the generic engine's. Both are
// omitted from the base rather than intersected with it — the two `source` types
// describe different things, and an intersection satisfies neither.
export interface MuxVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsVideoAdapterProps | keyof MuxAdapterProps>,
    Partial<Omit<HlsVideoAdapterProps, 'src' | 'source'>>,
    Partial<MuxAdapterProps>,
    MediaRefProps<HTMLVideoElement> {
  children?: ReactNode;
}

export const MuxVideo = forwardRef<HTMLVideoElement, MuxVideoProps>(function MuxVideo(
  { children, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(MuxVideoAdapter);
  const attachRef = useAttachMedia(media);
  const composedRef = useComposedRefs(attachRef, ref, mediaRef);
  const htmlProps = useSyncProps(media, props, MuxVideoAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      <MuxStoryboard media={media} />
      {children}
    </video>
  );
});

export namespace MuxVideo {
  export type Props = MuxVideoProps;
}
