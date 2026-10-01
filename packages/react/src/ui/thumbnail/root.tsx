'use client';

import {
  mapCuesToThumbnails,
  ThumbnailCore,
  ThumbnailDataAttrs,
  type ThumbnailProps,
  type ThumbnailState,
} from '@videojs/core';
import { createThumbnail, selectFullscreen, selectTextTrack } from '@videojs/core/dom';
import type { CSSProperties, ForwardedRef } from 'react';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import { useOptionalPlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useDestroy } from '../../utils/use-destroy';
import { renderElement } from '../../utils/use-render';
import { ThumbnailProvider } from './context';

export interface ThumbnailRootProps extends UIComponentProps<'div', ThumbnailState>, ThumbnailProps {}

/**
 * Resolves, sizes, and clips a thumbnail for a point in time.
 *
 * Renders a `div` and exposes `data-hidden`, `data-loading`, and `data-error` for styling every layer in the preview.
 * Render `Thumbnail.Image` inside it for the image the root controls and measures.
 */
export const ThumbnailRoot = forwardRef(function ThumbnailRoot(
  componentProps: ThumbnailRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  // Image state and measured CSS constraints mutate outside React, so every forced render must recompute them.
  'use no memo';

  const { render, className, style, time = 0, thumbnails: externalThumbnails, ...elementProps } = componentProps;

  const [core] = useState(() => new ThumbnailCore());
  const divRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const textTrack = useOptionalPlayer(selectTextTrack);

  // Fullscreen container queries change the constraints without resizing an explicitly sized thumbnail.
  useOptionalPlayer(selectFullscreen);

  // Force a render when the image loads, fails, or the root is resized.
  const [, setRenderToken] = useState(0);
  const [handle] = useState(() =>
    createThumbnail({
      getContainer: () => divRef.current,
      getImg: () => imgRef.current,
      onStateChange: () => setRenderToken((token) => token + 1),
    })
  );

  useDestroy(handle, () => handle.connect());

  // The image reports itself through this ref, so a mount, unmount, or `render` swap rebinds without an effect.
  const imageRef = useCallback(
    (img: HTMLImageElement | null) => {
      const previous = imgRef.current;

      imgRef.current = img;

      if (img) handle.connect();
      else if (previous) handle.disconnectImg(previous);
    },
    [handle]
  );

  // A supplied list takes priority over automatic <track> detection.
  const thumbnails = useMemo(() => {
    if (externalThumbnails && externalThumbnails.length > 0) return externalThumbnails;

    const thumbnailsTrack = textTrack?.thumbnailsTrack;

    return thumbnailsTrack && thumbnailsTrack.cues.length > 0
      ? mapCuesToThumbnails(thumbnailsTrack.cues, thumbnailsTrack.src ?? undefined)
      : [];
  }, [externalThumbnails, textTrack]);

  const thumbnail = useMemo(() => core.findActiveThumbnail(thumbnails, time), [core, thumbnails, time]);

  handle.updateSrc(thumbnail?.url);

  const state = core.getState(handle.loading, handle.error, thumbnail);

  let containerStyle: CSSProperties = { overflow: 'hidden' };
  let imageStyle: CSSProperties | undefined;

  if (thumbnail && handle.naturalWidth && handle.naturalHeight) {
    const constraints = handle.readConstraints();
    const result = core.resize(thumbnail, handle.naturalWidth, handle.naturalHeight, constraints);

    if (result) {
      containerStyle = {
        overflow: 'hidden',
        width: result.containerWidth,
        height: result.containerHeight,
      };
      imageStyle = {
        width: result.imageWidth,
        height: result.imageHeight,
        maxWidth: 'none',
        transform:
          result.offsetX || result.offsetY ? `translate(-${result.offsetX}px, -${result.offsetY}px)` : undefined,
      };
    }
  }

  return (
    <ThumbnailProvider
      value={{
        core,
        state,
        src: thumbnail?.url,
        imageStyle,
        // Only `<track>`-sourced thumbnails follow the media element's CORS mode.
        inheritedCrossOrigin: externalThumbnails?.length ? undefined : textTrack?.thumbnailsTrack?.crossOrigin,
        imageRef,
      }}
    >
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          stateAttrMap: ThumbnailDataAttrs,
          ref: [forwardedRef, divRef],
          props: [core.getAttrs(state), { style: containerStyle }, elementProps],
        }
      )}
    </ThumbnailProvider>
  );
});

export namespace ThumbnailRoot {
  export type Props = ThumbnailRootProps;
  export type State = ThumbnailState;
}
