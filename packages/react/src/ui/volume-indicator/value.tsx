'use client';

import { getVolumeIndicatorDisplayValue, type VolumeIndicatorCore } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useVolumeIndicatorContext } from './context';

export interface VolumeIndicatorValueProps extends UIComponentProps<'span', VolumeIndicatorCore.State> {}

export const VolumeIndicatorValue = forwardRef(function VolumeIndicatorValue(
  componentProps: VolumeIndicatorValueProps,
  forwardedRef: ForwardedRef<HTMLSpanElement>
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { state } = useVolumeIndicatorContext();

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      ref: forwardedRef,
      props: [{ children: getVolumeIndicatorDisplayValue(state) }, elementProps],
    }
  );
});

export namespace VolumeIndicatorValue {
  export type Props = VolumeIndicatorValueProps;
}
