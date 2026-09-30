'use client';

import type { ThumbnailCore, ThumbnailFetchPriority } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { renderElement } from '../../utils/use-render';
import { useThumbnailContext } from './context';

export interface ThumbnailImageProps extends Omit<
  UIComponentProps<'img', ThumbnailCore.State>,
  'crossOrigin' | 'fetchPriority' | 'loading' | 'src'
> {
  /** CORS setting for the selected image. Leave unset to follow the media element, or pass `null` to opt out. */
  crossOrigin?: ThumbnailCore.ImageProps['crossOrigin'];
  /** Image loading strategy. */
  loading?: ThumbnailCore.ImageProps['loading'];
  /** Image fetch priority hint. */
  fetchPriority?: ThumbnailCore.ImageProps['fetchPriority'];
}

/**
 * Displays the image selected and measured by `Thumbnail.Root`.
 *
 * Renders an `img`, so native image attributes and the `render` escape hatch remain available without replacing the
 * root that owns thumbnail state.
 */
export const ThumbnailImage = forwardRef(function ThumbnailImage(
  componentProps: ThumbnailImageProps,
  forwardedRef: ForwardedRef<HTMLImageElement>
) {
  const { render, className, style, crossOrigin, loading, fetchPriority, ...elementProps } = componentProps;
  const { core, state, src, imageStyle, inheritedCrossOrigin, imageRef } = useThumbnailContext();

  // One stable callback, so React does not detach and reattach the image on every render
  // and the root only hears about mounts, unmounts, and `render` swaps.
  const ref = useComposedRefs(forwardedRef, imageRef);

  return renderElement(
    'img',
    { render, className, style },
    {
      state,
      ref,
      props: [
        { alt: '', 'aria-hidden': 'true', decoding: 'async' },
        elementProps,
        {
          src,
          crossOrigin: core.resolveCrossOrigin(crossOrigin, inheritedCrossOrigin),
          loading,
          style: imageStyle,
          // SAFETY: The core and React types contain the same fetch-priority literals; React alone omits `undefined`.
          fetchPriority: fetchPriority as ThumbnailFetchPriority,
        },
      ],
    }
  );
});

export namespace ThumbnailImage {
  export type Props = ThumbnailImageProps;
}
