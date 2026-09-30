'use client';

import type { SliderState } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext, useSliderPointerValue } from './context';

export interface SliderValueProps extends UIComponentProps<'output', SliderState> {
  /** Which slider value to display: the current position or the pointer position. */
  type?: 'current' | 'pointer' | undefined;
  /** Custom formatter for the displayed value. Overrides the root's `formatValue`. */
  format?: ((value: number) => string) | undefined;
}

/** Displays a formatted text representation of the slider value. Renders an `<output>` element. */
export const SliderValue = forwardRef(function SliderValue(
  componentProps: SliderValueProps,
  forwardedRef: ForwardedRef<HTMLOutputElement>
) {
  const { render, className, style, type = 'current', format, ...elementProps } = componentProps;

  const context = useSliderContext();
  const { state, formatValue } = context;
  const pointerValue = useSliderPointerValue(type === 'pointer');

  const rawValue = type === 'pointer' ? pointerValue : state.value;

  const text = format ? format(rawValue) : formatValue ? formatValue(rawValue, type) : String(Math.round(rawValue));

  return renderElement(
    'output',
    { render, className, style },
    {
      state,
      stateAttrMap: context.stateAttrMap,
      ref: forwardedRef,
      props: [{ 'aria-live': 'off', children: text }, elementProps],
    }
  );
});

export namespace SliderValue {
  export type Props = SliderValueProps;
}
