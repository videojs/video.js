'use client';

import { getSeekIndicatorDisplayValue, type SeekIndicatorCore } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSeekIndicatorContext } from './context';

export interface SeekIndicatorValueProps extends UIComponentProps<'div', SeekIndicatorCore.State> {}

export const SeekIndicatorValue = forwardRef(function SeekIndicatorValue(
  componentProps: SeekIndicatorValueProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { state } = useSeekIndicatorContext();

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: forwardedRef,
      props: [{ children: getSeekIndicatorDisplayValue(state) }, elementProps],
    }
  );
});

export namespace SeekIndicatorValue {
  export type Props = SeekIndicatorValueProps;
}
