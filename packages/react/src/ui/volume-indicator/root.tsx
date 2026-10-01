'use client';

import {
  createInputIndicatorLabels,
  VolumeIndicatorCore,
  VolumeIndicatorDataAttrs,
  type VolumeIndicatorProps,
  type VolumeIndicatorState,
} from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import { useTranslator } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useInputIndicatorRoot } from '../input-indicator/use-input-indicator-root';
import { VolumeIndicatorProvider } from './context';

export interface VolumeIndicatorRootProps
  extends UIComponentProps<'div', VolumeIndicatorState>, Omit<VolumeIndicatorProps, 'labels'> {}

export const VolumeIndicatorRoot = forwardRef(function VolumeIndicatorRoot(
  componentProps: VolumeIndicatorRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, closeDelay, ...elementProps } = componentProps;
  const translator = useTranslator();
  const { elementRef, present, state } = useInputIndicatorRoot(
    () => new VolumeIndicatorCore(),
    {
      closeDelay,
      labels: createInputIndicatorLabels(translator),
    },
    { replayOnUpdate: false }
  );
  if (!present) return null;

  return (
    <VolumeIndicatorProvider value={{ state }}>
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          stateAttrMap: VolumeIndicatorDataAttrs,
          ref: [forwardedRef, elementRef],
          props: [elementProps],
        }
      )}
    </VolumeIndicatorProvider>
  );
});

export namespace VolumeIndicatorRoot {
  export type Props = VolumeIndicatorRootProps;
  export type State = VolumeIndicatorState;
}
