'use client';

import { VidyardAdapter, type VidyardAdapterProps } from '@videojs/vidyard-video';
import { type CSSProperties, forwardRef, type ReactNode } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface VidyardVideoProps
  extends Partial<VidyardAdapterProps>, MediaEventProps<VidyardAdapter>, MediaRefProps<VidyardAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
  /** Merged over the container's own sizing styles. */
  style?: CSSProperties | undefined;
}

export const VidyardVideo = forwardRef<HTMLDivElement, VidyardVideoProps>(function VidyardVideo(
  // The media owns the container's children, so React renders none.
  { children: _children, mediaRef, style, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(VidyardAdapter);
  const props: Partial<VidyardAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const { ref: eventsRef, props: containerProps } = useMediaEvents(
    useSyncProps<VidyardAdapterProps, Record<string, unknown>>(media, props, VidyardAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);
  const sized: CSSProperties = { position: 'relative', width: '100%', height: '100%', ...style };

  return (
    <div
      data-cross-origin-frame
      {...containerProps}
      // A cross-origin frame swallows every pointer event, so without its own chrome it stays out of hit-testing and the
      // skin above it sees hover and clicks. Merged so a consumer's own styles survive without undoing it.
      style={props.controls ? sized : { ...sized, pointerEvents: 'none' }}
      ref={composedRef}
    />
  );
});

export namespace VidyardVideo {
  export type Props = VidyardVideoProps;
}
