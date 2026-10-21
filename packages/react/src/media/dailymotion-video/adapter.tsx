'use client';

import { DailymotionAdapter, type DailymotionAdapterProps } from '@videojs/dailymotion-video';
import { type CSSProperties, forwardRef, type ReactNode } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface DailymotionVideoProps
  extends Partial<DailymotionAdapterProps>, MediaEventProps<DailymotionAdapter>, MediaRefProps<DailymotionAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
  /** Merged over the container's own sizing and hit-testing styles. */
  style?: CSSProperties | undefined;
}

export const DailymotionVideo = forwardRef<HTMLDivElement, DailymotionVideoProps>(function DailymotionVideo(
  // The SDK owns the container's children, so React renders none.
  { children: _children, mediaRef, style, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(DailymotionAdapter);
  const props: Partial<DailymotionAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const { ref: eventsRef, props: containerProps } = useMediaEvents(
    useSyncProps<DailymotionAdapterProps, Record<string, unknown>>(media, props, DailymotionAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <div
      data-cross-origin-frame
      {...containerProps}
      // Without `controls`, keep the cross-origin frame out of hit-testing so the skin above it sees hover.
      style={{ width: '100%', height: '100%', ...(!props.controls && { pointerEvents: 'none' }), ...style }}
      ref={composedRef}
    />
  );
});

export namespace DailymotionVideo {
  export type Props = DailymotionVideoProps;
}
