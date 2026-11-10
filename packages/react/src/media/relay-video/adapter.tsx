'use client';

import { RelayVideoAdapter, type RelayVideoAdapterProps } from '@videojs/relay-video';
import { type CanvasHTMLAttributes, type CSSProperties, forwardRef, type ReactNode, useLayoutEffect } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventPropName, type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

/** @internal */
export interface RelayVideoProps
  extends
    Omit<
      CanvasHTMLAttributes<HTMLCanvasElement>,
      keyof RelayVideoAdapterProps | MediaEventPropName | 'width' | 'height'
    >,
    Partial<RelayVideoAdapterProps>,
    MediaEventProps<RelayVideoAdapter>,
    MediaRefProps<RelayVideoAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
}

// A skin lays out a `<video>`; the canvas takes the same box and the same styling hooks.
const canvasStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  // SAFETY: a custom property reference is a valid `object-fit` value; the type lists only its keywords.
  objectFit: 'var(--media-object-fit, contain)' as CSSProperties['objectFit'],
  objectPosition: 'var(--media-object-position, center)',
};

/**
 * Plays a live Mux Relay broadcast onto a canvas from a subscriber the application holds, given as `source`. The
 * connection stays the application's: the component wants the broadcast's tracks under keys of its own and releases
 * only those.
 *
 * @internal
 */
export const RelayVideo = forwardRef<HTMLCanvasElement, RelayVideoProps>(function RelayVideo(
  { children, mediaRef, style, source = null, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(RelayVideoAdapter);
  const props: Partial<RelayVideoAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const { ref: eventsRef, props: canvasProps } = useMediaEvents(
    useSyncProps<RelayVideoAdapterProps, Record<string, unknown>>(media, props, RelayVideoAdapter.defaultProps),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  // The broadcast starts loading the moment the media has a source, so it is given one only once the refs have run:
  // the event props are listening by then and hear `loadstart`. The media ignores a source it already plays, so
  // assigning on every commit is safe with an inline `source` object.
  useLayoutEffect(() => {
    media.source = source;
  });

  return (
    // A zero-sized bitmap reads as no video until the first frame is drawn; the media sizes it to each frame after.
    <canvas width={0} height={0} style={{ ...canvasStyle, ...style }} {...canvasProps} ref={composedRef}>
      {children}
    </canvas>
  );
});

/** @internal */
export namespace RelayVideo {
  export type Props = RelayVideoProps;
}
