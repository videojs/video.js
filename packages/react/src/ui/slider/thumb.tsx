'use client';

import type { SliderState } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext } from './context';

export interface SliderThumbProps extends UIComponentProps<'div', SliderState> {}

/** Draggable handle for setting the slider value. Receives focus and handles keyboard interaction. */
export const SliderThumb = forwardRef(function SliderThumb(
  componentProps: SliderThumbProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, ...elementProps } = componentProps;

  const context = useSliderContext();
  const { state, thumbRef, thumbProps, getAttrs } = context;
  const attrs = getAttrs(state);

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: context.stateAttrMap,
      ref: [forwardedRef, thumbRef],
      props: [attrs, thumbProps, elementProps],
    }
  );
});

export namespace SliderThumb {
  export type Props = SliderThumbProps;
}
