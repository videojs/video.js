'use client';

import type { SliderPreviewProps as CoreSliderPreviewProps, SliderState } from '@videojs/core';
import { getSliderPreviewStyle } from '@videojs/core/dom';
import { observeResize } from '@videojs/utils/dom';
import type { ForwardedRef } from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext } from './context';

export interface SliderPreviewProps extends CoreSliderPreviewProps, UIComponentProps<'div', SliderState> {}

/** Positioning container for preview content that tracks the pointer along the slider. */
export const SliderPreview = forwardRef(function SliderPreview(
  componentProps: SliderPreviewProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, overflow = 'clamp', ...elementProps } = componentProps;

  const context = useSliderContext();
  const { state } = context;

  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    return observeResize(el, ([entry]) => {
      setWidth(entry!.contentRect.width);
    });
  }, []);

  const positionStyle = getSliderPreviewStyle(width, overflow);

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: context.stateAttrMap,
      ref: [forwardedRef, measureRef],
      props: [{ style: positionStyle }, elementProps],
    }
  );
});

export namespace SliderPreview {
  export type Props = SliderPreviewProps;
}
