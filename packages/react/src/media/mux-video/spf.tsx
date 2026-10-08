'use client';

import { type MuxAdapterProps, MuxVideoAdapter } from '@videojs/mux-video/spf';
import type { HlsVideoAdapterProps } from '@videojs/spf/hls-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { type MediaFallbackProps, videoFallback } from '../fallback';
import { MuxStoryboard } from './storyboard';

export type {
  MuxAdapterAPI,
  MuxAdapterProps,
  MuxContentData,
  MuxSourceBase,
  MuxVideoAdapter,
} from '@videojs/mux-video/spf';

// `src` and `source` come from `MuxAdapterProps`: the Mux Adapter owns both, and its
// `source` is the structured Mux one rather than the generic engine's. Both are
// omitted from the base rather than intersected with it — the two `source` types
// describe different things, and an intersection satisfies neither.
export interface MuxVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsVideoAdapterProps | keyof MuxAdapterProps>,
    Partial<Omit<HlsVideoAdapterProps, 'src' | 'source'>>,
    Partial<MuxAdapterProps>,
    MediaRefProps<MuxVideoAdapter>,
    MediaFallbackProps {
  children?: ReactNode;
}

export const MuxVideo = forwardRef<HTMLVideoElement, MuxVideoProps>(function MuxVideo(
  { children, fallback = videoFallback, mediaRef, ...props },
  ref
) {
  const media = useMediaInstance(MuxVideoAdapter);
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, ref);
  const htmlProps = useSyncProps(media, props, MuxVideoAdapter.defaultProps);

  return (
    <video ref={composedRef} {...htmlProps}>
      <MuxStoryboard media={media} />
      {children}
      {fallback}
    </video>
  );
});

export namespace MuxVideo {
  export type Props = MuxVideoProps;
}
