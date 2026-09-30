'use client';

import type { ThumbnailCore } from '@videojs/core';
import { forwardRef, type ForwardedRef } from 'react';

import { Thumbnail } from '../../thumbnail';
import type { ThumbnailRootProps } from '../../thumbnail/root';
import { useSliderPointerValue } from '../context';

export interface SliderThumbnailRootProps extends Omit<ThumbnailRootProps, 'time'> {}

/**
 * Resolves, sizes, and clips the thumbnail at the slider pointer.
 *
 * Render `Slider.Thumbnail.Image` inside it for the controlled image. Other children can provide loading indicators,
 * overlays, or temporary presentation layers.
 */
export const SliderThumbnailRoot = forwardRef(function SliderThumbnailRoot(
  componentProps: SliderThumbnailRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const pointerValue = useSliderPointerValue();

  return <Thumbnail.Root ref={forwardedRef} {...componentProps} time={pointerValue} />;
});

export namespace SliderThumbnailRoot {
  export type Props = SliderThumbnailRootProps;
  export type State = ThumbnailCore.State;
}
