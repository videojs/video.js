'use client';

import type { DialogCore } from '@videojs/core';
import { forwardRef, useCallback } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from './context';

export interface DialogCloseProps extends UIComponentProps<'button', DialogCore.State> {}

/** Renders a button that closes the dialog. */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { render, className, style, disabled, ...elementProps },
  forwardedRef
) {
  const { dialog, state, stateAttrMap } = useDialogContext();

  const handleClick = useCallback(() => {
    if (!disabled) dialog.close();
  }, [dialog, disabled]);

  return renderElement(
    'button',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: forwardedRef,
      props: [{ type: 'button' as const, disabled, onClick: handleClick }, elementProps],
    }
  );
});

export namespace DialogClose {
  export type Props = DialogCloseProps;
  export type State = DialogCore.State;
}
