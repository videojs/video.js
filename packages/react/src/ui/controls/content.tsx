'use client';

import type { ControlsCore } from '@videojs/core';
import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useControlsContext } from './context';

export interface ControlsContentProps extends UIComponentProps<'div', ControlsCore.State> {
  children?: ReactNode | undefined;
}

/** Renders the interactive controls surface. */
export const ControlsContent = forwardRef(function ControlsContent(
  componentProps: ControlsContentProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, children, ...elementProps } = componentProps;
  const { state, stateAttrMap } = useControlsContext();

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: [forwardedRef],
      props: [{ children }, elementProps, { 'data-interactive': '' }],
    }
  );
});

export namespace ControlsContent {
  export type Props = ControlsContentProps;
  export type State = ControlsCore.State;
}
