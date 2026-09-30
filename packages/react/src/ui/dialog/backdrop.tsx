'use client';

import type { DialogCore } from '@videojs/core';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from './context';

export interface DialogBackdropProps extends UIComponentProps<'div', DialogCore.State> {}

/** Presentational layer behind a dialog while it is rendered, including its exit transition. */
export const DialogBackdrop = forwardRef<HTMLDivElement, DialogBackdropProps>(function DialogBackdrop(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { state, stateAttrMap } = useDialogContext();
  if (!state.open) return null;

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

export namespace DialogBackdrop {
  export type Props = DialogBackdropProps;
  export type State = DialogCore.State;
}
