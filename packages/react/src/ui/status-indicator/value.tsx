'use client';

import { getStatusIndicatorDisplayValue, type StatusIndicatorState } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useStatusIndicatorContext } from './context';

export interface StatusIndicatorValueProps extends UIComponentProps<'span', StatusIndicatorState> {}

export const StatusIndicatorValue = forwardRef(function StatusIndicatorValue(
  componentProps: StatusIndicatorValueProps,
  forwardedRef: ForwardedRef<HTMLSpanElement>
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { state } = useStatusIndicatorContext();

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      ref: forwardedRef,
      props: [{ children: getStatusIndicatorDisplayValue(state) }, elementProps],
    }
  );
});

export namespace StatusIndicatorValue {
  export type Props = StatusIndicatorValueProps;
}
