'use client';

import {
  type MediaEventProps,
  type MediaRefProps,
  useComposedRefs,
  useMediaEvents,
  useMediaInstance,
  useMediaRef,
} from '@videojs/react';
import { forwardRef, type ReactNode, type RefCallback, useCallback, useLayoutEffect, useRef } from 'react';

import { GifAdapter, type GifAdapterProps } from './adapter';

export interface GifVideoProps
  extends Partial<GifAdapterProps>, MediaEventProps<GifAdapter>, MediaRefProps<GifAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  children?: ReactNode;
}

// SAFETY: `defaultProps` is typed as the full prop set, so its keys are exactly the declared prop names.
const SYNCED_PROPS = Object.keys(GifAdapter.defaultProps) as (keyof GifAdapterProps)[];

/**
 * Push the declared props onto the adapter each render. A prop the consumer leaves out (or passes as `undefined`) goes
 * back to its default, the way react-dom removes absent attributes. The framework packages keep their version of this
 * helper internal, so the sandbox carries its own.
 */
function useSyncAdapterProps(media: GifAdapter, props: Partial<GifAdapterProps>): void {
  for (const key of SYNCED_PROPS) {
    assign(media, key, props[key] ?? GifAdapter.defaultProps[key]);
  }
}

function assign<Key extends keyof GifAdapterProps>(media: GifAdapter, key: Key, value: GifAdapterProps[Key]): void {
  // The adapter exposes every declared prop as an accessor of the same type, so it is a `GifAdapterProps` itself.
  const target: GifAdapterProps = media;

  if (target[key] !== value) target[key] = value;
}

/** Attach the rendered canvas to the adapter, and detach when it goes away or the component unmounts. */
function useAttachCanvas(media: GifAdapter): RefCallback<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    if (canvasRef.current) media.attach(canvasRef.current);

    return () => media.detach();
  }, [media]);

  return useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;

      if (canvas) media.attach(canvas);
      else media.detach();
    },
    [media]
  );
}

export const GifVideo = forwardRef<HTMLCanvasElement, GifVideoProps>(function GifVideo(
  { children, mediaRef, autoPlay = false, autoplay = autoPlay, className, style, ...rawProps },
  ref
) {
  const media = useMediaInstance(GifAdapter);
  const { ref: eventsRef, props: canvasProps } = useMediaEvents({ ...rawProps, autoplay }, media);

  useSyncAdapterProps(media, canvasProps);

  const attachRef = useAttachCanvas(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` may paint synchronously once frames are decoded.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <canvas role="img" aria-label="Animated GIF" className={className} style={style} ref={composedRef}>
      {children}
    </canvas>
  );
});

export namespace GifVideo {
  export type Props = GifVideoProps;
}
