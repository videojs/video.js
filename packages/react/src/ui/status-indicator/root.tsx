'use client';

import { createInputIndicatorLabels, StatusIndicatorCore, StatusIndicatorDataAttrs } from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import { useTranslator } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useInputIndicatorRoot } from '../input-indicator/use-input-indicator-root';
import { StatusIndicatorProvider } from './context';

export interface StatusIndicatorRootProps
  extends UIComponentProps<'div', StatusIndicatorCore.State>, Omit<StatusIndicatorCore.Props, 'labels'> {}

export const StatusIndicatorRoot = forwardRef(function StatusIndicatorRoot(
  componentProps: StatusIndicatorRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, actions, closeDelay, deriveCustomStatus, ...elementProps } = componentProps;
  const translator = useTranslator();
  const { elementRef, present, state } = useInputIndicatorRoot(
    () => new StatusIndicatorCore(),
    {
      actions,
      closeDelay,
      deriveCustomStatus,
      labels: createInputIndicatorLabels(translator),
    },
    { replayOnUpdate: false }
  );
  if (!present) return null;

  return (
    <StatusIndicatorProvider value={{ state }}>
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          stateAttrMap: StatusIndicatorDataAttrs,
          ref: [forwardedRef, elementRef],
          props: [elementProps],
        }
      )}
    </StatusIndicatorProvider>
  );
});

export namespace StatusIndicatorRoot {
  export type Props = StatusIndicatorRootProps;
  export type State = StatusIndicatorCore.State;
}
