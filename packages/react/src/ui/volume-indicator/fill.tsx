'use client';

import { VolumeIndicatorCSSVars, type VolumeIndicatorState } from '@videojs/core';
import { isFunction } from '@videojs/utils/predicate';
import type { CSSProperties, ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useVolumeIndicatorContext } from './context';

export interface VolumeIndicatorFillProps extends UIComponentProps<'div', VolumeIndicatorState> {}

export const VolumeIndicatorFill = forwardRef(function VolumeIndicatorFill(
  componentProps: VolumeIndicatorFillProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { state } = useVolumeIndicatorContext();
  const fillStyle = getVolumeIndicatorFillStyle(state, style);

  return renderElement(
    'div',
    { render, className, style: fillStyle },
    {
      state,
      ref: forwardedRef,
      props: [elementProps],
    }
  );
});

export namespace VolumeIndicatorFill {
  export type Props = VolumeIndicatorFillProps;
}

function getVolumeIndicatorFillStyle(
  state: VolumeIndicatorState,
  style: VolumeIndicatorFillProps['style']
): VolumeIndicatorFillProps['style'] {
  const vars = state.fill
    ? ({
        [VolumeIndicatorCSSVars.fill]: state.fill,
      } as CSSProperties)
    : undefined;
  if (!vars) return style;

  if (isFunction(style)) {
    return (nextState) => ({
      ...style(nextState),
      ...vars,
    });
  }

  return {
    ...style,
    ...vars,
  };
}
