'use client';

import type { ControlsCore } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useControlsContext } from './context';

export interface ControlsBackdropProps extends UIComponentProps<'div', ControlsCore.State> {}

/**
 * Presentational layer behind player controls. Renders a `<div>` with the controls state data attributes so skins can
 * style it without reaching across sibling components.
 */
export const ControlsBackdrop = forwardRef<HTMLDivElement, ControlsBackdropProps>(function ControlsBackdrop(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { state, stateAttrMap } = useControlsContext();

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: [forwardedRef],
      props: [{ role: 'presentation', 'aria-hidden': true }, elementProps],
    }
  );
});

export namespace ControlsBackdrop {
  export type Props = ControlsBackdropProps;
  export type State = ControlsCore.State;
}
