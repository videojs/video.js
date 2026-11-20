'use client';

import {
  HyperFramesAdapter,
  type HyperFramesAdapterProps,
  type HyperFramesSource,
  type HyperFramesTimelineFactory,
} from '@videojs/hyperframes-video';
import { type CSSProperties, forwardRef, type ReactNode, useCallback, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

/** @internal */
export interface HyperFramesVideoProps
  extends
    Partial<Omit<HyperFramesAdapterProps, 'source'>>,
    MediaEventProps<HyperFramesAdapter>,
    MediaRefProps<HyperFramesAdapter> {
  /**
   * The composition markup: clips timed with `data-start` and `data-duration`. It renders into the composition frame,
   * so it is styled by the styles it carries rather than the page's.
   */
  children?: ReactNode;
  /** Builds the composition's timeline from its root once the markup is in the frame. Only read for `children`. */
  timeline?: HyperFramesTimelineFactory | undefined;
  /** A whole composition document, played instead of `children`. */
  html?: string | undefined;
  /**
   * Names the composition. A new `compositionId` is a new composition and restarts playback; anything else that changes
   * between renders updates the one playing. Defaults to `main`.
   */
  compositionId?: string | undefined;
  /** Composition width in pixels, when the markup does not declare `data-width`. Defaults to 1920. */
  width?: number | undefined;
  /** Composition height in pixels, when the markup does not declare `data-height`. Defaults to 1080. */
  height?: number | undefined;
  /** Plays this source instead of the one the other props describe. */
  source?: HyperFramesSource | null | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

const FRAME_STYLE: CSSProperties = { position: 'relative', overflow: 'hidden', width: '100%', height: '100%' };
// A composition has no chrome of its own: the skin above it takes every pointer event.
const IFRAME_STYLE: CSSProperties = { pointerEvents: 'none' };

/**
 * Plays a HyperFrames composition written as JSX children, or a composition document from `html` or `src`. The children
 * render through a portal into the composition frame, where the HyperFrames runtime plays them.
 *
 * @internal
 */
export const HyperFramesVideo = forwardRef<HTMLIFrameElement, HyperFramesVideoProps>(function HyperFramesVideo(
  {
    children,
    timeline,
    html,
    src,
    compositionId,
    width,
    height,
    source: sourceProp,
    className,
    style,
    mediaRef,
    ...rawProps
  },
  ref
) {
  const media = useMediaInstance(HyperFramesAdapter);
  const [mounting, setMounting] = useState<{ root: HTMLElement; resolve: () => void } | null>(null);

  // The adapter mounts the markup when the composition document loads, and waits for the portal to commit it.
  const mount = useCallback((root: HTMLElement) => new Promise<void>((resolve) => setMounting({ root, resolve })), []);

  useLayoutEffect(() => mounting?.resolve(), [mounting]);

  const source =
    sourceProp !== undefined
      ? sourceProp
      : buildSource({ children, mount, timeline, html, src, compositionId, width, height });

  const { ref: eventsRef, props: frameProps } = useMediaEvents(
    useSyncProps<HyperFramesAdapterProps, Record<string, unknown>>(
      media,
      { ...rawProps, source },
      HyperFramesAdapter.defaultProps
    ),
    media
  );
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` starts the load, which dispatches `loadstart`.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <div className={className} style={style ? { ...FRAME_STYLE, ...style } : FRAME_STYLE} {...frameProps}>
      <iframe ref={composedRef} title="HyperFrames composition" allow="autoplay; fullscreen" style={IFRAME_STYLE} />
      {mounting && source?.content === mount ? createPortal(children, mounting.root) : null}
    </div>
  );
});

/** @internal */
export namespace HyperFramesVideo {
  export type Props = HyperFramesVideoProps;
}

function buildSource({
  children,
  mount,
  timeline,
  html,
  src,
  compositionId,
  width,
  height,
}: {
  children: ReactNode;
  mount: (container: HTMLElement) => Promise<void>;
  timeline: HyperFramesTimelineFactory | undefined;
  html: string | undefined;
  src: string | undefined;
  compositionId: string | undefined;
  width: number | undefined;
  height: number | undefined;
}): HyperFramesSource | null {
  const named = {
    ...(compositionId && { id: compositionId }),
    ...(width && { width }),
    ...(height && { height }),
  };

  if (children != null && children !== false) return { ...named, content: mount, ...(timeline && { timeline }) };

  if (html) return { ...named, html };

  if (src) return { ...named, src };

  return null;
}
