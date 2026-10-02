'use client';

import type { HlsJsAdapterProps } from '@videojs/hlsjs-video';
import { MuxVideoAdapter, type MuxVideoAdapterProps } from '@videojs/mux-video';
import { forwardRef, type ReactNode, type VideoHTMLAttributes } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';
import { MuxStoryboard } from './storyboard';

export type {
  MuxDrmParams,
  MuxPosterFitMode,
  MuxSource,
  MuxSourceBase,
  MuxVideoAdapter,
  MuxVideoAdapterProps,
} from '@videojs/mux-video';

// `source` comes from `MuxVideoAdapterProps` only: `MuxSource` extends `HlsSource` with
// Mux identity fields, so the narrower type has to win.
export interface MuxVideoProps
  extends
    Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof HlsJsAdapterProps | keyof MuxVideoAdapterProps>,
    Partial<Omit<HlsJsAdapterProps, 'source'>>,
    Partial<MuxVideoAdapterProps>,
    MediaRefProps<MuxVideoAdapter> {
  children?: ReactNode;
}

export const MuxVideo = forwardRef<HTMLVideoElement, MuxVideoProps>(function MuxVideo(
  { children, mediaRef, ...props },
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
    </video>
  );
});

export namespace MuxVideo {
  export type Props = MuxVideoProps;
}
